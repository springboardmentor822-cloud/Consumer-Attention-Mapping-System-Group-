# Consumer Attention Mapping System — Frontend

Next.js 15 + React 19 + Tailwind CSS, with hand-built shadcn-style primitives
(Button, Card, Input) — swap for the real `shadcn/ui` CLI components later if
your team wants the exact library; the styling tokens already match.

## Local Setup

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Point it at your backend:**
   ```
   copy .env.local.example .env.local
   ```
   Edit `.env.local` if your backend isn't on `http://localhost:8000`.
   Note: `NEXT_PUBLIC_API_BASE_URL` is baked in at **build time**, not
   read at container runtime — see `docs/DEPLOYMENT.md` if you're
   deploying anywhere other than localhost.

3. **Run the dev server** (make sure the backend is running first):
   ```
   npm run dev
   ```
   Visit http://localhost:3000 — redirects to `/login`.

4. **Try it:**
   - Register a `StoreManager` account
   - You're redirected to `/stores` — add a store, click it to expand, add a shelf
   - Visit `/dashboard` and pick a role view: Store Manager, Retail
     Analyst, Marketing Manager, or Admin — each pulls real data from the
     backend's analytics endpoints (dwell time, heatmaps, product
     interactions, journeys, campaigns, alerts, recommendations)
   - Log out, register an `Analyst` account, try adding a store —
     the backend's 403 will surface as an error message in the UI
     (this is intentional — it proves the role check isn't just a
     backend implementation detail, the frontend surfaces it honestly)

## Structure

```
frontend/
├── app/
│   ├── login/page.tsx              # register/login toggle
│   ├── forgot-password/page.tsx
│   ├── stores/page.tsx             # store list, create, shelf management
│   ├── dashboard/
│   │   ├── page.tsx                # role picker / landing
│   │   ├── store-manager/page.tsx
│   │   ├── retail-analyst/page.tsx
│   │   ├── marketing-manager/page.tsx  # campaigns, funnel/radar/waterfall charts
│   │   └── admin/page.tsx          # system config, help & support
│   ├── layout.tsx
│   └── globals.css                 # shadcn-style CSS variable tokens (light/dark)
├── components/ui/                  # Button, Card, Input — shadcn-style primitives
├── lib/
│   ├── api.ts                      # typed API client matching the backend contract exactly
│   └── utils.ts
└── package.json
```

## Notes

- JWT is stored in `localStorage` — fine for this milestone's scope, but
  worth reconsidering (httpOnly cookies) before this touches real user data.
- Next.js is pinned to `15.5.20` and React to `19.2.6` deliberately —
  the 14.x line has no backported fix for a CSP-nonce XSS CVE
  (GHSA-ffhc-5mcf-pf4q) affecting App Router. `npm audit` should show
  0 vulnerabilities; if it doesn't after you install, don't ignore it.
- Deployed live via Docker/AWS EC2 — see `docs/DEPLOYMENT.md`.
