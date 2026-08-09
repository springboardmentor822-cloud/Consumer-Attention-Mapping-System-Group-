"""
Repository pattern for the new `tracking_data` table. Keeps raw SQL /
ORM query logic out of the routers, matching the CRUDService pattern
already used for Milestone 1 resources (see app/services/crud.py) but
kept separate so Milestone 1 code is never touched.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.camera import Camera
from app.models.store import Store
from app.models.tracking_data import TrackingData
from app.models.zone import Zone

logger = logging.getLogger(__name__)


class TrackingPersistenceError(Exception):
    def __init__(self, error: str, details: str, fix: str) -> None:
        self.error = error
        self.details = details
        self.fix = fix
        super().__init__(details)


class TrackingRepository:
    """Data-access layer for tracking_data. Injected into services via DI (get_db)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def resolve_tracking_context(self, camera_id: int, zone_id: int | None) -> tuple[int, int | None]:
        try:
            camera = self.db.get(Camera, camera_id)
            if camera is None:
                camera = self.db.query(Camera).order_by(Camera.id.asc()).first()

            if camera is None:
                store = self.db.query(Store).order_by(Store.id.asc()).first()
                if store is None:
                    raise TrackingPersistenceError(
                        error="missing_store",
                        details="No store exists, so a default camera cannot be created.",
                        fix="Create a store before processing videos.",
                    )

                camera = Camera(
                    store_id=store.id,
                    camera_name="Default AI Camera",
                    camera_ip="0.0.0.0",
                    camera_location="AI Video Processing",
                    status="Online",
                    description="Auto-created for video processing",
                )
                self.db.add(camera)
                self.db.flush()
                logger.info("Created default camera id=%s for store_id=%s", camera.id, store.id)

            resolved_zone_id = zone_id
            if zone_id is not None:
                zone = self.db.get(Zone, zone_id)
                if zone is None or zone.store_id != camera.store_id:
                    zone = (
                        self.db.query(Zone)
                        .filter(Zone.store_id == camera.store_id)
                        .order_by(Zone.id.asc())
                        .first()
                    )

                    if zone is None:
                        zone = Zone(
                            store_id=camera.store_id,
                            zone_name="Default AI Zone",
                            description="Auto-created for video processing",
                        )
                        self.db.add(zone)
                        self.db.flush()
                        logger.info("Created default zone id=%s for store_id=%s", zone.id, camera.store_id)

                    resolved_zone_id = zone.id

            self.db.commit()
            logger.info(
                "Resolved tracking context requested_camera_id=%s requested_zone_id=%s camera_id=%s zone_id=%s",
                camera_id,
                zone_id,
                camera.id,
                resolved_zone_id,
            )
            return camera.id, resolved_zone_id
        except TrackingPersistenceError:
            self.db.rollback()
            raise
        except IntegrityError as exc:
            self.db.rollback()
            logger.exception("Database integrity error while resolving tracking context")
            raise TrackingPersistenceError(
                error="tracking_context_failed",
                details=str(exc.orig),
                fix="Verify stores, cameras, and zones are valid, then retry.",
            ) from exc
        except Exception as exc:
            self.db.rollback()
            logger.exception("Unexpected error while resolving tracking context")
            raise TrackingPersistenceError(
                error="tracking_context_failed",
                details=str(exc),
                fix="Check database connectivity and retry.",
            ) from exc

    def bulk_save(self, records: list[dict]) -> int:
        """Bulk-insert coordinate records. Returns number of rows saved."""
        if not records:
            return 0

        self._validate_records(records)

        try:
            objects = [
                TrackingData(
                    customer_id=r["customer_id"],
                    camera_id=r["camera"],
                    zone_id=r.get("zone"),
                    frame_number=r["frame"],
                    x=r["x"],
                    y=r["y"],
                    confidence=r.get("confidence", 0.0),
                    # generate_coordinate_record() already computes a real
                    # per-frame time.time() value - use it instead of letting
                    # the column's server_default=func.now() apply. Postgres
                    # resolves now() once per transaction, so every row from
                    # one bulk_save() would otherwise share an identical
                    # timestamp, collapsing any dwell/speed calculation on
                    # batch-processed video to zero regardless of how much
                    # real video time it spans. Falls back to func.now() (by
                    # simply omitting the field) for any caller that doesn't
                    # supply one.
                    **(
                        {"timestamp": datetime.fromtimestamp(r["timestamp"], tz=timezone.utc)}
                        if r.get("timestamp") is not None
                        else {}
                    ),
                )
                for r in records
            ]
            self.db.add_all(objects)
            self.db.commit()
            logger.info("Saved %d tracking records to database", len(objects))
            return len(objects)
        except IntegrityError as exc:
            self.db.rollback()
            logger.exception("Database integrity error while saving tracking records")
            raise TrackingPersistenceError(
                error="tracking_data_insert_failed",
                details=str(exc.orig),
                fix="Verify camera_id and zone_id refer to existing cameras/zones before processing.",
            ) from exc
        except Exception as exc:
            self.db.rollback()
            logger.exception("Unexpected error while saving tracking records")
            raise TrackingPersistenceError(
                error="tracking_data_insert_failed",
                details=str(exc),
                fix="Check the tracking payload and database connection, then retry.",
            ) from exc

    def _validate_records(self, records: list[dict]) -> None:
        required_fields = {"customer_id", "camera", "frame", "x", "y"}
        for index, record in enumerate(records):
            missing = required_fields - record.keys()
            if missing:
                raise TrackingPersistenceError(
                    error="invalid_tracking_record",
                    details=f"Tracking record {index} is missing required fields: {sorted(missing)}",
                    fix="Ensure detection, tracking, and coordinate generation completed before saving.",
                )
            try:
                customer_id = int(record["customer_id"])
                camera_id = int(record["camera"])
                if record.get("zone") is not None:
                    int(record["zone"])
            except (TypeError, ValueError) as exc:
                raise TrackingPersistenceError(
                    error="invalid_tracking_record",
                    details=f"Tracking record {index} has invalid ids: {record}",
                    fix="Ensure customer_id, camera_id, and zone_id values are numeric.",
                ) from exc

            if customer_id <= 0:
                raise TrackingPersistenceError(
                    error="invalid_customer_id",
                    details=f"Tracking record {index} has invalid customer_id: {record['customer_id']}",
                    fix="Verify ByteTrack produced a valid tracker/customer id.",
                )
            if camera_id <= 0:
                raise TrackingPersistenceError(
                    error="invalid_camera_id",
                    details=f"Tracking record {index} has invalid camera_id: {record['camera']}",
                    fix="Call the API with a positive existing camera_id.",
                )

        camera_ids = {int(record["camera"]) for record in records}
        existing_cameras = {
            camera.id: camera
            for camera in self.db.query(Camera).filter(Camera.id.in_(camera_ids)).all()
        }
        missing_cameras = sorted(camera_ids - set(existing_cameras))
        if missing_cameras:
            raise TrackingPersistenceError(
                error="missing_camera",
                details=f"camera_id does not exist: {missing_cameras}",
                fix="Create the camera first or call the API with an existing camera_id.",
            )

        zone_ids = {int(record["zone"]) for record in records if record.get("zone") is not None}
        if not zone_ids:
            logger.debug("Saving %d tracking records for cameras=%s with no zone_id", len(records), sorted(camera_ids))
            return

        existing_zones = {
            zone.id: zone
            for zone in self.db.query(Zone).filter(Zone.id.in_(zone_ids)).all()
        }
        missing_zones = sorted(zone_ids - set(existing_zones))
        if missing_zones:
            raise TrackingPersistenceError(
                error="missing_zone",
                details=f"zone_id does not exist: {missing_zones}",
                fix="Create the zone first, omit zone_id, or call the API with an existing zone_id.",
            )

        camera_store_ids = {camera.id: camera.store_id for camera in existing_cameras.values()}
        invalid_pairs = sorted(
            {
                (int(record["camera"]), int(record["zone"]))
                for record in records
                if record.get("zone") is not None
                and existing_zones[int(record["zone"])].store_id != camera_store_ids[int(record["camera"])]
            }
        )
        if invalid_pairs:
            raise TrackingPersistenceError(
                error="camera_zone_mismatch",
                details=f"camera_id and zone_id belong to different stores: {invalid_pairs}",
                fix="Use a zone that belongs to the same store as the camera.",
            )

        logger.debug(
            "Validated %d tracking records for cameras=%s zones=%s",
            len(records),
            sorted(camera_ids),
            sorted(zone_ids),
        )

    def get_history(
        self,
        customer_id: int | None = None,
        camera_id: int | None = None,
        zone_id: int | None = None,
        limit: int = 500,
    ) -> list[TrackingData]:
        query = self.db.query(TrackingData)

        if customer_id is not None:
            query = query.filter(TrackingData.customer_id == customer_id)
        if camera_id is not None:
            query = query.filter(TrackingData.camera_id == camera_id)
        if zone_id is not None:
            query = query.filter(TrackingData.zone_id == zone_id)

        return query.order_by(TrackingData.timestamp.desc()).limit(limit).all()

    def get_points_in_range(
        self,
        camera_ids: list[int] | None = None,
        zone_ids: list[int] | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
        limit: int = 20000,
    ) -> list[TrackingData]:
        """Raw points for a scope + date range, for the analytics engine
        (app/analytics/) to segment into visits - unlike get_history(), this
        takes lists (a store's many cameras/zones at once) and a bounded
        range instead of a single id and an unbounded tail."""
        query = self.db.query(TrackingData)
        if camera_ids is not None:
            query = query.filter(TrackingData.camera_id.in_(camera_ids))
        if zone_ids is not None:
            query = query.filter(TrackingData.zone_id.in_(zone_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        if until is not None:
            query = query.filter(TrackingData.timestamp <= until)
        return query.order_by(TrackingData.customer_id.asc(), TrackingData.timestamp.asc()).limit(limit).all()

    def get_customer_path(self, customer_id: int, limit: int = 1000) -> list[TrackingData]:
        return (
            self.db.query(TrackingData)
            .filter(TrackingData.customer_id == customer_id)
            .order_by(TrackingData.frame_number.asc())
            .limit(limit)
            .all()
        )

    def latest_timestamp(self, camera_ids: list[int] | None = None) -> datetime | None:
        query = self.db.query(func.max(TrackingData.timestamp))
        if camera_ids is not None:
            query = query.filter(TrackingData.camera_id.in_(camera_ids))
        return query.scalar()

    def get_recent_points(
        self,
        seconds: int = 30,
        limit: int = 200,
        camera_ids: list[int] | None = None,
    ) -> list[TrackingData]:
        """Points from the most recent `seconds`-wide window, anchored to the
        latest recorded activity rather than wall-clock 'now'. A batch-processed
        video's data then stays visible for its full window instead of vanishing
        the moment real time drifts past when it happened to be processed. When
        tracking really is live (a camera actively streaming), the anchor keeps
        advancing with 'now' anyway, so behavior is unchanged in that case."""
        anchor = self.latest_timestamp(camera_ids)
        if anchor is None:
            return []

        cutoff = anchor - timedelta(seconds=seconds)
        query = self.db.query(TrackingData).filter(
            TrackingData.timestamp >= cutoff, TrackingData.timestamp <= anchor
        )
        if camera_ids is not None:
            query = query.filter(TrackingData.camera_id.in_(camera_ids))
        return query.order_by(TrackingData.timestamp.desc()).limit(limit).all()

    def heatmap_points(
        self,
        camera_id: int | None = None,
        zone_id: int | None = None,
        camera_ids: list[int] | None = None,
    ) -> list[TrackingData]:
        query = self.db.query(TrackingData)
        if camera_id is not None:
            query = query.filter(TrackingData.camera_id == camera_id)
        elif camera_ids is not None:
            query = query.filter(TrackingData.camera_id.in_(camera_ids))
        if zone_id is not None:
            query = query.filter(TrackingData.zone_id == zone_id)
        return query.all()

    def count_for_store_cameras(self, camera_ids: list[int], since: datetime | None = None) -> int:
        if not camera_ids:
            return 0
        query = self.db.query(TrackingData).filter(TrackingData.camera_id.in_(camera_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        return query.count()

    def unique_customers_for_cameras(self, camera_ids: list[int], since: datetime | None = None) -> int:
        if not camera_ids:
            return 0
        query = self.db.query(TrackingData.customer_id).filter(TrackingData.camera_id.in_(camera_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        return query.distinct().count()

    def unique_customers_for_zones(self, zone_ids: list[int], since: datetime | None = None) -> int:
        if not zone_ids:
            return 0
        query = self.db.query(TrackingData.customer_id).filter(TrackingData.zone_id.in_(zone_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        return query.distinct().count()

    def busiest_zone(self, zone_ids: list[int]) -> int | None:
        if not zone_ids:
            return None
        row = (
            self.db.query(TrackingData.zone_id, func.count(TrackingData.id).label("hits"))
            .filter(TrackingData.zone_id.in_(zone_ids))
            .group_by(TrackingData.zone_id)
            .order_by(func.count(TrackingData.id).desc())
            .first()
        )
        return row[0] if row else None

    def avg_dwell_seconds(self, camera_ids: list[int], since: datetime | None = None) -> float:
        """Average visit duration, in seconds.

        Deliberately NOT a simple (max(timestamp) - min(timestamp)) grouped by
        customer_id. ByteTrack assigns tracker ids per processing session and
        restarts from 1 each run, so "customer 1" is a different real person in
        every processed video. Grouping naively across all history therefore
        measured the span between two unrelated people who happened to share an
        id - which produced real, absurd output on this deployment: an average
        "dwell time" of 7,534 minutes (5.2 days) per customer on the Store
        Manager dashboard.

        Instead this segments each id's points into discrete visits (a gap
        larger than MAX_VISIT_GAP_SECONDS starts a new visit), reusing the same
        segmentation the analytics engine uses so both report the same numbers.
        """
        from app.analytics.dwell_time import segment_all_sessions  # local import: avoids a package-level cycle

        if not camera_ids:
            return 0.0

        query = self.db.query(TrackingData).filter(TrackingData.camera_id.in_(camera_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        rows = query.order_by(TrackingData.customer_id.asc(), TrackingData.timestamp.asc()).all()

        # Sessions rather than zone-scoped visits: this KPI answers "how long
        # was this person around", so walking between zones shouldn't end the
        # measurement. Per-zone dwell is reported separately by the analytics
        # engine's dwell_by_zone, which does use zone-scoped visits.
        sessions = segment_all_sessions(rows)
        if not sessions:
            return 0.0
        return sum(s.duration_seconds for s in sessions) / len(sessions)

    def shelf_behavior_metrics(self, camera_ids: list[int], since: datetime | None = None) -> dict[int, dict]:
        """Per-camera dwell + engagement, for shelf-level attractiveness scoring
        and optimization recommendations (see app/analytics/attractiveness.py
        and app/analytics/recommendations.py).

        Reuses the same Visit segmentation as the rest of the analytics engine
        (see avg_dwell_seconds's docstring for why raw customer_id grouping is
        wrong) so these numbers stay consistent with what the dwell/engagement
        dashboards already report - not a separate ad-hoc calculation.

        Returns {camera_id: {"visit_count", "avg_dwell_seconds",
        "avg_engagement_score"}}. A camera_id absent from the result has no
        tracking data yet - callers must treat that as "no data", not as zero
        engagement, since zero is a real (bad) score and "no data" isn't.
        """
        from app.analytics.dwell_time import group_by_camera, segment_all_visits
        from app.analytics.engagement import compute_engagement_for_visits

        if not camera_ids:
            return {}

        query = self.db.query(TrackingData).filter(TrackingData.camera_id.in_(camera_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        rows = query.order_by(TrackingData.customer_id.asc(), TrackingData.timestamp.asc()).all()
        if not rows:
            return {}

        visits = segment_all_visits(rows)
        by_camera = group_by_camera(visits)

        result: dict[int, dict] = {}
        for camera_id, camera_visits in by_camera.items():
            if not camera_visits:
                continue
            engagement_results = compute_engagement_for_visits(camera_visits)
            avg_dwell = sum(v.duration_seconds for v in camera_visits) / len(camera_visits)
            avg_engagement = (
                sum(e.engagement_score for e in engagement_results) / len(engagement_results)
                if engagement_results
                else 0.0
            )
            result[camera_id] = {
                "visit_count": len(camera_visits),
                "avg_dwell_seconds": round(avg_dwell, 1),
                "avg_engagement_score": round(avg_engagement, 1),
            }
        return result

    def peak_hour(self, camera_ids: list[int], since: datetime | None = None) -> int | None:
        """Hour-of-day (0-23) with the most tracking activity in the window."""
        if not camera_ids:
            return None
        query = self.db.query(
            func.extract("hour", TrackingData.timestamp).label("hour"),
            func.count(TrackingData.id).label("hits"),
        ).filter(TrackingData.camera_id.in_(camera_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        row = query.group_by("hour").order_by(func.count(TrackingData.id).desc()).first()
        return int(row.hour) if row else None

    def counts_by_hour(self, camera_ids: list[int], since: datetime | None = None) -> dict[int, int]:
        """Tracking-record counts bucketed by hour-of-day, for a visitors-by-hour chart."""
        if not camera_ids:
            return {}
        query = self.db.query(
            func.extract("hour", TrackingData.timestamp).label("hour"),
            func.count(func.distinct(TrackingData.customer_id)).label("hits"),
        ).filter(TrackingData.camera_id.in_(camera_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        rows = query.group_by("hour").all()
        return {int(row.hour): int(row.hits) for row in rows}

    def counts_by_zone(self, zone_ids: list[int], since: datetime | None = None) -> dict[int, int]:
        """Unique-customer counts bucketed by zone, for a visitors-by-zone chart."""
        if not zone_ids:
            return {}
        query = self.db.query(
            TrackingData.zone_id,
            func.count(func.distinct(TrackingData.customer_id)).label("hits"),
        ).filter(TrackingData.zone_id.in_(zone_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        rows = query.group_by(TrackingData.zone_id).all()
        return {int(row.zone_id): int(row.hits) for row in rows if row.zone_id is not None}

    def zone_transitions(
        self, zone_ids: list[int], since: datetime | None = None
    ) -> list[tuple[int, int, int]]:
        """
        (from_zone_id, to_zone_id, count) for every time a customer's zone
        changed between two consecutive tracking points - the raw material
        for a journey/flow view. Computed in Python rather than SQL window
        functions to stay portable; tracking_data volumes are small enough
        that this isn't a bottleneck.
        """
        if not zone_ids:
            return []
        query = self.db.query(TrackingData).filter(
            TrackingData.zone_id.in_(zone_ids), TrackingData.zone_id.isnot(None)
        )
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        from app.analytics.metrics import MAX_VISIT_GAP_SECONDS  # local import: avoids a package-level cycle

        rows = query.order_by(TrackingData.customer_id.asc(), TrackingData.timestamp.asc()).all()

        transitions: dict[tuple[int, int], int] = {}
        last_customer: int | None = None
        last_zone: int | None = None
        last_timestamp: datetime | None = None
        for row in rows:
            # A gap this large means the previous point belongs to a different
            # session - and because ByteTrack ids restart every processing run,
            # almost certainly a different real person. Without this guard the
            # last zone of one video was chained to the first zone of the next
            # as if one shopper had walked between them, which inflated this
            # panel to dozens of "transitions" while only a handful of sessions
            # genuinely touched more than one zone.
            gap_too_large = (
                last_timestamp is not None
                and (row.timestamp - last_timestamp).total_seconds() > MAX_VISIT_GAP_SECONDS
            )
            if row.customer_id != last_customer or gap_too_large:
                last_customer = row.customer_id
                last_zone = row.zone_id
                last_timestamp = row.timestamp
                continue
            if row.zone_id != last_zone:
                key = (last_zone, row.zone_id)
                transitions[key] = transitions.get(key, 0) + 1
                last_zone = row.zone_id
            last_timestamp = row.timestamp

        return [(f, t, c) for (f, t), c in transitions.items()]

    def customer_engagement(
        self, camera_ids: list[int], since: datetime | None = None
    ) -> list[dict]:
        """
        Per-visit (dwell_seconds, zones_visited) - the raw material for
        segmentation.

        One row per *visit*, not per customer_id, for the same reason
        avg_dwell_seconds() segments: a ByteTrack id is only unique within one
        processing session, so treating an id as one continuous person across
        all history inflated every dwell time and pushed effectively every
        record into the "Highly Engaged (10min+)" bucket regardless of real
        behaviour.
        """
        from app.analytics.dwell_time import segment_all_sessions  # local import: avoids a package-level cycle

        if not camera_ids:
            return []
        query = self.db.query(TrackingData).filter(TrackingData.camera_id.in_(camera_ids))
        if since is not None:
            query = query.filter(TrackingData.timestamp >= since)
        rows = query.order_by(TrackingData.customer_id.asc(), TrackingData.timestamp.asc()).all()

        # Sessions, not zone-scoped visits: a visit is single-zone by
        # construction, so using it here made zones_visited always 1 and
        # reported "0% of customers visited more than one zone" even while the
        # journey-flow panel showed dozens of real zone-to-zone movements.
        return [
            {
                "customer_id": session.customer_id,
                "dwell_seconds": session.duration_seconds,
                "zones_visited": session.zones_visited,
            }
            for session in segment_all_sessions(rows)
        ]
