# User Manual

## Getting an account

Go to the console's `/register` page. Pick the role that matches your
job:

| Role | What you can do |
|---|---|
| Administrator | Everything, plus manage other users' roles/access |
| Store Manager | Register stores, link cameras, manage shelves/products |
| Retail Analyst | View all analytics, heatmaps, customer behavior (read-only on setup) |
| Marketing Manager | View product scores, recommendations, campaign-relevant analytics |

New accounts start unverified — an email verification token is issued
(logged to the backend console in this demo build, since no real SMTP
server is configured; wire one up per `ai_models`... see
`backend/app/services/email_service.py` for how).

## Setting up a store

1. **Stores** page → **+ New store**. Give it a name and, if you know
   them, the floor's width/height in meters — this is used to scale
   heatmaps and floor-plan coordinates later.
2. **Cameras** page → **+ Link camera**. Pick the store, name the
   camera, choose its type (IP/RTSP/CCTV/webcam), and give it a stream
   URL if it has one.
3. **Shelves & Products** page → add shelves (with an aisle label), then
   add products to each shelf (SKU, name, brand, price).

## Calibrating a camera (for accurate heatmaps)

Camera calibration converts pixel positions to real floor-plan meters.
This is a one-time setup per camera done from the command line right
now (no UI yet — see `ai_models/calibration/README.md`):

1. Grab a reference frame from the camera.
2. Measure 4+ points you can identify in that frame (tile corners, tape
   marks) in real-world meters.
3. Run `calibrate.py` to compute and save the calibration.

Once saved, all future tracking data from that camera will include real
floor coordinates automatically.

## Reading the Analytics page

- **Summary cards** — visitors, average dwell time, purchases, and
  conversion rate for the last 30 days.
- **Product engagement ranking** — which products get the most
  interactions (views, pickups, purchases). Click **Compute scores +
  recommendations** to refresh the underlying Product Attractiveness
  Scores and generate new suggestions.
- **Recommendations** — plain-language, rule-based suggestions (e.g.
  "high attention, low pickup" gaps worth investigating). Dismiss ones
  you've already acted on.
- **Notifications** — camera-offline alerts, low-visibility product
  flags, traffic spikes.
- **Customer segments** — click **Compute segments** to classify
  completed visits into Explorer / Quick Buyer / Comparison Shopper /
  Impulse Buyer / Brand Loyal, based on how long they stayed, how many
  products they interacted with, and whether they compared or purchased.

## Getting help

This is an internal ops tool; for bugs or feature requests, talk to
whoever's maintaining your deployment (see `documentation/DEVELOPER_GUIDE.md`).
