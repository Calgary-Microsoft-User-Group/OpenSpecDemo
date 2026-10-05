# Cookie Shop Website — Questions & Recommendations

**Reviews:** `spec.md` (Draft, 2026-09-28)
**Status:** Resolved on 2026-09-28. All recommendations were accepted and applied to `spec.md` (Draft v2). Changes from this document: Q3.1 used new bundle prices of $13.00 / $27.00 (see spec §4.5), Q4.2 added Key Lime Pie for summer and extended Gingerbread through February, and Q7.5 (OpenSpec) is still open.
**Purpose:** List the parts of the spec that are unclear, inconsistent, or missing, with a recommended answer for each. Where a recommendation is marked **(default)**, I'll use it unless you say otherwise.

---

## Top 5 Decisions Needed Before Building

These have the biggest effect on how the site is built. Everything else can use the defaults below.

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Browse-only, or can customers place pickup orders? | **Browse-only for v1.** Add ordering as a second phase. |
| 2 | How does stock get updated if nobody orders online? | **Owner sets a daily "baked today" count** from a simple admin page. |
| 3 | Admin page, or edit a JSON file? | **Small password-protected admin page.** |
| 4 | Where is the data stored? | **A JSON file for v1.** Move to SQLite if ordering is added. |
| 5 | Shop name, address, hours, logo, photos? | Needed from you. I'll use placeholders until then. |

---

## 1. Scope & Purpose

### Q1.1 — Is the site browse-only, or does it take orders?
The spec leaves out payments and checkout but doesn't say whether customers can **reserve cookies for pickup** (no payment). That choice decides whether we need orders, a cart, and stock that goes down automatically.

**Recommendation:** Browse-only for v1. It's much smaller to build, and the bundles and stock display still make sense. Plan pickup orders as v2.

### Q1.2 — Is there a contact form?
The Contact page lists "Address, phone, hours, map" but doesn't say whether customers can send a message (for example, for catering or large orders).

**Recommendation (default):** No form in v1. Show a `mailto:` link and phone number instead. A form needs email delivery and spam protection.

---

## 2. Inventory & Stock

### Q2.1 — What does "stock" mean?
Is `stock` the **total cookies on hand**, or **today's batch**? Cookies are baked fresh, so a total that carries over for days doesn't make much sense.

**Recommendation:** Treat stock as **today's count**. The owner enters how many were baked each morning and lowers the count (or marks sold out) as they sell.

### Q2.2 — Who updates stock, and how?
Goal 2 promises "live availability," but with no online orders nothing lowers the count automatically. If the owner doesn't update it, the site will be wrong.

**Recommendation:** An admin page with a big **−1 / +1 / Sold out** control for each cookie, usable on a phone behind the counter.

### Q2.3 — Should the "Starting Stock" numbers reset every day?
**Recommendation:** Optional "reset to daily default" button on the admin page, using the starting stock values in §4 as each cookie's default.

### Q2.4 — Should the low-stock threshold be the same for every cookie?
The data model example shows `lowStockThreshold: 6`, but the inventory tables don't list a threshold per cookie.

**Recommendation (default):** Use 6 for every cookie, and allow per-cookie overrides in the data.

---

## 3. Bundles

### Q3.1 — Bundles cost more than buying some cookies one at a time
- Half Dozen = $15.00 ($2.50 per cookie). Six Butter Shortbreads bought singly cost **$13.50**, so the bundle is a worse deal.
- Baker's Dozen = $30.00 ($2.31 per cookie) is fine for most cookies.

**Recommendation:** Pick one:
- **(a)** Lower the Half Dozen to **$13.50**.
- **(b)** Keep the prices but say "any 6 classic cookies," with specialty cookies costing extra.
- **(c)** Price bundles as a percentage off (for example, 10% off the cookies you pick).

### Q3.2 — Name and ID don't match
The bundle ID is `dozen`, but the name is "Baker's Dozen" and it contains 13 cookies.

**Recommendation (default):** Rename the ID to `bakers-dozen`.

### Q3.3 — Can bundles include seasonal and dietary-friendly cookies?
"Any 6 cookies" is unclear on this.

**Recommendation:** Yes. Any cookie currently on the menu is allowed.

### Q3.4 — Bundles aren't in the data model or API
§5 only describes single cookies, and §6 has no bundle endpoint.

**Recommendation (default):** Add a separate `bundles` list to the data file and a `GET /api/bundles` endpoint. Bundles have no stock of their own.

---

## 4. Seasonal Cookies

### Q4.1 — Gingerbread's season crosses the new year
Winter (Dec–Jan) is stored as `{ "start": "12-01", "end": "01-31" }`, where the end comes *before* the start. The in-season check has to handle this.

**Recommendation (default):** Support ranges that wrap around the year end, and test this case.

### Q4.2 — Some months have no seasonal cookie
Nothing is listed for **February** or **June–August**.

**Recommendation:** Add a summer cookie (for example, Key Lime or Blueberry Lemon) and extend Gingerbread to Feb, or accept the gap.

### Q4.3 — What happens when someone opens an out-of-season cookie's page?
For example, a bookmarked `/menu/gingerbread` in July.

**Recommendation (default):** Show the page with a note: "Back in December." Don't show a 404.

### Q4.4 — Which time zone decides the season?
**Recommendation (default):** The shop's local time zone, set in one config value.

### Q4.5 — Seasonal cookies have no Dietary column
§4.4 leaves out the Dietary column the other tables have.

**Recommendation (default):** Add it (all "—" for now) so every cookie has the same fields.

---

## 5. Allergens & Dietary Information

### Q5.1 — Sesame is missing from the allergen list
The US lists **9** major allergens: milk, egg, fish, shellfish, tree nuts, peanuts, wheat, soy, **sesame**.

**Recommendation (default):** Use the full list of 9 so any cookie can be tagged correctly.

### Q5.2 — Dietary tags are applied inconsistently
- Only Butter Shortbread is tagged "Egg-free," but Vegan Oatmeal is also egg-free and dairy-free.
- Filtering for "egg-free" would therefore miss the vegan cookie.

**Recommendation (default):** **Work out** egg-free and dairy-free **from the allergen list** rather than tagging them by hand. Keep hand-entered tags only for things that can't be worked out (vegan, gluten-free).

### Q5.3 — Gluten-free claims in a shared kitchen
If the gluten-free cookies are made in the same kitchen as wheat products, calling them "gluten-free" may not be accurate or legally safe.

**Recommendation:** Label them **"Made without gluten"** and add a site-wide note: *"All cookies are made in a kitchen that handles wheat, peanuts, tree nuts, milk, egg, and soy."* Please confirm with your local food rules.

### Q5.4 — Is the "dietary" category the same as dietary tags?
Gluten-Free Chocolate Chip is in the `dietary` **category**, but Butter Shortbread (egg-free) is in `classic`. Customers filtering by need might not realize these are different.

**Recommendation (default):** Keep the category for menu layout, but have dietary **filters** use tags only, so Shortbread shows up under "egg-free."

### Q5.5 — Should S'mores be flagged as not vegetarian?
Marshmallows usually contain gelatin.

**Recommendation:** Add a `vegetarian` tag, or note "contains gelatin" in the description.

---

## 6. Data Model & API

### Q6.1 — Prices are stored as decimals
`"price": 3.00` can cause rounding errors when prices are added up (for example, bundle math).

**Recommendation (default):** Store prices as **whole cents** (`300`) and format them as `$3.00` for display.

### Q6.2 — How are "featured cookies" on the Home page chosen?
There's no field for this.

**Recommendation (default):** Add a `featured: true/false` field. If nothing is marked, show in-season cookies first.

### Q6.3 — How is the admin endpoint protected?
`PATCH /api/cookies/:id/stock` says "admin only" but there's no login described.

**Recommendation (default):** A single admin password set in an environment variable, checked on every admin request. No user accounts.

### Q6.4 — Can the admin change price and `active`, or only stock?
R5 says changing **stock or price** should update the site, but the API only has a stock endpoint.

**Recommendation (default):** Replace it with `PATCH /api/cookies/:id`, which can update `stock`, `price`, `active`, and `featured`.

### Q6.5 — Should the API hide out-of-season cookies?
R1 says the *menu* shows only active, in-season cookies, but it's unclear whether `GET /api/cookies` also filters them.

**Recommendation (default):** The public API hides them by default. The admin can add `?all=true` to see everything.

### Q6.6 — Should sold-out cookies appear first or last?
**Recommendation (default):** Keep them in their normal spot, greyed out, with an optional "Hide sold out" toggle.

---

## 7. Technical Approach

### Q7.1 — Which framework?
The spec only says "Node.js."

**Recommendation:** **Express** with **EJS** templates. Pages are built on the server, so they load fast and work without heavy JavaScript. A small script handles menu filters.

### Q7.2 — JavaScript or TypeScript?
**Recommendation (default):** Plain JavaScript (ES modules) to keep things simple.

### Q7.3 — Where will the site be hosted?
Hosting affects storage: some hosts (for example, serverless platforms) can't save changes to a JSON file.

**Recommendation:** A small always-on host (Render, Railway, Fly.io, or a VPS) that keeps files between restarts. Please confirm, or tell me where you plan to host.

### Q7.4 — What testing do you expect?
**Recommendation (default):** Automated tests with Node's built-in test runner covering stock status, season checks (including Dec–Jan), filters, and the API.

### Q7.5 — Should this go through OpenSpec?
The project already has OpenSpec set up.

**Recommendation:** Turn `spec.md` into an OpenSpec change (`/opsx:propose`) so requirements, design, and tasks are tracked there.

---

## 8. Content & Design

### Q8.1 — Branding
Needed from you: shop name, logo, brand colors, and a tagline.
**Default:** A warm, bakery-style design with a placeholder name.

### Q8.2 — Photos
Every cookie has an `image` field, but there are no photos yet.
**Default:** Illustrated placeholders until real photos are ready.

### Q8.3 — Business details
Needed from you: address, phone, email, opening hours, and your About-page story.

### Q8.4 — Map on the Contact page
**Recommendation (default):** An embedded OpenStreetMap or Google Maps iframe. Neither needs an API key for a basic map.

### Q8.5 — Accessibility
**Recommendation (default):** Aim for WCAG 2.1 AA: readable contrast, keyboard navigation, alt text on photos, and allergen info written as text rather than icons alone.

### Q8.6 — Currency and language
**Default:** US dollars, English only.

---

## 9. Suggested Spec Changes (Summary)

If you accept the defaults above, `spec.md` would change as follows:

1. Add a line saying v1 is browse-only.
2. Define `stock` as today's count, with a daily default.
3. Add fields `featured`, `defaultStock`, and prices in cents; add a `bundles` list.
4. Work out egg-free and dairy-free from allergens; add sesame to the allergen list.
5. Replace the stock-only endpoint with `PATCH /api/cookies/:id`; add `GET /api/bundles`; describe the admin password.
6. Fix bundle pricing and rename `dozen` to `bakers-dozen`.
7. Handle seasons that cross the year end; add the Dietary column to seasonal cookies.
8. Add an allergen disclaimer and a "made without gluten" wording rule.
9. Add requirements for the admin page and for out-of-season cookie pages.
