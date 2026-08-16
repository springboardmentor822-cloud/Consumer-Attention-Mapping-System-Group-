import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))

from import_dataset import DEFAULT_CSV, import_dataset, load_dataset  # noqa: E402


class _FakeBackend:
    """Records every call instead of hitting a real server, and mimics
    the real backend's duplicate-category behavior (400 -> reuse)."""

    def __init__(self):
        self.stores = []
        self.cameras = []
        self.shelves = []
        self.products = []
        self._shelf_categories: dict[str, dict] = {}
        self._product_categories: dict[str, dict] = {}
        self._next_id = 1
        self._seen_skus: set[str] = set()

    def _id(self) -> int:
        self._next_id += 1
        return self._next_id

    def create_store(self, payload):
        store = {**payload, "id": self._id()}
        self.stores.append(store)
        return store

    def create_camera(self, payload):
        camera = {**payload, "id": self._id()}
        self.cameras.append(camera)
        return camera

    def create_shelf_category(self, name):
        if name in self._shelf_categories:
            return self._shelf_categories[name]
        cat = {"id": self._id(), "name": name}
        self._shelf_categories[name] = cat
        return cat

    def create_shelf(self, payload):
        shelf = {**payload, "id": self._id()}
        self.shelves.append(shelf)
        return shelf

    def create_product_category(self, name):
        if name in self._product_categories:
            return self._product_categories[name]
        cat = {"id": self._id(), "name": name}
        self._product_categories[name] = cat
        return cat

    def create_product(self, payload):
        if payload["sku"] in self._seen_skus:
            return None
        self._seen_skus.add(payload["sku"])
        product = {**payload, "id": self._id()}
        self.products.append(product)
        return product


@pytest.fixture
def dataset():
    if not DEFAULT_CSV.exists():
        pytest.skip("dataset CSV not present")
    return load_dataset(DEFAULT_CSV)


def test_load_dataset_has_required_columns(dataset):
    required = {"Province", "Product Category", "Product Sub-Category", "Product Name", "Unit Price"}
    assert required.issubset(set(dataset.columns))
    assert len(dataset) > 1000  # real dataset, not a stub


def test_import_creates_expected_counts(dataset):
    backend = _FakeBackend()
    summary = import_dataset(
        backend,
        dataset,
        max_stores=3,
        max_shelves_per_store=4,
        max_products_per_store=12,
        cameras_per_store=2,
    )

    assert summary["stores"] == 3
    assert summary["cameras"] == 6  # 2 per store
    assert summary["shelves"] == 12  # 4 per store
    assert summary["products"] > 0
    assert len(backend.stores) == 3
    assert len(backend.cameras) == 6
    assert len(backend.shelves) == 12


def test_imported_stores_use_real_province_names(dataset):
    backend = _FakeBackend()
    import_dataset(backend, dataset, max_stores=2, max_shelves_per_store=3,
                    max_products_per_store=6, cameras_per_store=1)

    real_provinces = set(dataset["Province"].unique())
    for store in backend.stores:
        assert store["city"] in real_provinces  # not a fabricated location


def test_imported_products_have_real_names_and_prices(dataset):
    backend = _FakeBackend()
    import_dataset(backend, dataset, max_stores=1, max_shelves_per_store=2,
                    max_products_per_store=5, cameras_per_store=1)

    real_names = set(dataset["Product Name"].astype(str))
    for product in backend.products:
        assert product["name"] in real_names  # every product traces back to a real row
        assert product["price"] > 0


def test_camera_stream_urls_are_clearly_synthetic(dataset):
    """Cameras must be obviously fake placeholders, not presented as real hardware."""
    backend = _FakeBackend()
    import_dataset(backend, dataset, max_stores=1, max_shelves_per_store=2,
                    max_products_per_store=4, cameras_per_store=2)

    for camera in backend.cameras:
        assert "demo-camera.internal" in camera["stream_url"]


def test_no_duplicate_shelf_categories_created_across_stores(dataset):
    """Multiple stores sharing a Product Category (e.g. 'Office Supplies')
    should reuse the same shelf category, not create duplicates."""
    backend = _FakeBackend()
    import_dataset(backend, dataset, max_stores=3, max_shelves_per_store=5,
                    max_products_per_store=10, cameras_per_store=1)

    assert len(backend._shelf_categories) <= 3  # dataset only has 3 top-level categories
