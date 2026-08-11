"""
Seed ~65 SYNTHETIC DEMO customers, purchases and tracking links.

    python -m scripts.seed_demo_customers          # seed / update
    python -m scripts.seed_demo_customers --purge  # remove everything it created

=============================================================================
THIS SCRIPT CREATES FICTIONAL DATA. IT IS FOR DEMO AND TESTING ONLY.
=============================================================================
Every name here is invented and every phone number is in the reserved
+91-90000000xx demo block - none of it belongs to a real person. Customer
rows created here are marked with the DEMO_CODE_PREFIX below so they can
always be told apart from genuine CRM records, and --purge removes exactly
those rows and nothing else. Do not run this against a production database,
and do not present figures derived from it as real store performance.

What it does NOT do:
  * It does not touch YOLO, detection, tracking, cameras, zones, employees,
    auth or any dashboard code.
  * It does not invent tracking data. Visit sessions, dwell times, zones and
    journeys all remain the real ones already derived from processed video;
    this only sets customer_visits.customer_id to attach a demo profile to
    an existing anonymous track, which is the same explicit mapping a human
    would make through the API.
  * It does not claim video identified anyone. The link between a tracking
    id and a person is a demo assignment, not a recognition result.

Two deliberate decisions worth knowing about:

1. PRICES COME FROM THE PRODUCT CATALOGUE, NOT FROM THE REQUESTED TOTALS.
   The requested per-customer amounts (e.g. "Coca Cola x2, Lays x1 = 180")
   do not equal quantity x the real catalogue price (40x2 + 20x1 = 100).
   Storing a receipt whose line items don't sum to its own total would be
   corrupt data that every downstream figure then inherits, so each
   purchase's total is computed from real unit prices. Baskets (products
   and quantities) are exactly as requested; the money follows the
   catalogue.

2. ONLY TRACKING IDS THAT REALLY EXIST GET LINKED.
   Real processed video produced tracking ids customer_001..customer_038.
   Demo customers beyond that range are still created with their purchases,
   but have no visit/dwell/journey data, because inventing tracking rows
   would fabricate video evidence that was never recorded.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session  # noqa: E402

from app.db.session import SessionLocal  # noqa: E402
from app.models.customer import Customer, CustomerVisit  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.purchase import Purchase, PurchaseItem  # noqa: E402
from app.models.shelf import Shelf  # noqa: E402
from app.models.store import Store  # noqa: E402

# Marks every row this script owns, so seeding is repeatable and --purge is exact.
DEMO_CODE_PREFIX = "CRM-1"
DEMO_TXN_PREFIX = "DEMO-TXN-"

# Products referenced by the demo baskets that aren't in the catalogue yet.
# Created on the existing shelf that matches their category (no new shelves,
# no new zones) at realistic Indian retail prices.
MISSING_PRODUCTS = [
    # (name, category, price, shelf zone keyword)
    ("Tata Salt 1kg", "Grocery", "28.00", "grocery"),
    ("Fortune Sunflower Oil 1L", "Grocery", "140.00", "grocery"),
    ("Surf Excel 1kg", "Grocery", "135.00", "grocery"),
    ("Britannia Good Day Biscuits 100g", "Snacks", "30.00", "snacks"),
    ("Maggi Noodles 70g", "Snacks", "14.00", "snacks"),
    ("Kurkure 90g", "Snacks", "20.00", "snacks"),
    ("Oreo Biscuits 120g", "Snacks", "30.00", "snacks"),
    ("Thums Up 750ml", "Beverages", "45.00", "beverage"),
    ("Real Fruit Juice 1L", "Beverages", "120.00", "beverage"),
    ("Colgate Toothpaste 200g", "Personal Care", "115.00", "personal"),
    ("Dettol Handwash 200ml", "Personal Care", "99.00", "personal"),
    ("Dove Shampoo 340ml", "Personal Care", "280.00", "personal"),
    ("Britannia Bread 400g", "Dairy", "45.00", "dairy"),
]

# Basket shorthand -> real catalogue product name. Close variants map onto the
# existing product rather than creating a near-duplicate catalogue entry.
PRODUCT_ALIASES = {
    "Coca Cola 500ml": "Coca-Cola 500ml",
    "Coca Cola": "Coca-Cola 500ml",
    "Pepsi 750ml": "Pepsi 500ml",
    "Pepsi": "Pepsi 500ml",
    "Lays Classic 52g": "Lay's Classic Chips",
    "Lays": "Lay's Classic Chips",
    "Dairy Milk": "Cadbury Dairy Milk",
    "Dove Soap 100g": "Dove Soap 125g",
    "Dove Soap": "Dove Soap 125g",
    "Lux Soap": "Lux Soap 150g",
    "Clinic Plus": "Clinic Plus Shampoo 340ml",
    "Clinic Plus Shampoo 340ml": "Clinic Plus Shampoo 340ml",
    "Head & Shoulders Shampoo": "Head & Shoulders Shampoo 340ml",
    "Head & Shoulders": "Head & Shoulders Shampoo 340ml",
    "Colgate 200g": "Colgate Toothpaste 200g",
    "Colgate": "Colgate Toothpaste 200g",
    "Dove Shampoo": "Dove Shampoo 340ml",
    "Dettol Handwash": "Dettol Handwash 200ml",
    "Dettol": "Dettol Handwash 200ml",
    "Surf Excel 1kg": "Surf Excel 1kg",
    "Surf Excel": "Surf Excel 1kg",
    "Amul Milk 1L": "Amul Milk 500ml",
    "Amul Milk": "Amul Milk 500ml",
    "Amul Butter 500g": "Amul Butter 100g",
    "Amul Butter": "Amul Butter 100g",
    "Butter": "Amul Butter 100g",
    "Bread": "Britannia Bread 400g",
    "Britannia Biscuits": "Britannia Good Day Biscuits 100g",
    "Maggi Noodles": "Maggi Noodles 70g",
    "Maggi": "Maggi Noodles 70g",
    "Kurkure": "Kurkure 90g",
    "Oreo Biscuits": "Oreo Biscuits 120g",
    "Oreo": "Oreo Biscuits 120g",
    "Real Fruit Juice": "Real Fruit Juice 1L",
    "Real Juice": "Real Fruit Juice 1L",
    "Thums Up 750ml": "Thums Up 750ml",
    "Rice 5kg": "India Gate Basmati Rice 5kg",
    "Dal 1kg": "Tata Sampann Toor Dal 1kg",
    "Dal": "Tata Sampann Toor Dal 1kg",
    "Tata Salt 1kg": "Tata Salt 1kg",
    "Tata Salt": "Tata Salt 1kg",
    "Aashirvaad Atta 5kg": "Aashirvaad Atta 5kg",
    "Aashirvaad Atta": "Aashirvaad Atta 5kg",
    "Fortune Oil 1L": "Fortune Sunflower Oil 1L",
    "Fortune Oil": "Fortune Sunflower Oil 1L",
}

# (name, basket) - basket is [(product shorthand, quantity), ...].
# Customer code and phone are derived from position: CRM-10NN / +91-90000000NN.
DEMO_CUSTOMERS: list[tuple[str, list[tuple[str, int]]]] = [
    ("Rahul Sharma", [("Coca Cola 500ml", 2), ("Lays Classic 52g", 1)]),
    ("Priya Verma", [("Clinic Plus Shampoo 340ml", 1), ("Dove Soap 100g", 2)]),
    ("Arjun Mehta", [("Tata Salt 1kg", 2), ("Aashirvaad Atta 5kg", 1)]),
    ("Neha Singh", [("Britannia Biscuits", 3), ("Maggi Noodles", 4)]),
    ("Rohit Gupta", [("Surf Excel 1kg", 1), ("Dettol Handwash", 2)]),
    ("Anjali Joshi", [("Amul Milk 1L", 2), ("Amul Butter 500g", 1)]),
    ("Karan Malhotra", [("Thums Up 750ml", 2), ("Kurkure", 2), ("Dairy Milk", 3)]),
    ("Sneha Kapoor", [("Lux Soap", 2), ("Colgate 200g", 1)]),
    ("Amit Kumar", [("Rice 5kg", 1), ("Dal 1kg", 2), ("Fortune Oil 1L", 1)]),
    ("Pooja Agarwal", [("Oreo Biscuits", 2), ("Real Fruit Juice", 2)]),
    ("Vivek Sharma", [("Pepsi 750ml", 2), ("Kurkure", 3)]),
    ("Riya Mehta", [("Dove Shampoo", 1), ("Dove Soap", 2)]),
    ("Mohit Verma", [("Maggi", 5), ("Lays", 2), ("Pepsi", 1)]),
    ("Simran Kaur", [("Head & Shoulders Shampoo", 1), ("Colgate", 2)]),
    ("Nikhil Jain", [("Aashirvaad Atta 5kg", 1), ("Tata Salt", 2)]),
    ("Ayesha Khan", [("Dairy Milk", 4), ("Oreo", 2)]),
    ("Manish Yadav", [("Coca Cola", 3), ("Lays", 2)]),
    ("Komal Sharma", [("Lux Soap", 3), ("Clinic Plus", 1)]),
    ("Saurabh Gupta", [("Fortune Oil", 2), ("Tata Salt", 2)]),
    ("Tanya Kapoor", [("Real Juice", 2), ("Pepsi", 2), ("Oreo", 1)]),
    ("Akash Singh", [("Maggi", 6), ("Lays", 3)]),
    ("Divya Joshi", [("Dove Soap", 3), ("Colgate", 1)]),
    ("Varun Mehta", [("Amul Milk", 3), ("Bread", 2), ("Butter", 1)]),
    ("Shreya Verma", [("Clinic Plus", 1), ("Lux Soap", 2)]),
    ("Rakesh Kumar", [("Rice 5kg", 1), ("Dal 1kg", 1)]),
    ("Nandini Sharma", [("Oreo", 3), ("Dairy Milk", 2)]),
    ("Harsh Agarwal", [("Pepsi", 3), ("Kurkure", 2)]),
    ("Muskan Gupta", [("Head & Shoulders", 1), ("Dove Soap", 2)]),
    ("Deepak Singh", [("Surf Excel", 1), ("Dettol", 1)]),
    ("Ishita Jain", [("Amul Butter", 2), ("Amul Milk", 2)]),
    ("Abhishek Sharma", [("Coca Cola", 2), ("Maggi", 3)]),
    ("Payal Verma", [("Colgate", 2), ("Lux Soap", 2)]),
    ("Raj Malhotra", [("Aashirvaad Atta", 1), ("Fortune Oil", 1)]),
    ("Sakshi Kapoor", [("Oreo", 2), ("Real Juice", 1)]),
    ("Yash Mehta", [("Lays", 2), ("Pepsi", 2), ("Dairy Milk", 1)]),
    ("Kriti Sharma", [("Dove Shampoo", 1), ("Colgate", 1)]),
    ("Sumit Gupta", [("Rice 5kg", 1), ("Tata Salt", 1)]),
    ("Meenal Joshi", [("Clinic Plus", 1), ("Lux Soap", 2)]),
    ("Ashish Kumar", [("Maggi", 4), ("Kurkure", 3)]),
    ("Radhika Singh", [("Dove Soap", 2), ("Head & Shoulders", 1)]),
    ("Gaurav Sharma", [("Coca Cola", 4), ("Lays", 2)]),
    ("Preeti Gupta", [("Amul Milk", 2), ("Bread", 2)]),
    ("Tarun Verma", [("Surf Excel", 1), ("Dettol", 2)]),
    ("Shalini Mehta", [("Oreo", 2), ("Dairy Milk", 3)]),
    ("Manav Jain", [("Tata Salt", 2), ("Dal", 2)]),
    ("Aarti Sharma", [("Real Juice", 2), ("Pepsi", 1)]),
    ("Rohit Mehta", [("Maggi", 5), ("Lays", 2)]),
    ("Pankaj Singh", [("Rice 5kg", 1), ("Fortune Oil", 1)]),
    ("Kavya Joshi", [("Colgate", 2), ("Lux Soap", 2)]),
    ("Aman Gupta", [("Coca Cola", 2), ("Kurkure", 3)]),
    ("Sonia Kapoor", [("Clinic Plus", 1), ("Dove Soap", 2)]),
    ("Rohan Sharma", [("Amul Milk", 3), ("Butter", 1)]),
    ("Ekta Verma", [("Oreo", 3), ("Real Juice", 2)]),
    ("Mayank Jain", [("Aashirvaad Atta", 1), ("Tata Salt", 2)]),
    ("Nisha Singh", [("Head & Shoulders", 1), ("Colgate", 2)]),
    ("Varsha Gupta", [("Lays", 3), ("Pepsi", 2)]),
    ("Dev Kumar", [("Surf Excel", 1), ("Dettol", 1)]),
    ("Monica Sharma", [("Dove Soap", 3), ("Lux Soap", 2)]),
    ("Siddharth Mehta", [("Rice 5kg", 1), ("Dal", 2)]),
    ("Jyoti Agarwal", [("Maggi", 4), ("Oreo", 2)]),
    ("Naveen Sharma", [("Coca Cola", 3), ("Dairy Milk", 2)]),
    ("Ritu Kapoor", [("Clinic Plus", 1), ("Colgate", 1), ("Lux Soap", 2)]),
    ("Sameer Gupta", [("Fortune Oil", 1), ("Tata Salt", 2), ("Dal", 1)]),
    ("Bhavna Joshi", [("Amul Milk", 2), ("Bread", 2), ("Butter", 1)]),
    ("Varun Sharma", [("Pepsi", 2), ("Lays", 2), ("Maggi", 3)]),
]


def ensure_products(db: Session, store_id: int) -> dict[str, Product]:
    """Add any catalogue products the demo baskets need, on existing shelves."""
    by_name = {p.product_name: p for p in db.query(Product).all()}
    shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()

    created = 0
    for name, category, price, zone_keyword in MISSING_PRODUCTS:
        if name in by_name:
            continue
        shelf = next((s for s in shelves if zone_keyword in (s.zone or "").lower()), None)
        if shelf is None:
            print(f"  ! no shelf matching {zone_keyword!r} - skipping {name}")
            continue
        product = Product(
            shelf_id=shelf.id,
            product_name=name,
            sku=f"DEMO-{name[:20].upper().replace(' ', '-')}",
            category=category,
            price=Decimal(price),
            stock_quantity=100,
        )
        db.add(product)
        db.flush()
        by_name[name] = product
        created += 1
    if created:
        db.commit()
    print(f"  products: {created} created, {len(by_name)} total in catalogue")
    return by_name


def resolve(shorthand: str, by_name: dict[str, Product]) -> Product | None:
    return by_name.get(PRODUCT_ALIASES.get(shorthand, shorthand))


def purge(db: Session) -> None:
    customers = db.query(Customer).filter(Customer.customer_code.like(f"{DEMO_CODE_PREFIX}%")).all()
    ids = [c.id for c in customers]
    if not ids:
        print("nothing to purge")
        return
    # Unlink visits first so real video-derived sessions survive as anonymous.
    unlinked = (
        db.query(CustomerVisit)
        .filter(CustomerVisit.customer_id.in_(ids))
        .update({CustomerVisit.customer_id: None}, synchronize_session=False)
    )
    purchases = db.query(Purchase).filter(Purchase.customer_id.in_(ids)).all()
    for p in purchases:
        db.delete(p)  # cascades to purchase_items
    for c in customers:
        db.delete(c)
    db.commit()
    print(f"purged {len(customers)} demo customers, {len(purchases)} purchases, unlinked {unlinked} visits")


def seed(db: Session) -> None:
    store = db.query(Store).order_by(Store.id).first()
    if store is None:
        print("no store exists - create a store first")
        return
    print(f"seeding into store_id={store.id} ({store.store_name})")

    by_name = ensure_products(db, store.id)
    base_time = datetime.now(timezone.utc) - timedelta(days=1)

    created_customers = updated_customers = 0
    created_purchases = 0
    linked_visits = 0
    unmatched: set[str] = set()
    without_tracking: list[str] = []

    for index, (full_name, basket) in enumerate(DEMO_CUSTOMERS, start=1):
        code = f"CRM-{1000 + index}"
        # Reserved demo block - never a dialable real number.
        phone = f"+91-90000000{index:02d}"
        tracking_id = f"customer_{index:03d}"

        # Upsert by customer_code so re-running never duplicates, and so an
        # already-present placeholder (the earlier "Test Customer" on CRM-1001)
        # is corrected in place rather than cloned.
        customer = db.query(Customer).filter(Customer.customer_code == code).first()
        if customer is None:
            customer = Customer(customer_code=code, full_name=full_name, phone=phone, store_id=store.id)
            db.add(customer)
            created_customers += 1
        else:
            customer.full_name = full_name
            customer.phone = phone
            customer.store_id = store.id
            updated_customers += 1
        customer.email = f"{full_name.split()[0].lower()}.demo@example.com"
        customer.is_active = True
        db.flush()

        # Attach this demo profile to the real anonymous track of the same
        # number, where that track actually exists. Nothing about the visit is
        # altered - only customer_id is set, exactly as the mapping API does.
        visits = (
            db.query(CustomerVisit)
            .filter(CustomerVisit.tracking_id == tracking_id, CustomerVisit.store_id == store.id)
            .all()
        )
        if visits:
            for visit in visits:
                visit.customer_id = customer.id
            linked_visits += len(visits)
        else:
            without_tracking.append(tracking_id)

        txn = f"{DEMO_TXN_PREFIX}{code}"
        purchase = db.query(Purchase).filter(Purchase.transaction_number == txn).first()
        if purchase is not None:
            continue  # already seeded this basket

        purchase = Purchase(
            customer_id=customer.id,
            store_id=store.id,
            transaction_number=txn,
            # Spread across the last few weeks so visit-trend charts have shape.
            purchase_time=base_time - timedelta(days=index % 21, hours=index % 11),
            total_amount=Decimal(0),
        )
        db.add(purchase)
        db.flush()

        total = Decimal(0)
        for shorthand, quantity in basket:
            product = resolve(shorthand, by_name)
            if product is None:
                unmatched.add(shorthand)
                continue
            line_total = product.price * quantity
            total += line_total
            db.add(
                PurchaseItem(
                    purchase_id=purchase.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price,
                    total_price=line_total,
                )
            )
        purchase.total_amount = total
        created_purchases += 1

    db.commit()

    print(f"  customers: {created_customers} created, {updated_customers} updated")
    print(f"  purchases: {created_purchases} created")
    print(f"  visits linked to a demo profile: {linked_visits}")
    if without_tracking:
        print(
            f"  NOTE: {len(without_tracking)} demo customers have no video tracking "
            f"({without_tracking[0]}..{without_tracking[-1]}) - real processed footage only "
            f"produced tracking ids up to customer_038, and none were invented."
        )
    if unmatched:
        print(f"  WARNING: unmatched product shorthands: {sorted(unmatched)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--purge", action="store_true", help="remove all demo rows this script created")
    args = parser.parse_args()

    print("=" * 70)
    print("SYNTHETIC DEMO DATA - fictional customers, for testing only")
    print("=" * 70)

    db = SessionLocal()
    try:
        if args.purge:
            purge(db)
        else:
            seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
