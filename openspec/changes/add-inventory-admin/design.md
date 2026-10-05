# Design

## Context

See `proposal.md` - Why. This change builds on the public site and read-only `src/inventory.js` core-logic module delivered by `add-cookie-shop-menu`; it does not change that module's stock-status/season/diet/bundle-pricing rules, only who can write the fields those rules read. `plan.md` (repo root) already works out this admin surface as Phase 7, with Phases 4 (safe saving) and parts of 9 (deployment) as prerequisites; this design follows that structure.

## Goals / Non-Goals

**Goals:**
- Make `stock`, `priceCents`, `active`, and `featured` writable without weakening any guarantee the public site already relies on (validation, immediate visibility, no data corruption).
- Keep the attack surface small: one shared password, no user accounts, no session/cookie state to secure.
- Make it hard to trigger an admin write by accident from another site, given that HTTP Basic Auth credentials are cached and resent automatically by browsers.

**Non-Goals:**
- Multiple admin users, roles, or an audit log of who changed what — out of scope per `spec.md` (single shared password, per Q6.3's resolution).
- Editing a cookie's fixed fields (name, description, allergens, season dates, etc.) from the admin page — per the `cookie-inventory` MODIFIED requirement, only `stock`/`priceCents`/`active`/`featured` are mutable in this change. Adding/removing whole cookies is a manual data-file edit, unchanged from today.
- Choosing a specific host — this design specifies the constraint (persistent `DATA_DIR`) that any hosting choice must satisfy, per `plan.md` §7.4.

## Decisions

**HTTP Basic Auth, not a custom login page or session.** Matches `spec.md` §7.3. Alternative considered: a login form issuing a session cookie — rejected as unnecessary complexity for a single shared password with no per-user state to track; the browser's built-in prompt is one line of server code (`WWW-Authenticate` header) versus a form, session store, and CSRF token for the login step itself.

**Basic Auth's browser-caching behavior is exactly why write requests need extra protection.** Because browsers resend cached Basic Auth credentials automatically to the same origin, a malicious page the owner has open in another tab could otherwise trigger an admin write with a simple cross-site form POST (classic CSRF), without ever seeing the password. Two independent checks close this: (1) requiring `Content-Type: application/json` on writes, which an HTML `<form>` cannot produce (forms only send `application/x-www-form-urlencoded` or `multipart/form-data`), and (2) checking `Origin` against the site's own origin when the browser sends one. Neither check depends on the other, so either alone would already block a plain-form CSRF attempt; both together also cover simple `fetch`-based cross-site attempts that a well-behaved browser still marks with `Origin`. HTTPS in production (`plan.md` §7.4) additionally keeps the password itself from leaking in transit — orthogonal to this CSRF protection.

**Safe save: temp-file-then-rename, one save in flight at a time.** A save writes the full updated data to `inventory.json.tmp` in the same directory, then renames it over `inventory.json`; `rename` on the same filesystem is atomic, so a crash mid-write leaves either the old file or the new one intact, never a half-written one. A simple in-process queue (or mutex/promise chain) serializes saves so two admin taps submitted close together apply in sequence rather than racing — both requirements come directly from `inventory-admin`'s "Writes are saved without corruption or loss."

**In-memory store is the single source of truth during a run; disk is for durability across restarts.** Every read (public and admin) goes through the same in-memory object that writes update, which is how `cookie-inventory`'s "Accepted writes are visible immediately" is satisfied without re-reading the file on every request. The save-to-disk step exists so a restart or crash doesn't lose the day's stock updates.

**Validation lives with the data shape (`cookie-inventory`), enforcement lives with the endpoint (`inventory-admin`).** The `PATCH` handler calls the same `validatePatch()` function from `src/inventory.js` that this change extends; there's exactly one place that decides whether a `stock`/`priceCents`/`active`/`featured` value is acceptable, so the admin page and admin API can't drift out of sync with each other.

**Bundle-pricing check runs at admin page render time, not on every public request.** `checkBundlePricing()` (from `add-cookie-shop-menu`) is cheap but only useful to the owner, who can act on the warning; customers never see bundle-pricing internals. Running it on `/admin` load, not on every `/menu` request, keeps the public path unchanged from `add-cookie-shop-menu`.

## Risks / Trade-offs

- **[Risk]** A shared password is a single point of compromise — anyone with it can change any price or stock, and it can't be revoked per-person. → **Mitigation**: accepted trade-off for a single-owner shop per `spec.md`'s resolved scope; `README.md` (task 6.x) documents rotating `ADMIN_PASSWORD` if it's ever suspected leaked.
- **[Risk]** HTTP Basic Auth sends the password on every request (base64-encoded, not encrypted) — safe only over HTTPS. → **Mitigation**: `plan.md` §7.4 already requires HTTPS in production; this design doesn't introduce a new exposure but depends on that being honored at deploy time.
- **[Risk]** The `Origin`-check CSRF protection only checks the header when the browser sends one; some legacy or unusual clients omit `Origin` on same-origin requests too. → **Mitigation**: the `Content-Type: application/json` requirement is independently sufficient against the classic form-based CSRF vector, so the `Origin` check is defense-in-depth, not the only barrier.
- **[Risk]** Serializing all saves through one in-process queue means a slow disk could make the admin page feel sluggish under rapid taps. → **Mitigation**: `inventory.json` is small (a few hundred cookie/bundle records at most) and saves are local-disk writes; acceptable for a single-shop admin tool. Revisit only if real usage shows otherwise.
- **[Trade-off]** Choosing not to support editing a cookie's fixed fields (name, allergens, season, etc.) from the admin page means adding a genuinely new cookie, or changing what it's called, still requires a manual edit to `data/inventory.json`. → Accepted: `spec.md` scoped the admin page to daily operational updates (stock/price/visibility), not catalog management; a future change can add that if needed.
