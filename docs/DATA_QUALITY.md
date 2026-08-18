# Data Quality and Known Limitations

This document intentionally records limitations instead of presenting proxies as observed facts.

## Product attractiveness
The required weighting is 0.35 Attention + 0.25 Interaction + 0.20 Pickup + 0.15 Purchase + 0.05 Repeat. Attention is derived from dwell-time analytics. The current interaction pipeline contains deterministic track-based interaction/pickup candidates; it is not hand/keypoint pickup detection. Purchase facts are only real when `PurchaseEvent` rows are populated from a POS/transaction source.

## Journey analytics
Journey flow is camera-scoped because the current event schema does not provide cross-camera re-identification.

## Heatmaps
Current KDE heatmaps are generated from observed camera coordinates. A calibrated camera-to-floorplan homography requires per-camera calibration points/planogram geometry and should not be fabricated.

## Recommendations
Recommendations that depend on proxy/mock inputs must remain visibly labelled as estimates.
