# Postman Collection

`Consumer_Attention_Mapping_System.postman_collection.json` — tests
Registration, Login/JWT, Store & Shelf CRUD, and the failure states the
Milestone 1 spec explicitly asked for (unauthorized access, duplicate
email, wrong password, not-found).

**Verified working** — run for real against the live backend with
[Newman](https://www.npmjs.com/package/newman) (Postman's CLI runner):
14 requests, 22 assertions, all passing.

## Import into Postman (GUI)

1. Postman → **Import** → select this `.json` file
2. Set the collection variable `base_url` (top of the collection, or via
   the eye icon) to wherever your backend is running — default
   `http://localhost:8000`
3. Click **Run collection** (or run requests one at a time, top to
   bottom — later requests depend on variables captured from earlier
   ones, like `access_token` and `store_id`)

## Run from the command line (Newman)

```bash
npm install -g newman
newman run Consumer_Attention_Mapping_System.postman_collection.json \
  --env-var "base_url=http://localhost:8000"
```

## What's covered

| Request | Proves |
|---|---|
| Register (success) | Account creation works, returns the right shape |
| Register (failure - duplicate email) | Can't create two accounts with the same email |
| Login (failure - wrong password) | Wrong credentials are rejected (401) |
| Login (success) | Correct credentials return a real JWT |
| /auth/me (success / failure) | Token-based auth actually gates access |
| Stores CRUD (success / 401 / 404) | Store endpoints work and are protected |
| Shelves CRUD (success / 401) | Shelf endpoints work, linked to the right store, and protected |

Each request has a unique auto-generated email per collection run (via
the collection-level pre-request script), so you can re-run the whole
collection repeatedly without "email already registered" errors.
