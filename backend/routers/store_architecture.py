from fastapi import APIRouter
import random

router = APIRouter()

customers = [
    {
        "id": "Customer 101",
        "left": 24,
        "top": 31,
        "zone": "Shelf 1",
        "dwell": "18 sec",
        "status": "Shopping",
    },
    {
        "id": "Customer 102",
        "left": 48,
        "top": 30,
        "zone": "Shelf 2",
        "dwell": "22 sec",
        "status": "Browsing",
    },
    {
        "id": "Customer 103",
        "left": 72,
        "top": 28,
        "zone": "Shelf 3",
        "dwell": "14 sec",
        "status": "Shopping",
    },
    {
        "id": "Customer 104",
        "left": 35,
        "top": 68,
        "zone": "Shelf 4",
        "dwell": "31 sec",
        "status": "Selecting Product",
    },
    {
        "id": "Customer 105",
        "left": 67,
        "top": 66,
        "zone": "Shelf 5",
        "dwell": "24 sec",
        "status": "Shopping",
    },
    {
        "id": "Customer 106",
        "left": 84,
        "top": 84,
        "zone": "Checkout",
        "dwell": "10 sec",
        "status": "Billing",
    },
]


@router.get("/store-layout/customers")
def get_customers():

    for customer in customers:

        customer["left"] += random.randint(-2, 2)
        customer["top"] += random.randint(-2, 2)

        customer["left"] = max(8, min(customer["left"], 90))
        customer["top"] = max(8, min(customer["top"], 88))

    return [
        {
            **customer,
            "left": f'{customer["left"]}%',
            "top": f'{customer["top"]}%'
        }
        for customer in customers
    ]