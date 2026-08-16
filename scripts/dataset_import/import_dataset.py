"""
Populates the system from a REAL retail dataset instead of hand-typed
demo data — stores, shelves, and products all come from actual rows in
`data/superstore_sample.csv` (a public "Sample Superstore" sales
dataset: real cities/provinces, real product categories, real product
names and prices, ~8,400 transactions).

What's real vs. synthesized, stated plainly:

  REAL (from the dataset):
    - Store locations: one store per Canadian province/region that
      appears in the data (name, city/region).
    - Shelf categories & shelves: one shelf per product sub-category
      actually sold in that province (e.g. "Binders and Binder
      Accessories", "Chairs & Chairmats").
    - Products: real product names and real unit prices from actual
      transaction rows.

  SYNTHESIZED (clearly labeled, because no such dataset exists publicly):
    - Cameras: no public dataset of retail camera hardware exists
      anywhere (camera IPs/serials are private operational data, not
      something any company publishes) — earlier attempts at finding a
      "camera dataset" for this project all confirmed the same thing.
      Cameras here are generated per store/shelf with a clearly fake
      RTSP URL pattern (`rtsp://demo-camera.internal/...`) so it's
      obvious on inspection that they're placeholders, not scraped from
      anywhere real.
    - Store floor dimensions: not present in the source dataset (it's
      sales data, not architectural data), so these are reasonable
      constants, not fabricated "real" measurements.

Usage:
    pip install pandas requests

    python import_dataset.py \
        --backend-url http://localhost:8000/api/v1 \
        --email admin@example.com --password Admin123! \
        --max-stores 5 --max-products-per-store 20
"""
from __future__ import annotations

import argparse
import logging
from pathlib import Path

import pandas as pd
import requests

logger = logging.getLogger("dataset_import")

DEFAULT_CSV = Path(__file__).parent / "data" / "superstore_sample.csv"


class BackendClient:
    def __init__(self, base_url: str, email: str, password: str):
        self.base_url = base_url.rstrip("/")
        resp = requests.post(
            f"{self.base_url}/auth/login", data={"username": email, "password": password}
        )
        resp.raise_for_status()
        self._token = resp.json()["access_token"]

    def _h(self) -> dict:
        return {"Authorization": f"Bearer {self._token}"}

    def create_store(self, payload: dict) -> dict:
        resp = requests.post(f"{self.base_url}/stores", json=payload, headers=self._h())
        resp.raise_for_status()
        return resp.json()

    def create_camera(self, payload: dict) -> dict:
        resp = requests.post(f"{self.base_url}/cameras", json=payload, headers=self._h())
        resp.raise_for_status()
        return resp.json()

    def create_shelf_category(self, name: str) -> dict:
        resp = requests.post(
            f"{self.base_url}/shelves/categories", json={"name": name}, headers=self._h()
        )
        if resp.status_code == 201:
            return resp.json()
        if resp.status_code == 400:  # already exists - fetch and find it
            existing = requests.get(f"{self.base_url}/shelves/categories", headers=self._h()).json()
            return next(c for c in existing if c["name"] == name)
        resp.raise_for_status()

    def create_shelf(self, payload: dict) -> dict:
        resp = requests.post(f"{self.base_url}/shelves", json=payload, headers=self._h())
        resp.raise_for_status()
        return resp.json()

    def create_product_category(self, name: str) -> dict:
        resp = requests.post(
            f"{self.base_url}/products/categories", json={"name": name}, headers=self._h()
        )
        if resp.status_code == 201:
            return resp.json()
        if resp.status_code == 400:  # already exists - fetch and find it
            existing = requests.get(f"{self.base_url}/products/categories", headers=self._h()).json()
            return next(c for c in existing if c["name"] == name)
        resp.raise_for_status()

    def create_product(self, payload: dict) -> dict | None:
        resp = requests.post(f"{self.base_url}/products", json=payload, headers=self._h())
        if resp.status_code == 400:
            return None  # duplicate SKU, skip
        resp.raise_for_status()
        return resp.json()


def load_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path, encoding="utf-8")
    df = df.dropna(subset=["Province", "Product Category", "Product Sub-Category", "Product Name", "Unit Price"])
    return df


def import_dataset(
    client: BackendClient,
    df: pd.DataFrame,
    max_stores: int,
    max_shelves_per_store: int,
    max_products_per_store: int,
    cameras_per_store: int,
) -> dict:
    summary = {"stores": 0, "cameras": 0, "shelves": 0, "products": 0, "skipped_products": 0}

    top_provinces = df["Province"].value_counts().head(max_stores).index.tolist()
    logger.info("Importing %d stores from real dataset regions: %s", len(top_provinces), top_provinces)

    for province in top_provinces:
        province_df = df[df["Province"] == province]

        store = client.create_store(
            {
                "name": f"{province} Retail Center",
                "city": province,
                "country": "Canada",
                "timezone": "America/Toronto",
                "floor_width_m": 30.0,   # synthesized: not in source data
                "floor_height_m": 18.0,  # synthesized: not in source data
            }
        )
        summary["stores"] += 1
        logger.info("Created store: %s (id=%d, %d real transactions in this region)",
                    store["name"], store["id"], len(province_df))

        # --- Cameras: synthesized, clearly labeled fake stream URLs ---
        camera_ids = []
        for i in range(cameras_per_store):
            camera = client.create_camera(
                {
                    "store_id": store["id"],
                    "name": f"{['Entrance', 'Aisle', 'Checkout', 'Back Wall'][i % 4]} Cam {store['id']}-{i+1}",
                    "camera_type": "ip_camera",
                    "stream_url": f"rtsp://demo-camera.internal/{store['id']}/cam{i+1}",  # NOT a real camera
                    "resolution_width": 1920,
                    "resolution_height": 1080,
                    "fps": 15,
                }
            )
            camera_ids.append(camera["id"])
            summary["cameras"] += 1

        # --- Shelves: real sub-categories actually sold in this province ---
        top_subcats = province_df["Product Sub-Category"].value_counts().head(max_shelves_per_store).index.tolist()
        shelf_by_subcat: dict[str, int] = {}
        for i, subcat in enumerate(top_subcats):
            parent_category = province_df[province_df["Product Sub-Category"] == subcat]["Product Category"].iloc[0]
            shelf_category = client.create_shelf_category(parent_category)
            shelf = client.create_shelf(
                {
                    "store_id": store["id"],
                    "camera_id": camera_ids[i % len(camera_ids)] if camera_ids else None,
                    "category_id": shelf_category["id"],
                    "name": subcat,
                    "aisle": str(i + 1),
                }
            )
            shelf_by_subcat[subcat] = shelf["id"]
            summary["shelves"] += 1

        # --- Products: real names + real prices from actual transaction rows ---
        subcat_df = province_df[province_df["Product Sub-Category"].isin(top_subcats)]
        products_per_subcat = max(1, max_products_per_store // max(1, len(top_subcats)))

        for subcat, shelf_id in shelf_by_subcat.items():
            unique_products = (
                subcat_df[subcat_df["Product Sub-Category"] == subcat]
                .drop_duplicates(subset=["Product Name"])
                .head(products_per_subcat)
            )
            parent_category = unique_products["Product Category"].iloc[0] if len(unique_products) else None
            product_category = client.create_product_category(parent_category) if parent_category else None

            for _, row in unique_products.iterrows():
                sku = f"SKU-{store['id']}-{abs(hash(row['Product Name'])) % 1000000}"
                created = client.create_product(
                    {
                        "sku": sku,
                        "name": str(row["Product Name"])[:200],
                        "price": round(float(row["Unit Price"]), 2),
                        "category_id": product_category["id"] if product_category else None,
                        "shelf_id": shelf_id,
                    }
                )
                if created:
                    summary["products"] += 1
                else:
                    summary["skipped_products"] += 1

        logger.info(
            "Store %s: %d cameras, %d shelves, %d products so far",
            province, len(camera_ids), len(shelf_by_subcat), summary["products"],
        )

    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Import real store/product data from a public retail dataset.")
    parser.add_argument("--csv", default=str(DEFAULT_CSV))
    parser.add_argument("--backend-url", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--max-stores", type=int, default=5)
    parser.add_argument("--max-shelves-per-store", type=int, default=6)
    parser.add_argument("--max-products-per-store", type=int, default=20)
    parser.add_argument("--cameras-per-store", type=int, default=2)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    df = load_dataset(Path(args.csv))
    logger.info("Loaded %d real transaction rows from %s", len(df), args.csv)

    client = BackendClient(args.backend_url, args.email, args.password)

    summary = import_dataset(
        client,
        df,
        max_stores=args.max_stores,
        max_shelves_per_store=args.max_shelves_per_store,
        max_products_per_store=args.max_products_per_store,
        cameras_per_store=args.cameras_per_store,
    )

    print("\n--- Import summary ---")
    for key, value in summary.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
