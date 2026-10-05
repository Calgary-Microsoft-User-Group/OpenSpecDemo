# Cookie Shop Website — Implementation Plan

**Based on:** `spec.md` (Draft v2, 2026-09-28)
**Status:** Ready for review

This plan breaks the spec into phases. Each phase ends with something that runs and can be checked. Requirement numbers (R1–R16) refer to `spec.md` §9.

---

## Approach at a Glance

- **Dependencies:** only two, `express` (v5) and `ejs`. Tests use Node's built-in test runner and `fetch`, so no test libraries are needed.
- **Core logic first:** stock status, seasons, dietary filters, and bundle pricing go in one module (`src/inventory.js`) with no web code. That module is tested before any pages are built.
- **Public pages work without JavaScript:** menu filters are a normal form that reloads the page with query parameters (`/menu?diet=vegan&hideSoldOut=1`). Only the admin page needs JavaScript.
- **Data in memory, saved on every change:** `inventory.json` is loaded at startup. Each admin change updates memory and then saves the file safely. Admin changes show up on the site immediately with no restart (R10).
- **Testable dates:** everything date-related takes a `now` value, so tests can pretend it's Feb 29 or Dec 31.

## File Layout

```
package.json
server.js                 # reads env vars, starts the app
src/
  app.js                  # createApp({ store, shop, adminPassword, now }) → Express app
  inventory.js            # pure logic: status, seasons, filters, pricing, validation
  store.js                # load/save inventory.json safely, one save at a time
  auth.js                 # admin password check + write protections
  routes/
    pages.js              # public pages
    api.js                # public + admin API
    admin.js              # admin page
views/
  layout.ejs              # shared header, nav, footer (allergen notice)
  home.ejs  menu.ejs  cookie.ejs  about.ejs  contact.ejs  admin.ejs  404.ejs
  partials/cookie-card.ejs  partials/stock-badge.ejs
public/
  css/site.css
  js/admin.js
  images/placeholder-cookie.svg
data/
  inventory.json          # 21 cookies + 2 bundles from spec §4
  shop.json               # placeholder shop details, time zone, threshold
test/
  inventory.test.js  store.test.js  api.test.js  pages.test.js  auth.test.js
README.md
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Port the server listens on |
| `ADMIN_PASSWORD` | *(none)* | Admin password. If it isn't set, admin routes return 404. |
| `DATA_DIR` | `./data` | Where `inventory.json` lives. Point this at the host's persistent disk. |

On first start, if `DATA_DIR` has no `inventory.json`, the app copies the starter file from the repo into it.

---

## Phase 1 — Project Setup

- [ ] 1.1 Create `package.json` with `"type": "module"`, Node `>=24`, and scripts:
  - `start` → `node server.js`
  - `dev` → `node --watch server.js`
  - `test` → `node --test`
- [ ] 1.2 Install `express` and `ejs`.
- [ ] 1.3 Add `.gitignore` (`node_modules/`, `.env`).
- [ ] 1.4 `server.js` starts a "hello" Express app on `PORT`.

**Done when:** `npm run dev` serves a page at `http://localhost:3000`.

## Phase 2 — Data Files

- [ ] 2.1 Write `data/inventory.json` with all 21 cookies and 2 bundles from spec §4, using the §5.1 and §5.2 formats (prices in cents).
- [ ] 2.2 Write `data/shop.json` with placeholder name, address, phone, email, hours, About text, map location, time zone `America/New_York`, and low-stock threshold `6`.
- [ ] 2.3 Point every cookie's `image` at `/images/placeholder-cookie.svg` until real photos arrive.

**Done when:** both files load with `JSON.parse`, and every cookie has every field listed in §5.1.

## Phase 3 — Core Logic (`src/inventory.js`) + Tests

Plain functions with no Express or file access, so they're easy to test.

- [ ] 3.1 `stockStatus(cookie, defaultThreshold)` → `sold-out` / `low` / `in-stock` (§5.4).
- [ ] 3.2 `localMonthDay(now, timeZone)` → `"MM-DD"` using `Intl.DateTimeFormat`.
- [ ] 3.3 `isInSeason(cookie, monthDay)` (R6):
  - `season: null` → always in season.
  - `start <= end` → in season when `start <= today <= end`.
  - `start > end` (crosses the new year) → in season when `today >= start` **or** `today <= end`.
  - Feb 29 is treated as Feb 28, so a season ending `02-28` includes it in leap years.
- [ ] 3.4 `dietFilters(cookie)` → list including `egg-free` (no egg), `dairy-free` (no milk), `vegetarian`, plus the hand-entered `tags` (R13).
- [ ] 3.5 `visibleCookies(cookies, { monthDay, category, diet, hideSoldOut })` → active, in-season cookies, filtered, in file order (R1, R3, R4).
- [ ] 3.6 `featuredCookies(...)` → featured, active, in-season cookies. If there are none, fall back to in-season seasonal cookies (R8).
- [ ] 3.7 `returnsOn(cookie)` → the season start date, for out-of-season pages (R7).
- [ ] 3.8 `checkBundlePricing(cookies, bundles)` → lists any bundle priced above count × the cheapest active cookie (R15).
- [ ] 3.9 `validatePatch(body)` → accepts only `stock` (whole number ≥ 0), `priceCents` (whole number > 0), `active`, `featured` (true/false). Rejects unknown fields and returns a clear message (R12).
- [ ] 3.10 `formatPrice(cents)` → `"$3.00"`.

**Tests (`test/inventory.test.js`):**
- Stock status at 0, at the threshold, one above it, and with a per-cookie threshold.
- Seasons on Dec 1, Dec 31, Jan 1, Feb 28, **Feb 29**, Mar 1, Nov 30 (last day of fall), and Sep 1 (first day of fall).
- Time zone: 11:30 pm Aug 31 in New York is already Sep 1 in UTC, so Pumpkin Spice must *not* show yet.
- On any date, exactly one seasonal cookie is in season.
- Diet filters match the table in spec §5.3.
- The real `inventory.json` passes the bundle pricing check.
- Bad input rejected: `-1`, `2.5`, `"10"`, `0` price, unknown fields.

**Done when:** `npm test` passes.

## Phase 4 — Saving Data (`src/store.js`) + Tests

- [ ] 4.1 `loadStore(dataDir, seedFile)` reads `inventory.json`, first copying the starter file if it's missing.
- [ ] 4.2 `store.update(id, changes)` / `store.resetStock()` change memory, then save.
- [ ] 4.3 Safe save: write to `inventory.json.tmp`, then rename it over the real file.
- [ ] 4.4 Saves run one at a time, so two quick taps on the admin page can't overwrite each other.
- [ ] 4.5 If a save fails, undo the change in memory and report an error.

**Tests (`test/store.test.js`, using a temp folder):** changes survive a reload; 20 updates in a row all land; reset sets every cookie to `defaultStock`; a missing file is created from the starter file.

## Phase 5 — Public API

- [ ] 5.1 `createApp()` in `src/app.js`: JSON body parsing, static files from `public/`, EJS views.
- [ ] 5.2 `GET /api/cookies` with `?category=` and `?diet=`. Each result includes `status`, `dietFilters`, and `priceFormatted`.
- [ ] 5.3 `GET /api/cookies/:id`. Out-of-season cookies include `inSeason: false` and `returnsOn`. Inactive or unknown IDs return 404.
- [ ] 5.4 `GET /api/bundles`.
- [ ] 5.5 Unknown `category` or `diet` values return 400.

**Tests (`test/api.test.js`):** start the app on a random port with a fixed date and a temp data folder, then call it with `fetch`.

## Phase 6 — Public Pages

- [ ] 6.1 `layout.ejs`: shop name, nav (Home, Menu, About, Contact), footer with hours and the **shared-kitchen allergen notice** (R14).
- [ ] 6.2 **Home** `/`: intro, featured cookies (R8), hours, address.
- [ ] 6.3 **Menu** `/menu`:
  - Cookies grouped by category (R1).
  - Each card shows name, photo, price, stock status, allergens, and diet filters (R2).
  - Sold-out cookies stay in place, greyed out and labeled "Sold out" (R3).
  - Filter form with category, diet, and "Hide sold out," using a GET request so it works without JavaScript (R3, R4).
  - A "Bundles" section (R5).
- [ ] 6.4 **Cookie detail** `/menu/:id`: full details and the allergen notice. Out of season → "Back in December" (R7). Inactive → 404 page.
- [ ] 6.5 **About** and **Contact**: content from `shop.json`, `tel:` and `mailto:` links, OpenStreetMap iframe.
- [ ] 6.6 404 page.
- [ ] 6.7 Check the words "gluten-free" never appear in any page or data file (R14). This becomes a test.

**Tests (`test/pages.test.js`):** each page returns 200 and includes the allergen notice; menu filters change what's shown; sold-out cookies are shown and then hidden with the toggle; the out-of-season page shows its return date; the "gluten-free" check.

## Phase 7 — Admin

- [ ] 7.1 `src/auth.js` checks the password:
  - HTTP Basic Auth against `ADMIN_PASSWORD`, compared with `crypto.timingSafeEqual` so timing doesn't leak it.
  - Wrong or missing password → 401 with a login prompt.
  - `ADMIN_PASSWORD` not set → admin routes return 404 (R9).
- [ ] 7.2 **Write protection:** browsers send saved Basic Auth passwords automatically, so another website could try to trigger admin changes. To block that, admin write requests must:
  - Use `Content-Type: application/json`, which a plain HTML form on another site can't send.
  - Have an `Origin` header matching the site, if one is sent.
- [ ] 7.3 Admin API:
  - `GET /api/cookies?all=true`
  - `PATCH /api/cookies/:id` (uses `validatePatch`, R10, R12)
  - `POST /api/cookies/reset-stock` (R11)
- [ ] 7.4 **Admin page** `/admin`, built for phones:
  - One row per cookie: name, big **−1** / stock count / **+1** buttons, **Sold out** button.
  - Price field, plus Active and Featured switches.
  - Out-of-season and inactive cookies are shown, labeled.
  - "Reset to daily defaults" button that asks for confirmation first.
  - Warning at the top if any bundle breaks the pricing rule (R15).
- [ ] 7.5 `public/js/admin.js`: sends `PATCH` / `POST` with `fetch`, updates the row, and shows an error message if the request fails.

**Tests (`test/auth.test.js`, plus more in `api.test.js`):** no password → 401; wrong password → 401; no `ADMIN_PASSWORD` → 404; right password works; form-encoded POST rejected; wrong `Origin` rejected; a PATCH shows up on `/menu` right away; bad PATCH → 400 and data unchanged.

## Phase 8 — Design, Phones & Accessibility

- [ ] 8.1 `site.css`: warm bakery look, card grid, one column on phones, fonts that scale with screen size.
- [ ] 8.2 Placeholder cookie illustration (`placeholder-cookie.svg`).
- [ ] 8.3 Accessibility checks (R16):
  - Text contrast at least 4.5:1.
  - Visible keyboard focus everywhere.
  - Alt text on all images.
  - Stock status and allergens written in words, not shown by color or icon alone.
  - Labels on every form field; admin buttons have labels like "Remove one Snickerdoodle."
  - Buttons at least 44 px tall on the admin page.
- [ ] 8.4 Check every page at 375 px wide with no sideways scrolling.

## Phase 9 — Polish & Ready to Deploy

- [ ] 9.1 Basic security headers, including a Content Security Policy that allows the OpenStreetMap iframe.
- [ ] 9.2 Friendly 500 error page; log errors to the console.
- [ ] 9.3 `README.md`: how to run locally, set env vars, run tests, and deploy with a persistent disk (`DATA_DIR`), plus a reminder to use HTTPS.
- [ ] 9.4 Final check: `npm test` passes, and click through every page and admin action by hand.

---

## Requirement Coverage

| Requirement | Built in | Tested in |
|-------------|----------|-----------|
| R1 Only active, in-season cookies | 3.5, 6.3 | inventory, pages |
| R2 Price, status, allergens, diet on each cookie | 5.2, 6.3 | api, pages |
| R3 Sold out stays visible, can be hidden | 3.5, 6.3 | pages |
| R4 Category and diet filters | 3.5, 6.3 | inventory, pages |
| R5 Bundles on menu | 5.4, 6.3 | api, pages |
| R6 Season dates incl. new year | 3.3 | inventory |
| R7 Out-of-season page says when it returns | 3.7, 6.4 | pages |
| R8 Featured cookies on Home | 3.6, 6.2 | inventory, pages |
| R9 Admin needs password | 7.1 | auth |
| R10 Admin changes show immediately | 4.2, 7.3 | api |
| R11 Reset to daily defaults | 4.2, 7.3 | store, api |
| R12 Bad admin input rejected | 3.9, 7.3 | inventory, api |
| R13 Egg-/dairy-free worked out from allergens | 3.4 | inventory |
| R14 Allergen notice, no "gluten-free" | 6.1, 6.7 | pages |
| R15 Bundle pricing rule | 3.8, 7.4 | inventory |
| R16 Phones and accessibility | 8.1–8.4 | manual check |

## Risks & How They're Handled

| Risk | How it's handled |
|------|------------------|
| Another website tricks a logged-in admin's browser into changing stock | JSON-only writes and `Origin` check (7.2) |
| Host wipes `inventory.json` on restart | `DATA_DIR` on a persistent disk; README explains (9.3) |
| Two quick admin taps overwrite each other | Saves run one at a time (4.4) |
| Crash mid-save corrupts the file | Write to a temp file, then rename (4.3) |
| Wrong cookie shown near midnight on a season change | Seasons use the shop's time zone, with tests (3.2) |
| Allergen wording isn't legally right for your area | Owner confirms wording (spec §10, item 6) |

## Not in This Plan

Pickup orders, payments, customer accounts, contact form, and delivery (all v2 or later, per spec §2).
