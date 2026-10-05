# Tasks

## 1. Safe, Writable Data Store

- [ ] 1.1 Implement `src/store.js`: `loadStore(dataDir)` reads `inventory.json`/`shop.json` into memory (reusing/replacing the read-only loader from `add-cookie-shop-menu`), and verify a unit test loads a temp-directory copy without error
- [ ] 1.2 Implement `store.update(id, changes)`, validating via the shared `validatePatch()`/field-level checks from `src/inventory.js` per the Cookie-writes-are-validated requirement, and verify unit tests cover a valid update, a negative `stock`, a fractional `priceCents`, a zero `priceCents`, and an unknown field, in each rejection case asserting the stored record is unchanged
- [ ] 1.3 Implement `store.resetStock()` setting every cookie's `stock` to `defaultStock` per the Daily-stock-reset requirement, and verify a unit test confirms every cookie matches its default afterward regardless of prior value
- [ ] 1.4 Implement the safe save sequence (write to `inventory.json.tmp`, rename over `inventory.json`) per the Writes-are-saved-without-corruption-or-loss requirement, and verify a unit test that forces a save failure leaves the previously saved file intact and readable
- [ ] 1.5 Serialize concurrent saves (queue or mutex) so overlapping updates apply one at a time, and verify a unit test fires two updates to different cookies concurrently and confirms both are present in the final saved data
- [ ] 1.6 Verify with a unit test that a value accepted by `store.update` is immediately readable from the same in-memory store (no reload needed), per the Accepted-writes-are-visible-immediately requirement

## 2. Admin Authentication

- [ ] 2.1 Implement `src/auth.js`: HTTP Basic Auth check against `process.env.ADMIN_PASSWORD` using `crypto.timingSafeEqual`, per the Admin-routes-require-a-password requirement, and verify unit tests cover a correct password, a wrong password, and a missing `Authorization` header
- [ ] 2.2 Wire the auth check as Express middleware in front of `/admin` and all `/api/cookies*` admin endpoints, and verify an integration test confirms 401 without credentials and success with the correct ones
- [ ] 2.3 Make admin routes respond 404 when `ADMIN_PASSWORD` is unset, and verify a test starting the app with that variable unset gets 404 from `/admin` and from an admin API call

## 3. Write-Request Forgery Protection

- [ ] 3.1 Add middleware rejecting any admin write (`PATCH`/`POST`) whose `Content-Type` is not `application/json`, per the Admin-writes-are-protected-against-cross-site-forgery requirement, and verify a test sending `application/x-www-form-urlencoded` to an admin write endpoint gets rejected
- [ ] 3.2 Add middleware rejecting an admin write whose `Origin` header (when present) does not match the site's own origin, and verify a test with a mismatched `Origin` gets rejected even with correct credentials and JSON content type
- [ ] 3.3 Verify with a test that a same-origin JSON request with the correct password and no conflicting `Origin` succeeds, confirming the two protections above don't block legitimate admin traffic

## 4. Admin API

- [ ] 4.1 Implement `GET /api/cookies?all=true` returning every cookie including inactive and out-of-season ones, each labeled with its visibility/season status, per the Admin-can-view-every-cookie requirement, and verify a test confirms an inactive and an out-of-season cookie are both present and correctly labeled
- [ ] 4.2 Implement `PATCH /api/cookies/:id` accepting `stock`/`priceCents`/`active`/`featured` via `store.update`, returning 400 with the invalid field named on rejection and 404 for an unknown id, per the Admin-can-update-a-cookie requirement, and verify tests cover a valid update, an invalid update (data unchanged), and an unknown id
- [ ] 4.3 Implement `POST /api/cookies/reset-stock` calling `store.resetStock()`, per the Admin-can-reset-all-stock requirement, and verify a test confirms every cookie's `stock` equals its `defaultStock` after the call
- [ ] 4.4 Verify with an integration test that a `PATCH` accepted by the admin API is immediately reflected in the public `GET /api/cookies/:id` response (no restart), per the Accepted-writes-are-visible-immediately requirement

## 5. Admin Page

- [ ] 5.1 Build `views/admin.ejs`: one row per cookie (from `GET /api/cookies?all=true`) with large −1/+1/Sold-out controls, price field, and Active/Featured toggles, each control carrying a descriptive accessible label, per the Admin-page-is-usable-on-a-phone requirement, and verify a manual keyboard-and-screen-reader-label pass on the rendered page
- [ ] 5.2 Add `public/js/admin.js` to send `PATCH`/`POST` requests via `fetch` with `Content-Type: application/json`, update the row on success, and show an inline error on a rejected request, and verify a page test drives a stock change end to end and confirms the displayed count updates
- [ ] 5.3 Add the "Reset to daily defaults" control with a confirmation step before it calls `POST /api/cookies/reset-stock`, per the Admin-can-reset-all-stock confirmation scenario, and verify a test confirms the reset endpoint is not called until confirmation is given
- [ ] 5.4 Add a bundle-pricing warning banner that calls the shared `checkBundlePricing()` check on page load and names any offending bundle, per the Admin-page-surfaces-bundle-pricing-violations requirement, and verify a test with a deliberately over-priced bundle shows the warning and a correctly priced one does not
- [ ] 5.5 Verify every admin page control is reachable and operable at a 375px viewport with no horizontal scrolling

## 6. Deployment & Documentation

- [ ] 6.1 Add `DATA_DIR` environment variable support so `inventory.json`/`shop.json` can live outside the repo (on a host's persistent disk), defaulting to `./data`, and verify a test loads/saves from a custom `DATA_DIR`
- [ ] 6.2 On startup, if `DATA_DIR` has no `inventory.json`, copy the repo's starter file into it, and verify a test confirms this happens on a fresh empty `DATA_DIR`
- [ ] 6.3 Update `README.md` with: `ADMIN_PASSWORD` and `DATA_DIR` setup, a note that hosting must keep `DATA_DIR` on storage that survives restarts (serverless is unsuitable), a reminder to serve over HTTPS in production, and how to rotate `ADMIN_PASSWORD`, and verify the documented steps work as written
- [ ] 6.4 Run `npm test` and confirm all tests (from this change and `add-cookie-shop-menu`) pass, then manually verify: logging into `/admin`, changing a cookie's stock and seeing it reflected on `/menu`, triggering and confirming a daily reset, and confirming a wrong password is rejected
