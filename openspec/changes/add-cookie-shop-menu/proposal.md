# Proposal

## Why

The cookie shop has no website. Customers can't see what's baked today, what it costs, or whether it's safe for their allergies without calling or visiting in person, and the owner has no single place that drives what the shop shows. `spec.md` (Draft v2) lays out a browse-only Node.js site that fixes this: a public menu with live stock and allergen/dietary info, backed by one inventory data file. This change builds that foundation — the inventory data model and its rules, plus the public site and API that read from it. Admin editing of that data is a separate, follow-on change (`add-inventory-admin`) so this change can ship and be reviewed on its own.

## What Changes

- Add the cookie and bundle data model (`data/inventory.json`, `data/shop.json`) covering the 21 cookies (8 classic, 6 specialty, 3 dietary-friendly, 4 seasonal) and 2 bundles listed in `spec.md` §4, using the field layout in `spec.md` §5.
- Add stock-status rules (sold out / only a few left / in stock) and season rules, including seasons that cross the new year (Gingerbread: Dec 1 – Feb 28/29) and the rule that exactly one seasonal cookie is on the menu on any given day.
- Add dietary filters (egg-free, dairy-free, vegan, made-without-gluten, vegetarian) worked out from each cookie's allergens and tags rather than entered separately, and add sesame to the tracked allergen list.
- Add a bundle-pricing rule: no bundle may cost more than buying the same count of the cheapest active cookie individually.
- Add public pages: Home, Menu (with category and dietary filters, sold-out toggle), Cookie detail (including an in-season-later notice for out-of-season cookies), About, Contact.
- Add a public read-only JSON API: `GET /api/cookies`, `GET /api/cookies/:id`, `GET /api/bundles`.
- Add the shared-kitchen allergen notice on every page, and enforce "made without gluten" wording instead of "gluten-free".
- Meet WCAG 2.1 AA and phone-width layout for all pages added here.

Out of scope for this change (per `spec.md` §2 and deferred to `add-inventory-admin`): the admin page, admin authentication, and any endpoint that writes to the inventory data. Online ordering, payments, accounts, and delivery remain out of scope for v1 entirely.

## Capabilities

### New Capabilities
- `cookie-inventory`: The inventory and bundle data model, stock-status rules, season rules (including year-wraparound), dietary-filter derivation, and bundle-pricing rule. Read-only in this change — nothing here can change stock, price, or availability yet.
- `cookie-menu-site`: The public-facing pages (Home, Menu, Cookie detail, About, Contact) and the public read-only API that they and other clients use to read from `cookie-inventory`.

### Modified Capabilities
_None — this is a greenfield project with no existing specs._

## Impact

- **New code**: `server.js`, `src/app.js`, `src/inventory.js`, `src/routes/pages.js`, `src/routes/api.js`, EJS views under `views/`, static assets under `public/`.
- **New data**: `data/inventory.json`, `data/shop.json` (owner-facing placeholders per `spec.md` §10 until real shop details and photos are supplied).
- **Dependencies**: `express`, `ejs` (see `plan.md` Phase 1).
- **No breaking changes** — this is the first version of the site.
- **Depends on for the next change**: `add-inventory-admin` will modify the `cookie-inventory` capability to make stock, price, `active`, and `featured` writable, and will add a new `inventory-admin` capability (admin page + admin API + password auth).
