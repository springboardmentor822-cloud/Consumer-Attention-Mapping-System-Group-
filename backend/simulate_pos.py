"""
simulate_pos.py — Fake cash register for demos.

Continuously fires realistic POST requests at the VisionRetail backend's
/api/v1/pos/webhook so the dashboard has live revenue data to show during
demonstrations, without needing a real POS terminal wired up.

This replaces the old in-process random.randint() fake-sale generator that
used to live inside /api/v1/pos/live — that one had no notion of "sending"
a transaction, it just silently mutated server memory on every GET. This
script is the real thing standing in for it: an external caller hitting the
actual webhook, going through the same code path a real register would.

Usage:
    # from backend/ with the venv active
    set POS_WEBHOOK_SECRET=dev-only-pos-webhook-secret   (PowerShell: $env:POS_WEBHOOK_SECRET="...")
    python simulate_pos.py

    # customize pace / target
    python simulate_pos.py --url http://127.0.0.1:9000 --min-interval 3 --max-interval 12

Stop with Ctrl+C.
"""
import argparse
import os
import random
import sys
import time
from datetime import datetime

import requests

# A believable spread of transaction sizes and repeat customers, so a demo
# doesn't look like uniform noise. Weighted toward smaller "quick basket"
# purchases with occasional larger carts, similar to real retail POS mixes.
AMOUNT_BUCKETS = [
    (150, 800, 0.55),    # small basket — most common
    (800, 2200, 0.30),   # medium cart
    (2200, 4500, 0.15),  # large cart — rarer
]

CUSTOMER_POOL = [f"CUST-{n}" for n in (1000 + i * 37 for i in range(40))]


def weighted_amount() -> float:
    r = random.random()
    cumulative = 0.0
    for low, high, weight in AMOUNT_BUCKETS:
        cumulative += weight
        if r <= cumulative:
            return round(random.uniform(low, high), 2)
    return round(random.uniform(*AMOUNT_BUCKETS[-1][:2]), 2)


def pick_customer_id() -> str:
    # ~70% repeat shoppers from the pool, ~30% brand-new/guest customers —
    # gives the dashboard's repeat-engagement metrics something to show.
    if random.random() < 0.7:
        return random.choice(CUSTOMER_POOL)
    return f"CUST-{random.randint(5000, 9999)}"


def fire_sale(base_url: str, secret: str, timeout: float) -> None:
    payload = {
        "amount": weighted_amount(),
        "customer_id": pick_customer_id(),
        "webhook_secret": secret,
    }
    try:
        resp = requests.post(
            f"{base_url}/api/v1/pos/webhook",
            json=payload,
            timeout=timeout,
        )
        ts = datetime.now().strftime("%H:%M:%S")
        if resp.ok:
            print(f"[{ts}] SALE  ${payload['amount']:>8,.2f}  {payload['customer_id']:<10}  -> {resp.status_code}")
        else:
            print(f"[{ts}] FAILED {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
    except requests.exceptions.RequestException as e:
        ts = datetime.now().strftime("%H:%M:%S")
        print(f"[{ts}] ERROR contacting backend: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Simulate a live cash register hitting the POS webhook.")
    parser.add_argument("--url", default=os.getenv("BACKEND_URL", "http://127.0.0.1:9000"),
                         help="Backend base URL (default: %(default)s, or BACKEND_URL env var)")
    parser.add_argument("--secret", default=os.getenv("POS_WEBHOOK_SECRET"),
                         help="POS webhook secret (default: reads POS_WEBHOOK_SECRET env var)")
    parser.add_argument("--min-interval", type=float, default=3.0, help="Minimum seconds between sales")
    parser.add_argument("--max-interval", type=float, default=15.0, help="Maximum seconds between sales")
    parser.add_argument("--timeout", type=float, default=5.0, help="HTTP request timeout in seconds")
    args = parser.parse_args()

    if not args.secret:
        print(
            "No webhook secret provided. Set POS_WEBHOOK_SECRET in your environment "
            "(must match the backend's POS_WEBHOOK_SECRET) or pass --secret.",
            file=sys.stderr,
        )
        sys.exit(1)

    if args.min_interval <= 0 or args.max_interval < args.min_interval:
        print("Invalid interval range: need 0 < min-interval <= max-interval.", file=sys.stderr)
        sys.exit(1)

    print(f"Simulating live register against {args.url} (Ctrl+C to stop)")
    print(f"Interval: {args.min_interval}s - {args.max_interval}s between sales\n")

    try:
        while True:
            fire_sale(args.url, args.secret, args.timeout)
            time.sleep(random.uniform(args.min_interval, args.max_interval))
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
