import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.app.core.database import SessionLocal
from backend.app.models.tracking import CoordinateLog, ShopperSession
from backend.app.models.journey import CustomerJourney
from backend.app.models.zone import Zone

logger = logging.getLogger(__name__)

# Timeout in seconds before an unseen shopper is considered to have exited the store
TRACKING_LOST_TIMEOUT_SECONDS = 5.0

class SpatialEngine:
    """
    Real-Time Spatial Intelligence Engine.
    Handles tracking live shoppers, matching coordinates to zones,
    and calculating dwell times and trajectories.
    """
    def __init__(self):
        # Cache of zones: store_id -> list of zones
        self.zones_cache: Dict[UUID, List[Zone]] = {}
        self.last_cache_update: datetime = None
        
        # In-memory active shopper state
        # { (store_id, camera_id, shopper_id): { current_zone_id, entered_at, last_seen_at, path_data, ... } }
        self.active_shoppers: Dict[tuple, Dict[str, Any]] = {}
        
        self.lock = asyncio.Lock()

    def _refresh_zones_cache(self, db: Session, store_id: UUID):
        """Refreshes the zone cache for a specific store."""
        zones = db.scalars(select(Zone).where(Zone.store_id == store_id)).all()
        self.zones_cache[store_id] = list(zones)
        self.last_cache_update = datetime.now(timezone.utc)
        logger.info(f"SpatialEngine: Refreshed {len(zones)} zones for store {store_id}")

    def _get_zone_for_coordinate(self, store_id: UUID, x: float, y: float, db: Session) -> Optional[Zone]:
        """Returns the zone the coordinate falls into, if any."""
        if store_id not in self.zones_cache:
            self._refresh_zones_cache(db, store_id)
            
        for zone in self.zones_cache.get(store_id, []):
            coords = zone.coordinates
            x_min, y_min = float(coords.get("x_min", 0)), float(coords.get("y_min", 0))
            x_max, y_max = float(coords.get("x_max", 100)), float(coords.get("y_max", 100))
            
            if x_min <= x <= x_max and y_min <= y <= y_max:
                return zone
                
        return None

    async def process_batch(self, batch: List[CoordinateLog]):
        """
        Process a batch of coordinates, updating shopper states and detecting zone transitions.
        This must run quickly without blocking the video stream.
        """
        if not batch:
            return
            
        db = SessionLocal()
        try:
            async with self.lock:
                for coord in batch:
                    # Ignore non-shoppers (products)
                    if not coord.shopper_id.startswith("Shopper"):
                        continue
                        
                    store_id = coord.store_id
                    camera_id = coord.camera_id
                    shopper_id = coord.shopper_id
                    
                    state_key = (store_id, camera_id, shopper_id)
                    
                    # 1. Resolve Zone
                    zone = self._get_zone_for_coordinate(store_id, coord.x, coord.y, db)
                    zone_id = str(zone.id) if zone else None
                    zone_name = zone.zone_name if zone else None
                    
                    # 2. Update Active Shopper State
                    if state_key not in self.active_shoppers:
                        # New shopper detected
                        self.active_shoppers[state_key] = {
                            "session_uuid": None, # Will be created on exit
                            "current_zone_id": zone_id,
                            "current_zone_name": zone_name,
                            "entered_at": coord.timestamp,
                            "last_seen_at": coord.timestamp,
                            "path_data": [],
                            "zone_dwell_times": {},
                            "zones_visited": [],
                            "zone_transition_sequence": []
                        }
                        if zone_id:
                            logger.info(f"[ZONE ENTER] {camera_id}/{shopper_id} -> {zone_name}")
                            self.active_shoppers[state_key]["zones_visited"].append(zone_name)
                            self.active_shoppers[state_key]["zone_transition_sequence"].append(zone_name)
                    else:
                        state = self.active_shoppers[state_key]
                        prev_zone_id = state["current_zone_id"]
                        
                        # Store path coordinate
                        state["path_data"].append({"x": coord.x, "y": coord.y, "t": coord.timestamp.isoformat()})
                        
                        if prev_zone_id != zone_id:
                            # Zone Transition!
                            dwell_time = (coord.timestamp - state["entered_at"]).total_seconds()
                            if prev_zone_id:
                                prev_zone_name = state["current_zone_name"]
                                logger.info(f"[ZONE EXIT] {camera_id}/{shopper_id} <- {prev_zone_name} (dwell: {dwell_time:.1f}s)")
                                # Record dwell
                                state["zone_dwell_times"][prev_zone_name] = state["zone_dwell_times"].get(prev_zone_name, 0) + dwell_time
                            
                            if zone_id:
                                logger.info(f"[ZONE ENTER] {camera_id}/{shopper_id} -> {zone_name}")
                                if zone_name not in state["zones_visited"]:
                                    state["zones_visited"].append(zone_name)
                                state["zone_transition_sequence"].append(zone_name)
                                
                            # Update state
                            state["current_zone_id"] = zone_id
                            state["current_zone_name"] = zone_name
                            state["entered_at"] = coord.timestamp
                        else:
                            # ZONE STAY logging can be extremely verbose, so we avoid logging it for every frame
                            pass
                            
                        state["last_seen_at"] = coord.timestamp

        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Error processing batch in SpatialEngine: {e}")
        finally:
            db.close()
            
    async def cleanup_stale_shoppers(self):
        """
        Periodically called to find shoppers who haven't been seen within TRACKING_LOST_TIMEOUT_SECONDS.
        Finalizes their sessions and saves them to the DB.
        """
        now = datetime.now(timezone.utc)
        shoppers_to_remove = []
        
        db = SessionLocal()
        try:
            async with self.lock:
                for state_key, state in self.active_shoppers.items():
                    store_id, camera_id, shopper_id = state_key
                    # Ensure last_seen_at is timezone-aware for calculation
                    last_seen = state["last_seen_at"]
                    if last_seen.tzinfo is None:
                        last_seen = last_seen.replace(tzinfo=timezone.utc)
                        
                    if (now - last_seen).total_seconds() > TRACKING_LOST_TIMEOUT_SECONDS:
                        shoppers_to_remove.append((state_key, state))
                        
                for state_key, state in shoppers_to_remove:
                    store_id, camera_id, shopper_id = state_key
                    logger.info(f"[TRACK] {camera_id}/{shopper_id} lost tracking timeout, finalizing session.")
                    self._finalize_shopper_session(store_id, camera_id, shopper_id, state, db)
                    del self.active_shoppers[state_key]
                    
            if shoppers_to_remove:
                db.commit()
        except Exception as e:
            db.rollback()
            import traceback
            traceback.print_exc()
            logger.error(f"Error cleaning up stale shoppers: {e}")
        finally:
            db.close()

    def _finalize_shopper_session(self, store_id: UUID, camera_id: str, shopper_id: str, state: Dict[str, Any], db: Session):
        """Creates ShopperSession and CustomerJourney records for a completed visit."""
        if state["current_zone_id"]:
            dwell_time = (state["last_seen_at"] - state["entered_at"]).total_seconds()
            zname = state["current_zone_name"]
            state["zone_dwell_times"][zname] = state["zone_dwell_times"].get(zname, 0) + dwell_time
            
        if not state["path_data"]:
            return
            
        start_time = datetime.fromisoformat(state["path_data"][0]["t"])
        end_time = datetime.fromisoformat(state["path_data"][-1]["t"])
        
        session = ShopperSession(
            store_id=store_id,
            start_time=start_time,
            end_time=end_time,
            path_data={"points": state["path_data"]}
        )
        db.add(session)
        db.flush() # get session.id
        
        entry_point = state["zone_transition_sequence"][0] if state["zone_transition_sequence"] else "Unknown"
        exit_point = state["zone_transition_sequence"][-1] if state["zone_transition_sequence"] else "Unknown"
        total_dwell = sum(state["zone_dwell_times"].values())
        
        journey = CustomerJourney(
            session_id=session.id,
            store_id=store_id,
            entry_point=entry_point,
            exit_point=exit_point,
            zones_visited=state["zones_visited"],
            zone_transition_sequence=state["zone_transition_sequence"],
            total_dwell_time_seconds=total_dwell,
            zone_dwell_times=state["zone_dwell_times"],
            path_length=len(state["path_data"]) * 0.5, # basic mock distance estimation
            visit_frequency=1,
            product_interaction_count=0,
            pickup_count=0,
            return_count=0,
            conversion_status=False
        )
        db.add(journey)
        logger.info(f"[JOURNEY] Created CustomerJourney for {camera_id}/{shopper_id} (Dwell: {total_dwell:.1f}s)")

    def get_live_occupancy(self, store_id: UUID) -> Dict[str, int]:
        """Returns the current number of active shoppers per zone."""
        occupancy = {}
        for state_key, state in self.active_shoppers.items():
            if state_key[0] == store_id:
                zname = state.get("current_zone_name")
                if zname:
                    occupancy[zname] = occupancy.get(zname, 0) + 1
        return occupancy

# Global instance for the FastAPI app
spatial_engine = SpatialEngine()
