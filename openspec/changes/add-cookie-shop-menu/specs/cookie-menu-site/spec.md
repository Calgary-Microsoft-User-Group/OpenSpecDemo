# Spec Delta

## Purpose

Provides the public-facing pages and read-only API that let customers browse the cookie menu, see today's availability and allergen/dietary information, and find the shop's basic info, all driven by the `cookie-inventory` data.

## ADDED Requirements

### Requirement: Menu shows only active, in-season cookies
The Menu page and the public cookies API SHALL list only cookies that are `active` and currently in season, grouped by `category`.

#### Scenario: Inactive cookie is absent from the menu
- **WHEN** a cookie's `active` field is `false`
- **THEN** it does not appear on the Menu page or in `GET /api/cookies`

#### Scenario: Out-of-season seasonal cookie is absent from the menu
- **WHEN** a seasonal cookie's current date falls outside its season
- **THEN** it does not appear on the Menu page or in `GET /api/cookies`

### Requirement: Cookie listing shows price, status, allergens, and diet filters
Every cookie shown on the Menu page or returned by the public API SHALL include its formatted price, its derived stock status, its allergen list, and its derived dietary filters.

#### Scenario: Menu card includes all required details
- **WHEN** a cookie is displayed on the Menu page
- **THEN** its price, stock status label, allergen list, and dietary filter labels are all visible on the card

### Requirement: Sold-out cookies remain visible with a hide toggle
Sold-out cookies SHALL remain in their normal category position on the Menu page, visually marked as sold out, and customers SHALL be able to hide sold-out cookies with a toggle control.

#### Scenario: Sold-out cookie shown by default
- **WHEN** a cookie's stock status is sold-out and the hide-sold-out toggle is off
- **THEN** the cookie appears on the menu, marked "Sold out"

#### Scenario: Sold-out cookie hidden when toggled
- **WHEN** the customer turns on "Hide sold out"
- **THEN** sold-out cookies no longer appear on the Menu page

### Requirement: Menu can be filtered by category and dietary need
The Menu page and `GET /api/cookies` SHALL support filtering by `category` and by dietary filter (`egg-free`, `dairy-free`, `vegan`, `made-without-gluten`, `vegetarian`). An unrecognized category or dietary filter value SHALL be rejected.

#### Scenario: Filtering by a dietary need
- **WHEN** a customer selects the "vegan" filter
- **THEN** only cookies whose derived dietary filters include vegan are shown

#### Scenario: Unknown filter value rejected
- **WHEN** `GET /api/cookies` is called with a `diet` value that is not one of the five recognized filters
- **THEN** the API responds with `400` and a message naming the invalid value

### Requirement: Bundles listed on the menu
The Menu page and `GET /api/bundles` SHALL list every active bundle with its name, price, and cookie count.

#### Scenario: Bundle appears with price and count
- **WHEN** the Menu page is loaded
- **THEN** each active bundle is shown with its price and how many cookies it includes

### Requirement: Out-of-season cookie detail page still loads
A cookie detail page for a cookie that is `active` but currently out of season SHALL still return successfully and SHALL state when the cookie returns. An inactive cookie's detail page, and `GET /api/cookies/:id` for an inactive or unknown id, SHALL return a 404.

#### Scenario: Out-of-season page shows a return date
- **WHEN** a customer opens the detail page for an active, out-of-season seasonal cookie
- **THEN** the page loads (not a 404) and displays the date its season next begins

#### Scenario: Inactive cookie detail page is not found
- **WHEN** a customer opens the detail page or API endpoint for a cookie whose `active` field is `false`
- **THEN** the response is a 404

### Requirement: Home page shows featured cookies with a seasonal fallback
The Home page SHALL show cookies marked `featured` that are `active` and in season. When no such cookie exists, the Home page SHALL show in-season seasonal cookies instead.

#### Scenario: Featured cookies shown when available
- **WHEN** at least one active, in-season cookie is marked `featured`
- **THEN** the Home page shows those cookies

#### Scenario: Falls back to seasonal cookies
- **WHEN** no active, in-season cookie is marked `featured`
- **THEN** the Home page shows the in-season seasonal cookie(s) instead

### Requirement: Allergen notice shown on every page
Every page, and every cookie detail page specifically, SHALL display the shared-kitchen allergen notice: "All cookies are made in a kitchen that handles wheat, peanuts, tree nuts, milk, egg, and soy."

#### Scenario: Notice present on every public page
- **WHEN** any public page (Home, Menu, cookie detail, About, Contact) is loaded
- **THEN** the shared-kitchen allergen notice is present on the page

### Requirement: Public read-only cookies and bundles API
The system SHALL expose `GET /api/cookies` (listing active, in-season cookies, filterable by `category` and `diet`), `GET /api/cookies/:id` (a single cookie, including `inSeason` and, when out of season, `returnsOn`), and `GET /api/bundles` (listing active bundles). None of these endpoints SHALL accept or process any request that modifies data.

#### Scenario: Cookie detail includes season status
- **WHEN** `GET /api/cookies/:id` is called for an active but currently out-of-season cookie
- **THEN** the response includes `inSeason: false` and a `returnsOn` date

#### Scenario: Read-only endpoints reject writes
- **WHEN** a `POST`, `PATCH`, `PUT`, or `DELETE` request is sent to `/api/cookies`, `/api/cookies/:id`, or `/api/bundles`
- **THEN** the request is rejected, because this change introduces no data-writing endpoint

### Requirement: Site usable on phones and meets accessibility baseline
Every page added by this change SHALL render without horizontal scrolling at a 375px viewport width and SHALL meet WCAG 2.1 AA, including readable color contrast, full keyboard navigation, alt text on images, and stock/allergen information conveyed in text rather than by color or icon alone.

#### Scenario: Menu page usable at phone width
- **WHEN** the Menu page is viewed at 375px width
- **THEN** all content is reachable without horizontal scrolling and every control is operable by keyboard
