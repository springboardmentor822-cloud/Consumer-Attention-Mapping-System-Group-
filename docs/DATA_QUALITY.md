# Data Quality and Known Limitations

This document intentionally records limitations instead of presenting proxies as observed facts.

## Product attractiveness
The required weighting is 0.35 Attention + 0.25 Interaction + 0.20 Pickup + 0.15 Purchase + 0.05 Repeat. Attention is derived from dwell-time analytics. The current interaction pipeline contains deterministic track-based interaction/pickup/return/comparison candidates (shelf-exit/entry plus person contact, and cross-SKU contact within 15s by the same shopper); it is not hand/keypoint pickup detection or barcode-confirmed comparison. These candidates are now surfaced as ranked "Most Picked/Returned/Compared Products" lists on the Store Manager and Retail Analyst dashboards, not just internal aggregate counts. Purchase facts are only real when `PurchaseEvent` rows are populated from a POS/transaction source.

## Journey analytics
Journey flow now links sessions across DIFFERENT cameras using a real timing-proximity heuristic: a session's real event-time end in one zone is linked to a different track's real event-time start in a plausible next zone (by the store's own Entrance → Aisle → Checkout layout order) if that happens within a configurable window (120s). This is computed from real TrackingEvent timestamps, not fabricated — but it is explicitly NOT visual re-identification. Two different real shoppers could coincidentally satisfy the timing/order condition; every response carries a `disclosure` field saying so, and `data_quality` is set to `timing_proximity_heuristic_no_visual_reidentification`. True re-identification would need appearance-embedding matching across camera views, which does not exist in this system.

## Heatmaps
Current KDE heatmaps are generated from observed camera coordinates. A calibrated camera-to-floorplan homography requires per-camera calibration points/planogram geometry and should not be fabricated. Endpoints exist for both `/api/v1/heatmaps/store/{store_id}` and `/api/v1/heatmaps/shelf/{shelf_id}` (the latter aggregates every camera actually wired to that shelf via ShelfCameraView, not just one camera) alongside the original `/api/v1/heatmaps/camera/{camera_id}`.

## Recommendations
Recommendations that depend on proxy/mock inputs must remain visibly labelled as estimates. `expected_conversion_uplift_pct` is already a percent-scale number (e.g. `8.4` means 8.4%) — do not multiply it by 100 again when displaying it; that exact mistake was found and fixed in the Retail Analyst dashboard's AI Insights section.

## Camera footage
The three camera feeds (`Zone_1.mp4`, `Zone_2.mp4`, `Zone_3.mp4`) are free stock video clips chosen to visually match each zone's purpose (entrance, aisle, checkout), not real CCTV footage from one physical store. They come from unrelated productions/locations. This matters in two ways beyond general disclosure:

- **They were not always content-accurate.** The original `Zone_1.mp4` was a wide shopping-mall concourse shot (not an entrance/foyer), and the original `Zone_2.mp4` carried a visible iStock/Getty Images watermark — meaning it was very likely an unlicensed preview clip, not cleared for use. Both were identified by actually reviewing extracted frames (not trusting filenames or the original spec's example layout) and replaced with unwatermarked, commercial-use-licensed clips (Pixabay/Pexels) that genuinely match their zone's content.
- **Even the corrected clips are not one coherent physical space.** This means the journey-analytics timing heuristic described above (linking a session's exit from one zone to another track's entry in the next) is not just "not visual re-identification" — the underlying premise that a shopper could plausibly walk from one zone's camera view into the next literally does not hold, since the three zones were never the same location to begin with. Any cross-zone journey output from this demo footage should be read as proof the linking *code* runs correctly, not as a real linked shopper journey. Real footage from one physical store, wired to real cameras, is the only fix for this — not something the current codebase can compensate for.

The one registered demo store ("Demo Retail Store") and its 3 zones/cameras are named generically for exactly this reason — the footage was deliberately not attributed to any real or fictional named business, since none of it depicts one.
