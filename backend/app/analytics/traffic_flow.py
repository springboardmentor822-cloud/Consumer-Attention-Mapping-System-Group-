"""
Aggregate movement across many customers: zone-to-zone flow (a graph
suitable for a Sankey/node-link view) and store-wide speed/distance summaries.

Zone transition counting is NOT duplicated here - it reuses
TrackingRepository.zone_transitions(), already built and used by the
existing Customer Journey Flow feature. This module only reshapes that same
data into a graph, and adds the genuinely new piece: per-customer movement
speed/distance, which zone_transitions() doesn't compute.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.analytics.metrics import compute_motion_sequence
from app.models.tracking_data import TrackingData


@dataclass
class ZoneFlowNode:
    zone_id: int
    zone_name: str


@dataclass
class ZoneFlowEdge:
    from_zone_id: int
    to_zone_id: int
    count: int


@dataclass
class ZoneFlowGraph:
    nodes: list[ZoneFlowNode]
    edges: list[ZoneFlowEdge]


def build_zone_flow_graph(
    transitions: list[tuple[int, int, int]], zone_names: dict[int, str]
) -> ZoneFlowGraph:
    """transitions: raw (from_zone_id, to_zone_id, count) tuples from
    TrackingRepository.zone_transitions()."""
    zone_ids: set[int] = set()
    for from_id, to_id, _ in transitions:
        zone_ids.add(from_id)
        zone_ids.add(to_id)

    nodes = [ZoneFlowNode(zone_id=zid, zone_name=zone_names.get(zid, f"Zone {zid}")) for zid in sorted(zone_ids)]
    edges = [ZoneFlowEdge(from_zone_id=f, to_zone_id=t, count=c) for f, t, c in transitions]
    return ZoneFlowGraph(nodes=nodes, edges=edges)


@dataclass
class TrafficFlowSummary:
    average_speed_px_per_sec: float
    total_distance_px: float
    sample_size: int


def summarize_traffic_flow(rows: list[TrackingData]) -> TrafficFlowSummary:
    """rows can span multiple customers - grouped internally so speed/distance
    are only ever computed between one customer's own consecutive points,
    never between two different people."""
    by_customer: dict[int, list[TrackingData]] = {}
    for row in rows:
        by_customer.setdefault(row.customer_id, []).append(row)

    speeds: list[float] = []
    total_distance = 0.0
    for customer_rows in by_customer.values():
        ordered = sorted(customer_rows, key=lambda r: r.timestamp)
        for motion in compute_motion_sequence(ordered):
            speeds.append(motion.speed_px_per_sec)
            total_distance += motion.distance_px

    return TrafficFlowSummary(
        average_speed_px_per_sec=round(sum(speeds) / len(speeds), 2) if speeds else 0.0,
        total_distance_px=round(total_distance, 1),
        sample_size=len(speeds),
    )
