"""
Quick sanity check: read a handful of raw entries straight back out of
the Redis stream, to confirm push_tracking_event() actually wrote
correct, decodable data - not just that it returned success.
"""

import json

from app.core.redis_client import redis_client, TRACKING_STREAM_KEY

# XRANGE with count=5, from the very start ("-") to the very end ("+") -
# just grabs the first 5 entries ever pushed, regardless of when.
entries = redis_client.xrange(TRACKING_STREAM_KEY, min="-", max="+", count=5)

print(f"Stream length (total entries): {redis_client.xlen(TRACKING_STREAM_KEY)}")
print(f"Showing first {len(entries)} entries:\n")

for entry_id, fields in entries:
    print(f"id={entry_id}")
    print(f"  frame_index={fields['frame_index']}")
    print(f"  source_id={fields['source_id']}")
    print(f"  track_ids={json.loads(fields['track_ids'])}")
    print(f"  xyxy={json.loads(fields['xyxy'])}")
    print()
