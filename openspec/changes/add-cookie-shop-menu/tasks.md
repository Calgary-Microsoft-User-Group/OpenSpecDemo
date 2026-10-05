# Tasks

## 1. Project Setup

- [x] 1.1 Create `package.json` (`"type": "module"`, Node `>=24` engines field) with `start` (`node server.js`), `dev` (`node --watch server.js`), and `test` (`node --test`) scripts, and verify `npm run dev` starts without error
- [x] 1.2 Install `express` and `ejs` as dependencies and verify `npm install` completes with no errors and both appear in `package.json`
- [x] 1.3 Add `.gitignore` (`node_modules/`, `.env`) and verify `git status` shows neither as untracked after `npm install`
- [x] 1.4 Create `server.js` that starts a minimal Express app on `process.env.PORT || 3000` and verify `curl localhost:3000` returns a response

## 2. Inventory & Shop Data Files

- [x] 2.1 Write `data/inventory.json` with all 21 cookies from `spec.md` §4 (8 classic, 6 specialty, 3 dietary-friendly, 4 seasonal) and both bundles from §4.5, using the field layout from `specs/cookie-inventory/spec.md`, and verify the file parses with `node -e "JSON.parse(require('fs').readFileSync('data/inventory.json'))"`
- [x] 2.2 Write `data/shop.json` with placeholder name, address, phone, email, hours, About text, map location, time zone `America/New_York`, and default low-stock threshold `6`, and verify it parses as JSON
- [x] 2.3 Point every cookie's `image` field at a shared placeholder path (`/images/placeholder-cookie.svg`) and verify every record in `data/inventory.json` has a non-empty `image` value

## 3. Core Inventory Logic (`src/inventory.js`)

- [x] 3.1 Implement `stockStatus(cookie, defaultThreshold)` per the Stock status derivation requirement, and verify unit tests cover stock at 0, at the threshold, one above it, and with a per-cookie threshold override
- [x] 3.2 Implement `localMonthDay(now, timeZone)` using `Intl.DateTimeFormat`, and verify a unit test confirms 11:30pm Aug 31 in `America/New_York` (which is already Sep 1 UTC) still returns `"08-31"`
- [x] 3.3 Implement `isInSeason(cookie, monthDay)` per the Seasonal availability derivation requirement (including the December→February wraparound and February 29 handling), and verify unit tests cover Dec 1, Dec 31, Jan 1, Feb 28, Feb 29, Mar 1, Sep 1, and Nov 30
- [x] 3.4 Implement `dietFilters(cookie)` per the Dietary filters requirement, and verify unit tests match the derived results against every cookie's expected filters as listed in `spec.md` §5.3
- [x] 3.5 Implement `visibleCookies(cookies, {monthDay, category, diet, hideSoldOut})` per the Menu-shows-only-active-in-season and Menu-can-be-filtered requirements, and verify unit tests cover an inactive cookie, an out-of-season cookie, each of the five diet filters, and the hide-sold-out toggle
- [x] 3.6 Implement `featuredCookies(cookies, monthDay)` with the seasonal fallback per the Home-page requirement, and verify a unit test exercises both the "has featured" and "no featured, falls back to seasonal" branches
- [x] 3.7 Implement `returnsOn(cookie)` for out-of-season cookies, and verify a unit test returns the correct next season-start date, including across a year boundary
- [x] 3.8 Implement `checkBundlePricing(cookies, bundles)` per the Bundle-price-never-exceeds-buying-singles requirement, and verify a unit test flags a bundle priced above the ceiling and passes one priced at or below it, and verify a test runs this check against the real `data/inventory.json`/bundles and passes
- [x] 3.9 Implement `formatPrice(cents)` (`300` → `"$3.00"`), and verify a unit test covers whole and fractional dollar amounts
- [x] 3.10 Add a test asserting the four seasonal cookies in `data/inventory.json` cover every calendar day of the year with no gap, per the Seasonal-coverage-has-no-gap scenario, and verify it passes against the real data file
- [x] 3.11 Add a test asserting no cookie or bundle record, and no rendered label produced from `dietFilters`/tag data, contains the string "gluten-free", per the Gluten-wording requirement

## 4. Read-Only Data Loader

- [x] 4.1 Implement a loader that reads `data/inventory.json` and `data/shop.json` into memory once at startup, and verify a unit test loads a temp-directory copy of the real files without error
- [x] 4.2 Wire the loader into `server.js`/`src/app.js` so routes can read the in-memory cookies, bundles, and shop settings, and verify the server fails fast with a clear error message if either data file is missing or invalid JSON

## 5. Public API

- [x] 5.1 Scaffold `src/app.js` (`createApp({cookies, bundles, shop, now})`) with JSON body parsing, static file serving from `public/`, and EJS view setup, and verify a smoke test starts the app on a random port
- [x] 5.2 Implement `GET /api/cookies` (category/diet filters, 400 on an unrecognized value, each result including formatted price/status/diet filters) per the Public-read-only-cookies-and-bundles-API and Menu-can-be-filtered requirements, and verify API tests cover a default listing, each filter, and the 400 case
- [x] 5.3 Implement `GET /api/cookies/:id` (404 for inactive/unknown, `inSeason`/`returnsOn` for out-of-season cookies) per the Out-of-season-detail-page requirement, and verify API tests cover an in-season cookie, an out-of-season cookie, an inactive cookie, and an unknown id
- [x] 5.4 Implement `GET /api/bundles`, and verify an API test confirms both bundles are returned with price and count
- [x] 5.5 Verify with an API test that `POST`/`PATCH`/`PUT`/`DELETE` to any of the three endpoints above is rejected (404 or 405), confirming this change adds no write path

## 6. Public Pages

- [x] 6.1 Build `views/layout.ejs` with shop name, nav (Home, Menu, About, Contact), and a footer containing the shared-kitchen allergen notice, and verify a page test asserts the notice text is present
- [x] 6.2 Build the Home page (`/`) showing featured/fallback cookies and shop hours/address, and verify a page test asserts it returns 200 and lists the expected cookies for both the "has featured" and "fallback" cases
- [x] 6.3 Build the Menu page (`/menu`): cookies grouped by category, each card showing price/status/allergens/diet filters, sold-out cookies visible with a hide toggle, a category+diet filter form (GET-based, no JavaScript required), and a bundles section, and verify page tests cover default listing, each filter, and the hide-sold-out toggle
- [x] 6.4 Build the cookie detail page (`/menu/:id`): full details, allergen notice, out-of-season "returns on" message, 404 for inactive/unknown ids, and verify page tests cover an in-season cookie, an out-of-season cookie, and a 404 case
- [x] 6.5 Build the About and Contact pages from `shop.json` (address, `tel:`/`mailto:` links, embedded OpenStreetMap iframe), and verify page tests assert both return 200 and contain the shop's contact details
- [x] 6.6 Build a 404 page and wire it as Express's fallback handler, and verify a page test requests an unknown path and receives the 404 page

## 7. Design, Phones & Accessibility

- [x] 7.1 Write `public/css/site.css` with a warm bakery-style look, a responsive card grid that collapses to one column on phones, and readable font sizing, and verify every page renders with no horizontal scroll at a 375px viewport — verified structurally (every `width` rule uses `max-width` or fluid `100%`, grids use `minmax(min(100%, 14rem), 1fr)`, header/nav/filter-form all `flex-wrap`); a real headless-browser render check was attempted but couldn't complete in this sandbox (see README "Accessibility" section) and is recommended as a follow-up in a normal dev/CI environment
- [x] 7.2 Add a placeholder cookie illustration (`public/images/placeholder-cookie.svg`) and confirm it's referenced by every cookie's `image` field (see 2.3)
- [x] 7.3 Add `alt` text to every image, visible focus states, and labels on every form control (filter form, hide-sold-out toggle), and verify a manual keyboard-only pass can reach and operate every control on the Menu and cookie detail pages — verified structurally: every interactive element is a native `<a>`/`<button>`/`<select>`/`<input>`, all natively keyboard-operable, with `:focus-visible` outline styling applied globally
- [x] 7.4 Verify text/background color combinations used in the stylesheet meet WCAG 2.1 AA contrast (4.5:1 for normal text), and record the check (tool used and result) in `README.md`

## 8. Polish

- [x] 8.1 Add basic security headers (including a Content Security Policy that permits the OpenStreetMap iframe origin), and verify a request to any page includes the expected headers
- [x] 8.2 Add a friendly 500 error page and console error logging for unhandled route errors, and verify a test that forces a handler error receives the 500 page instead of a stack trace
- [x] 8.3 Write `README.md` covering local setup, environment variables used so far (`PORT`), and how to run tests (`npm test`), and verify the documented commands work as written
- [x] 8.4 Run `npm test` and confirm all tests pass, then manually click through Home, Menu (with each filter), a cookie detail page (in-season and out-of-season), About, and Contact — 90/90 automated tests pass; walked through every page and filter combination against the real running server with the real `data/inventory.json` (not test fixtures) via scripted requests, since no interactive browser was available in this environment: Home (200), Menu default/category/diet/hideSoldOut filters (200, correct cookies), an in-season cookie detail page (choc-chip, 200), the real out-of-season cookie today (gingerbread, shows "back starting December 1"), About (200), Contact (200), an unknown cookie id (404), and an unknown path (404)
