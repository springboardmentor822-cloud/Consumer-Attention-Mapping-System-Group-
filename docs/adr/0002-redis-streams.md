# ADR 0002: Partitioned Redis Streams Messaging

## Status
Proposed & Approved

## Context
Shoppers' tracking coordinates, camera alerts, and product interaction events are generated asynchronously at different speeds. Combining these into a single queue channel introduces lag and complicates consumer parsing logic. We need a performant message broker system that splits tasks by concern and allows multi-stream consumption.

## Decision
We implement a **Partitioned Redis Streams** architecture:
1. **Separated Channels**: We define explicit channels (`tracking_stream`, `interaction_stream`, `alert_stream`, `notification_stream`) to isolate coordinate paths from product pickup analytics and notification pushes.
2. **Standardized Event Schema**: Every message includes a `version`, `type`, `timestamp`, and `trace_id` for consistent deserialization.
3. **Decoupled Worker**: The background stream consumer node reads multiple streams concurrently via `xread` blocking loops to balance CPU load.

## Consequences
- **Pros**: Zero database transaction bottlenecks on the ingestion path; independent scaling of consumer nodes; clear schema isolation per stream.
- **Cons**: Requires managing message serialization/deserialization schemas at both publisher and consumer nodes.
