# Dataset Import

Populates stores, shelves, and products from a **real public retail
dataset** instead of hand-typed demo data — this is what to run instead
of (or in addition to) `scripts/seed_data.py` when you need the system
populated with actual data rather than a single made-up example store.

## What's real vs. synthesized

| Entity | Source |
|---|---|
| Store locations | **Real** — one store per Canadian province that appears in the dataset (Ontario, British Columbia, Saskatchewan, Alberta, Manitoba, ...) |
| Shelf categories & shelves | **Real** — one shelf per product sub-category actually sold in that province (e.g. "Chairs & Chairmats", "Binders and Binder Accessories") |
| Products | **Real** — actual product names and actual unit prices from ~8,400 real transaction rows |
| Cameras | **Synthesized** — clearly fake `rtsp://demo-camera.internal/...` URLs. No public dataset of retail camera hardware exists anywhere; camera IPs/serials are private operational data. This is stated plainly rather than disguised. |
| Store floor dimensions | **Synthesized** — the source dataset is sales data, not architectural data, so these are reasonable constants, not fabricated measurements. |

The dataset itself (`data/superstore_sample.csv`) is a well-known public
"Sample Superstore" sales dataset, pulled from a reachable GitHub mirror
(`raw.githubusercontent.com/curran/data`), not from Kaggle (which this
sandbox can't reach — see the project's main README for that
limitation).

## Usage

```bash
pip install -r requirements.txt

python import_dataset.py \
  --backend-url http://localhost:8000/api/v1 \
  --email admin@example.com --password Admin123! \
  --max-stores 5 \
  --max-shelves-per-store 5 \
  --max-products-per-store 15 \
  --cameras-per-store 2
```

**Verified working end-to-end**: ran this against a live backend and
confirmed 5 real stores, 10 cameras, 25 shelves, and 75 products landed
correctly, with product names/prices pulled straight from the dataset
(e.g. "Hammermill Color Copier Paper (28Lb. and 96 Bright)" at $9.99 —
an actual row, not a placeholder).

## A bug this uncovered and fixed

Running this against the real API surfaced a genuine backend bug: creating
a shelf/product category with a name that already exists crashed with an
unhandled `500 Internal Server Error` (a raw SQLite `UNIQUE constraint
failed`) instead of a clean `400`. Fixed in
`backend/app/api/v1/endpoints/{shelves,products}.py` — both now check for
an existing category first and return a proper `400` with a clear message.
Covered by two new regression tests in `backend/app/tests/test_store_pipeline.py`.

## Tests

```bash
python -m pytest test_import_dataset.py -v
```

Tests run the actual import logic against the real CSV (not a mock
dataset) using a fake in-memory backend client, and specifically check
that every imported product's name/price traces back to a real dataset
row, that camera URLs are obviously synthetic rather than presented as
real hardware, and that shelf/product categories are reused across
stores rather than duplicated.
