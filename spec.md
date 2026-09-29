# Cookie Shop Website — Specification

**Status:** Draft v2 for review. Updated with the recommendations in `questionsandrecommendations.md`.
**Date:** 2026-09-28
**Stack:** Node.js (v24), Express, EJS templates, plain JavaScript (ES modules)

---

## 1. Overview

A small Node.js website for a cookie shop. Customers can browse the cookie menu, see prices and today's availability, and check allergen and dietary information. The shop owner updates today's stock, prices, and what's on the menu from a password-protected admin page they can use on a phone behind the counter.

## 2. Goals

- Show the full cookie menu with names, descriptions, prices, and photos.
- Show today's availability (in stock / only a few left / sold out).
- Make allergen and dietary information easy to find and filter.
- Keep the inventory in one data file that drives the whole site.
- Let the owner update stock quickly during the day from a phone.

### Scope for v1

v1 is **browse-only**. Customers can see what's available but can't place orders.

### Out of scope (for v1)

- Pickup orders and reservations (planned for v2)
- Online payments and checkout
- Customer accounts
- Delivery scheduling
- Contact form (the Contact page uses email and phone links instead)

## 3. Pages

### 3.1 Public pages

| Page | Path | Purpose |
|------|------|---------|
| Home | `/` | Shop intro, featured cookies, hours and location |
| Menu | `/menu` | Full cookie list and bundles, filterable by category and dietary need |
| Cookie detail | `/menu/:id` | Description, price, allergens, dietary info, stock status |
| About | `/about` | The shop's story |
| Contact | `/contact` | Address, phone (`tel:` link), email (`mailto:` link), hours, embedded map |

- **Out-of-season cookie pages** still load, with a note such as "Back in December." They are never a 404.
- **Inactive cookie pages** (`active: false`) return a 404.
- **Allergen notice:** every page footer and every cookie detail page shows: *"All cookies are made in a kitchen that handles wheat, peanuts, tree nuts, milk, egg, and soy."*

### 3.2 Admin page

| Page | Path | Purpose |
|------|------|---------|
| Admin | `/admin` | Update today's stock, prices, and which cookies are shown or featured |

- Protected by a single password (see §7.3).
- Designed for a phone first. Each cookie has large **−1**, **+1**, and **Sold out** buttons.
- Lets the owner edit price, turn a cookie on or off (`active`), and mark it `featured`.
- Has a **"Reset to daily defaults"** button that sets every cookie's stock back to its `defaultStock`.
- Shows all cookies, including inactive and out-of-season ones.

## 4. Cookie Inventory

Prices are shown in dollars here and stored in cents (see §5). "Default Stock" is the usual number baked each day.

The Tags column shows tags entered by hand. Egg-free and dairy-free are worked out from the allergens (see §5.3), so they are not listed here.

### 4.1 Classics

| ID | Name | Description | Price | Default Stock | Allergens | Tags |
|----|------|-------------|-------|---------------|-----------|------|
| `choc-chip` | Classic Chocolate Chip | Brown-butter dough with semi-sweet chocolate chunks and flaky sea salt | $3.00 | 48 | Wheat, Milk, Egg, Soy | Featured |
| `oatmeal-raisin` | Oatmeal Raisin | Chewy rolled-oat cookie with plump raisins and cinnamon | $2.75 | 36 | Wheat, Milk, Egg | — |
| `peanut-butter` | Peanut Butter | Soft peanut butter cookie with the classic fork crosshatch | $2.75 | 36 | Wheat, Milk, Egg, Peanut | — |
| `sugar` | Sugar Cookie | Buttery vanilla cookie rolled in sparkling sugar | $2.50 | 40 | Wheat, Milk, Egg | — |
| `snickerdoodle` | Snickerdoodle | Pillowy cookie coated in cinnamon sugar | $2.50 | 40 | Wheat, Milk, Egg | — |
| `double-choc` | Double Chocolate | Dark cocoa dough loaded with milk and dark chocolate chips | $3.25 | 36 | Wheat, Milk, Egg, Soy | — |
| `shortbread` | Butter Shortbread | Crisp, crumbly Scottish-style shortbread | $2.25 | 30 | Wheat, Milk | — |
| `ginger-molasses` | Ginger Molasses | Chewy spiced cookie with crackled sugar top | $2.75 | 30 | Wheat, Milk, Egg | — |

### 4.2 Specialty

| ID | Name | Description | Price | Default Stock | Allergens | Tags |
|----|------|-------------|-------|---------------|-----------|------|
| `white-choc-mac` | White Chocolate Macadamia | Buttery dough with white chocolate and toasted macadamia nuts | $3.50 | 30 | Wheat, Milk, Egg, Soy, Tree nuts | — |
| `smores` | S'mores | Graham cracker cookie with toasted marshmallow and milk chocolate. Contains gelatin. | $3.75 | 24 | Wheat, Milk, Egg, Soy | Not vegetarian |
| `salted-caramel` | Salted Caramel Pretzel | Brown sugar cookie with caramel bits and crushed pretzels | $3.75 | 24 | Wheat, Milk, Egg | Featured |
| `red-velvet` | Red Velvet Cream Cheese | Red velvet cookie with a cream cheese filling | $3.75 | 24 | Wheat, Milk, Egg | — |
| `lemon-crinkle` | Lemon Crinkle | Bright lemon cookie rolled in powdered sugar | $3.00 | 30 | Wheat, Milk, Egg | — |
| `cookies-cream` | Cookies & Cream | Vanilla dough packed with chocolate sandwich cookie pieces | $3.50 | 24 | Wheat, Milk, Egg, Soy | — |

### 4.3 Dietary-Friendly

| ID | Name | Description | Price | Default Stock | Allergens | Tags |
|----|------|-------------|-------|---------------|-----------|------|
| `gf-choc-chip` | Chocolate Chip (Made Without Gluten) | Almond-flour chocolate chip cookie | $3.50 | 20 | Milk, Egg, Soy, Tree nuts | Made without gluten |
| `vegan-oat` | Vegan Oatmeal Chocolate Chip | Oat cookie with dairy-free chocolate chips | $3.25 | 20 | Wheat, Soy | Vegan |
| `flourless-pb` | Flourless Peanut Butter | Three-ingredient peanut butter cookie | $3.00 | 20 | Peanut, Egg | Made without gluten |

### 4.4 Seasonal (rotating)

Together, the seasonal cookies cover the whole year, so one is always on the menu.

| ID | Name | Description | Season | Price | Default Stock | Allergens | Tags |
|----|------|-------------|--------|-------|---------------|-----------|------|
| `pumpkin-spice` | Pumpkin Spice | Soft pumpkin cookie with cinnamon-nutmeg glaze | Fall: Sep 1 – Nov 30 | $3.25 | 24 | Wheat, Milk, Egg | Featured |
| `gingerbread` | Gingerbread Man | Spiced molasses cut-out cookie with icing details | Winter: Dec 1 – Feb 28 | $3.00 | 24 | Wheat, Milk, Egg | — |
| `strawberry-shortcake` | Strawberry Shortcake | Vanilla cookie with freeze-dried strawberries and a sugar crust | Spring: Mar 1 – May 31 | $3.50 | 24 | Wheat, Milk, Egg | — |
| `key-lime` | Key Lime Pie | Graham-crumb cookie with tangy lime glaze | Summer: Jun 1 – Aug 31 | $3.25 | 24 | Wheat, Milk, Egg | — |

- Seasonal cookies appear on the menu only during their season.
- Season dates include both the start and end days.
- Gingerbread's season crosses the new year (Dec → Feb), and Feb 29 counts as in season in leap years.

### 4.5 Bundles

| ID | Name | Contents | Price | Per Cookie |
|----|------|----------|-------|------------|
| `half-dozen` | Half Dozen | Any 6 cookies on today's menu | $13.00 | $2.17 |
| `bakers-dozen` | Baker's Dozen | Any 13 cookies on today's menu (pay for 12, get 13) | $27.00 | $2.08 |

- Bundles can include any cookie currently on the menu, including seasonal and dietary-friendly ones.
- Bundles don't have their own stock. In v1 they are shown on the menu for price information only.
- **Pricing rule:** a bundle must never cost more than buying the same number of the cheapest cookie one at a time. Today the cheapest cookie is $2.25, so 6 = $13.50 and 13 = $29.25. Both bundle prices are below that.

**Total:** 21 cookies (8 classic, 6 specialty, 3 dietary-friendly, 4 seasonal) plus 2 bundles.

## 5. Data Model

All inventory is stored in `data/inventory.json`. Shop details (name, address, hours, and so on) are stored separately in `data/shop.json`.

### 5.1 Cookie record

```json
{
  "id": "choc-chip",
  "name": "Classic Chocolate Chip",
  "category": "classic",
  "description": "Brown-butter dough with semi-sweet chocolate chunks and flaky sea salt",
  "priceCents": 300,
  "stock": 48,
  "defaultStock": 48,
  "lowStockThreshold": null,
  "allergens": ["wheat", "milk", "egg", "soy"],
  "tags": [],
  "vegetarian": true,
  "season": null,
  "image": "/images/choc-chip.jpg",
  "featured": true,
  "active": true
}
```

| Field | Meaning |
|-------|---------|
| `category` | One of `classic`, `specialty`, `dietary`, `seasonal`. Used to group the menu. |
| `priceCents` | Price as a whole number of cents (`300` = $3.00). This avoids rounding errors. |
| `stock` | How many are left **today**. |
| `defaultStock` | Usual daily bake count. Used by "Reset to daily defaults." |
| `lowStockThreshold` | `null` uses the shop default of **6**. A number overrides it for this cookie. |
| `allergens` | Any of the 9 major US allergens: `milk`, `egg`, `fish`, `shellfish`, `tree-nuts`, `peanut`, `wheat`, `soy`, `sesame`. |
| `tags` | Tags entered by hand that can't be worked out from allergens: `vegan`, `made-without-gluten`. |
| `vegetarian` | Defaults to `true`. It is `false` for S'mores because of the gelatin. |
| `season` | `null`, or `{ "start": "MM-DD", "end": "MM-DD" }`. `end` may come before `start`, meaning the season wraps past Dec 31. |
| `featured` | Shown on the Home page when it's active and in season. |
| `active` | `false` hides the cookie everywhere except the admin page. |

### 5.2 Bundle record

```json
{
  "id": "bakers-dozen",
  "name": "Baker's Dozen",
  "description": "Any 13 cookies on today's menu (pay for 12, get 13)",
  "count": 13,
  "priceCents": 2700,
  "active": true
}
```

### 5.3 Dietary filters worked out from allergens

These are calculated automatically. They are never entered by hand, so they can't go out of sync with the allergen list.

| Filter | Rule | Cookies today |
|--------|------|---------------|
| Egg-free | No `egg` in allergens | Butter Shortbread, Vegan Oatmeal |
| Dairy-free | No `milk` in allergens | Vegan Oatmeal, Flourless Peanut Butter |
| Vegan | Tagged `vegan` | Vegan Oatmeal |
| Made without gluten | Tagged `made-without-gluten` | Chocolate Chip (Made Without Gluten), Flourless Peanut Butter |
| Vegetarian | `vegetarian` is `true` | All except S'mores |

**Wording rule:** the site never says "gluten-free." It says **"Made without gluten,"** because the kitchen also handles wheat.

### 5.4 Stock status

The threshold is the cookie's `lowStockThreshold`, or 6 if that is `null`.

| Condition | Label | Display |
|-----------|-------|---------|
| `stock == 0` | **Sold out** | Greyed out, left in its usual place |
| `stock <= threshold` | **Only a few left** | Highlighted |
| otherwise | **In stock** | Normal |

### 5.5 Shop settings (`data/shop.json`)

- Shop name, tagline, address, phone, email, opening hours, and About text. **Placeholders are used until the owner provides the real details.**
- Time zone (for example `America/New_York`). Season checks use the shop's local date, not the server's.
- Default low-stock threshold (6).

### 5.6 Saving changes

- Admin changes are written to `data/inventory.json`.
- Each save writes to a temporary file first and then replaces the real file, so a crash mid-save can't corrupt it.
- If ordering is added in v2, move the data to SQLite.

## 6. API

### 6.1 Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cookies` | Lists active, in-season cookies. Filters: `?category=`, `?diet=` (`egg-free`, `dairy-free`, `vegan`, `made-without-gluten`, `vegetarian`). Each result includes its stock status and worked-out dietary filters. |
| GET | `/api/cookies/:id` | One cookie. Out-of-season cookies are returned with `inSeason: false` and `returnsOn` (for example `"12-01"`). Inactive cookies return 404. |
| GET | `/api/bundles` | Lists active bundles. |

### 6.2 Admin (password required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cookies?all=true` | Lists every cookie, including inactive and out-of-season ones. |
| PATCH | `/api/cookies/:id` | Updates any of `stock`, `priceCents`, `active`, `featured`. |
| POST | `/api/cookies/reset-stock` | Sets every cookie's `stock` to its `defaultStock`. |

**Validation:**
- `stock` must be a whole number, 0 or more.
- `priceCents` must be a whole number greater than 0.
- Invalid input returns `400` with a message saying what's wrong.
- Unknown IDs return `404`.

## 7. Technical Approach

### 7.1 Stack

- **Express** server with **EJS** templates. Pages are built on the server, so they load fast and work without JavaScript.
- A small browser script handles menu filters and the admin buttons.
- Plain JavaScript (ES modules). No build step.

### 7.2 Suggested layout

```
server.js            # starts the app
src/
  app.js             # Express setup and routes
  inventory.js       # load/save inventory, stock status, seasons, dietary filters
  auth.js            # admin password check
views/               # EJS page templates
public/              # CSS, browser JS, images
data/
  inventory.json
  shop.json
test/                # automated tests
```

### 7.3 Admin login

- The admin password is set with the `ADMIN_PASSWORD` environment variable. It is never stored in the code or data files.
- Both `/admin` and the admin API require the password, using HTTP Basic Auth. The browser's built-in login prompt means no custom login page is needed.
- The site must be served over HTTPS in production so the password isn't sent in plain text.
- If `ADMIN_PASSWORD` isn't set, admin routes are turned off.

### 7.4 Hosting

- Use an always-on host whose disk keeps files between restarts (for example Render with a persistent disk, Railway, Fly.io with a volume, or a small VPS).
- Serverless platforms aren't suitable for v1 because they can't save changes to `inventory.json`.

### 7.5 Testing

Automated tests use Node's built-in test runner (`node --test`) and cover:
- Stock status labels, including the default and per-cookie thresholds
- Season checks, including Gingerbread's Dec → Feb season and Feb 29
- Worked-out dietary filters and the menu filters
- Public and admin API responses, including password checks and bad input
- Bundle pricing rule (no bundle costs more than the cheapest singles)

## 8. Design & Content

- **Look:** warm, bakery-style design with a placeholder shop name until branding is provided.
- **Photos:** illustrated placeholders until real cookie photos are ready.
- **Map:** embedded OpenStreetMap iframe on the Contact page. No API key needed.
- **Accessibility:** meet WCAG 2.1 AA. That means readable contrast, full keyboard navigation, alt text on all images, and allergen and stock status written as text, not shown by icon or color alone.
- **Currency and language:** US dollars, English only.
- **Phones:** every page, including admin, works well on a phone-sized screen.

## 9. Requirements

### Menu
- **R1:** The menu SHALL show only active, in-season cookies, grouped by category.
- **R2:** Each cookie SHALL show its price, stock status, allergens, and dietary filters.
- **R3:** Sold-out cookies SHALL stay in their usual place, greyed out and marked "Sold out." Customers SHALL be able to hide sold-out cookies with a toggle.
- **R4:** Customers SHALL be able to filter the menu by category and by egg-free, dairy-free, vegan, made without gluten, and vegetarian.
- **R5:** The menu SHALL list bundles with their price and what they include.

### Seasons
- **R6:** A seasonal cookie SHALL be in season when the shop's local date falls within its season, including the start and end days and seasons that cross the new year.
- **R7:** An out-of-season cookie's detail page SHALL still load and SHALL say when it returns.

### Home
- **R8:** The Home page SHALL show cookies marked featured that are active and in season. If there are none, it SHALL show in-season seasonal cookies instead.

### Admin
- **R9:** Only someone with the admin password SHALL be able to view the admin page or use the admin API.
- **R10:** The owner SHALL be able to change a cookie's stock, price, active, and featured settings. The change SHALL appear on the public site right away, with no code change or restart.
- **R11:** The owner SHALL be able to reset all stock to the daily defaults in one action.
- **R12:** Invalid admin input SHALL be rejected with a clear message and SHALL NOT change the data.

### Allergens
- **R13:** Egg-free and dairy-free filters SHALL be worked out from each cookie's allergens.
- **R14:** The site SHALL show the shared-kitchen allergen notice on every page, and SHALL NOT use the words "gluten-free."

### General
- **R15:** No bundle SHALL cost more than buying the same number of the cheapest cookie one at a time.
- **R16:** The site SHALL work on phones and SHALL meet WCAG 2.1 AA.

## 10. Still Needed From the Owner

These don't block building. Placeholders are used until they arrive.

1. Shop name, logo, brand colors, and tagline
2. Address, phone, email, and opening hours
3. About-page story
4. Cookie photos
5. Final check of prices and default stock levels
6. Confirmation that the allergen notice and "made without gluten" wording meet local food rules
7. Where the site will be hosted
