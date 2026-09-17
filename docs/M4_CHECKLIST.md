# M4 Completion Checklist

- [x] Role dashboards operational — all 4 (Store Manager, Retail Analyst,
  Marketing Manager, Admin) built with real chart types; Marketing
  Manager went from 0 sections to fully built (real Campaign CRUD,
  funnel/radar/waterfall/decision-matrix charts)
- [x] Redis-backed alert engine
- [x] PDF/Excel reporting
- [x] Frontend/FastAPI integration
- [x] Docker build definitions added
- [x] Compose includes application + data services
- [x] CI workflow added and confirmed actually running — real fix: the
  workflow only ever triggered on push to main/master, but this project's
  branch policy never pushes to main directly and no PR had been opened,
  so CI had literally never run once. Fixed to trigger on this branch;
  confirmed GREEN (both backend pytest and frontend build jobs)
- [x] Backend test suite — 80 real tests (grew from 1) covering auth,
  role gating, self-lockout, attractiveness, dwell-time, campaigns,
  exports, heatmaps, journey linking, product interactions,
  tracking-runner stop behavior, admin config, security audit, POS
  ingestion, and logging. Passing in real GitHub Actions CI, not just
  local
- [x] Deployment/API/data-quality documentation added
- [x] Admin dashboard System Configuration + Help & Support sections —
  real read-only config values (secrets excluded) and real links to
  auto-generated API docs (`/docs`, `/redoc`) and `/health/dependencies`
- [x] Camera active/inactive toggle actually stops the running tracking
  process (was previously DB-flag-only)
- [x] Cloud account deployment — real AWS EC2 deployment, verified
  end-to-end (registration + login through the live frontend). See
  `docs/DEPLOYMENT.md` for the instance details and real problems hit
  (EBS sizing, CUDA-wheel bloat) and how they were fixed
- [x] Production secrets configuration — real secrets (JWT, POS webhook
  key, DB password, SMTP credentials) generated directly on the server,
  never passed through chat or committed
- [x] Formal Postman run with captured results — 3 real staleness bugs
  found and fixed by actually running the collection live against a
  running instance (stale test passwords, missing SuperAdmin
  bootstrap step, a shelf-creation request missing a since-added
  required field)
- [x] Security audit/rate-limit benchmark — JWT secret can no longer be
  left at its default (app refuses to start), brute-force lockout added
  (5 failed attempts per username+IP, 15 min), standard security
  response headers added
- [x] Performance/load benchmark with representative camera workload —
  real Locust run (`locustfile.py`) against a live instance; found and
  fixed a real bug (5 endpoints silently returning empty `{}` bodies on
  successful writes, due to a stale-session issue after a second commit)
- [x] Centralized log backend — structured logging with rotation
  (`app.log`/`errors.log`), request logging, unhandled-exception
  handling with full server-side traceback. Explicitly scoped as
  single-process logging, not a distributed trace/aggregation service —
  no infra for that exists in this deployment
- [~] Managed object storage configuration — evaluated, not built:
  exports (PDF/Excel) are generated in-memory and streamed directly,
  never written to disk; heatmaps are cached in Redis as base64. There
  was no actual local storage to migrate, so this was intentionally
  not built as a feature rather than left incomplete
- [~] Domain/HTTPS configuration — explicitly deferred by project
  decision; deployment currently runs on plain HTTP via the raw EC2 IP.
  Real, disclosed limitation — login credentials and JWTs travel
  unencrypted. Needs a real domain or free DDNS subdomain (DuckDNS) for
  Let's Encrypt to issue a cert against
- [~] Pickup/return/comparison candidates — real, shelf-exit/entry-plus-
  contact and cross-SKU-contact heuristics now persisted per-product and
  surfaced as ranked lists on Store Manager and Retail Analyst; still
  not true hand-level detection. A pretrained hand-detection model was
  tested against real store footage and found to fail specifically at
  the moment of interest (hand entering shelf occlusion); scoped a
  fix (occlusion-specific fine-tuning) but the available source footage
  is too short/limited to build a real training set. Not integrated —
  a real, documented limitation, not an oversight
- [~] Cross-camera journey linking — real timing-proximity heuristic
  (event-time + store zone order) now links sessions across different
  cameras; still not true visual re-identification (appearance-embedding
  matching), which does not exist in this system
- [ ] Calibrated floorplan homography and true gaze/shelf layers — needs
  real measured calibration points from the physical store, not
  buildable remotely
- [ ] Real POS population for purchase conversion — receiving side
  (webhook, idempotency, auth) is hardened and tested; no live POS
  system exists to actually connect
- [ ] Model/stream/error monitoring service (beyond `/health` and
  `/health/dependencies` endpoints, which are real)
