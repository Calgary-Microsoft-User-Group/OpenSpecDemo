# Proposal

## Why

`add-cookie-shop-menu` ships a public menu that reads `data/inventory.json`, but nothing in that change can update it — stock, price, and which cookies show up would have to be edited by hand in a JSON file. `spec.md` (Draft v2) §2/§3.2 calls for the owner to update today's stock and prices from their phone behind the counter. This change adds that: a password-protected admin page and API that write to the inventory the public site already reads, so "sold out" and "only a few left" stay accurate through the day without a code change or restart.

**Sequencing**: this change assumes `add-cookie-shop-menu` has already been applied and archived, since it modifies the `cookie-inventory` capability that change introduces and it reuses the public site's rendering and inventory-loading code.

## What Changes

- Add admin authentication: a single password read from the `ADMIN_PASSWORD` environment variable, checked via HTTP Basic Auth on every admin route; admin routes are disabled (404) when the variable isn't set.
- Add write protection beyond the password: admin write requests must be JSON (`Content-Type: application/json`, which a plain cross-site HTML form can't send) and, when an `Origin` header is present, it must match the site's own origin — blocking another website from using a logged-in admin's saved browser credentials to trigger changes.
- Add safe, serialized saving of `data/inventory.json`: writes go to a temp file and are renamed over the real file, and only one save runs at a time, so concurrent admin taps can't corrupt the file or overwrite each other.
- Add the admin API: `GET /api/cookies?all=true` (every cookie, including inactive/out-of-season), `PATCH /api/cookies/:id` (updates `stock`, `priceCents`, `active`, and/or `featured`, with validation that rejects bad input and leaves the data unchanged), and `POST /api/cookies/reset-stock` (sets every cookie's `stock` back to its `defaultStock`).
- Add the admin page (`/admin`): phone-first layout with −1/+1/Sold-out controls per cookie, price/active/featured editing, a "reset to daily defaults" action with confirmation, visibility into inactive and out-of-season cookies, and a warning banner when a bundle violates the pricing rule from `cookie-inventory`.
- **MODIFIES** the `cookie-inventory` capability: stock, price, `active`, and `featured` become mutable at runtime (previously read-only), and admin writes must be validated and must persist immediately so the public site reflects them without a restart.

## Capabilities

### New Capabilities
- `inventory-admin`: Password-protected admin page and admin API for updating today's stock, prices, and which cookies are shown/featured, plus the request-forgery protections and safe-save behavior that make those writes trustworthy.

### Modified Capabilities
- `cookie-inventory`: Adds requirements that stock, price, `active`, and `featured` are writable (with validation and immediate persistence), where the original delta only covered reading and deriving from these fields.

## Impact

- **New code**: `src/auth.js`, `src/store.js` (safe save + serialized writes), `src/routes/admin.js`, admin API routes added to `src/routes/api.js`, `views/admin.ejs`, `public/js/admin.js`.
- **Modified code**: the read-only loader from `add-cookie-shop-menu` (`src/inventory.js` loader portion) is replaced with the load/save `store.js`; public routes start reading through the same in-memory store so admin writes are visible immediately.
- **New environment variable**: `ADMIN_PASSWORD` (required to enable admin routes), `DATA_DIR` (where `inventory.json`/`shop.json` live, so it can point at a host's persistent disk).
- **Deployment constraint**: because this change makes the server write to disk, hosting must keep `DATA_DIR` on storage that survives restarts — serverless platforms are unsuitable (see `plan.md` §7.4). This wasn't a constraint for `add-cookie-shop-menu` alone.
- **No breaking changes** to the public pages or public API added in `add-cookie-shop-menu` — this change only adds new admin-only routes and makes previously-fixed fields mutable.
