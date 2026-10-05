# Spec Delta

## Purpose

Defines the cookie and bundle data that drives the shop's site: what fields each record holds, and the rules for stock status, seasonal availability, dietary filters, and bundle pricing that every reader of that data must follow consistently.

## ADDED Requirements

### Requirement: Cookie record fields
Each cookie SHALL be stored as a record with: `id`, `name`, `category` (one of `classic`, `specialty`, `dietary`, `seasonal`), `description`, `priceCents` (whole number of cents), `stock` (whole number, today's count), `defaultStock` (whole number, usual daily bake count), `lowStockThreshold` (whole number or `null`), `allergens` (list drawn from the 9 major US allergens: milk, egg, fish, shellfish, tree-nuts, peanut, wheat, soy, sesame), `tags` (list, only `vegan` and/or `made-without-gluten`), `vegetarian` (boolean, defaults to `true`), `season` (`null` or a `{start, end}` MM-DD pair), `image`, `featured` (boolean), and `active` (boolean).

#### Scenario: Inactive cookie is retained, not deleted
- **WHEN** a cookie's `active` field is set to `false`
- **THEN** the record and all its fields remain in the data, so it can be reactivated later without re-entering its details

### Requirement: Bundle record fields
Each bundle SHALL be stored as a record with: `id`, `name`, `description`, `count` (whole number of cookies included), `priceCents` (whole number of cents), and `active` (boolean). A bundle SHALL NOT have its own `stock` field.

#### Scenario: Bundle has no independent stock
- **WHEN** a bundle record is read
- **THEN** it contains no `stock` or `defaultStock` field, because its availability depends only on whether cookies are currently on the menu

### Requirement: Stock status derivation
The system SHALL derive a cookie's stock status from `stock` and its effective low-stock threshold (the cookie's `lowStockThreshold`, or the shop-wide default of 6 when `lowStockThreshold` is `null`): `stock == 0` is **sold-out**; `stock` greater than 0 and less than or equal to the threshold is **low** ("only a few left"); otherwise **in-stock**.

#### Scenario: Zero stock is sold out regardless of threshold
- **WHEN** a cookie's `stock` is `0`
- **THEN** its status is **sold-out**, even if its `lowStockThreshold` is also `0`

#### Scenario: Stock at the threshold is low, not sold out
- **WHEN** a cookie's `stock` equals its effective threshold and is greater than `0`
- **THEN** its status is **low**

#### Scenario: Per-cookie threshold overrides the shop default
- **WHEN** a cookie's `lowStockThreshold` is a number (not `null`)
- **THEN** that number, not the shop-wide default of 6, is used to derive its status

### Requirement: Seasonal availability derivation
A cookie with `season: null` SHALL always be considered in season. A cookie with a `season` of `{start, end}` (each an `MM-DD` value) SHALL be in season when today's date, evaluated in the shop's configured time zone, falls on or between `start` and `end` inclusive; when `start` is later in the year than `end`, the season SHALL be treated as wrapping past December 31, so a day is in season when it is on or after `start` OR on or before `end`. February 29 SHALL be treated as within any season whose range would include February 28.

#### Scenario: Ordinary season includes both boundary days
- **WHEN** today is the first day of a cookie's season (`start`) or the last day (`end`), and `start` is earlier in the year than `end`
- **THEN** the cookie is in season

#### Scenario: Season wraps past the new year
- **WHEN** a cookie's season is `{start: "12-01", end: "02-28"}` and today is December 15, January 15, or February 15
- **THEN** the cookie is in season on all three dates

#### Scenario: Wrapping season excludes the gap month
- **WHEN** a cookie's season is `{start: "12-01", end: "02-28"}` and today is any date from March 1 through November 30
- **THEN** the cookie is not in season

#### Scenario: Leap day falls within a season ending February 28
- **WHEN** a cookie's season ends `"02-28"` and today is February 29 in a leap year
- **THEN** the cookie is in season

#### Scenario: Seasonal coverage has no gap
- **WHEN** the four seasonal cookies' date ranges are checked together across a full calendar year
- **THEN** every calendar day is covered by at least one seasonal cookie's range, so a customer always finds one seasonal cookie in season

### Requirement: Dietary filters derived from allergens and tags
The system SHALL derive, rather than store directly, the following filters for each cookie: **egg-free** when `egg` is not in `allergens`; **dairy-free** when `milk` is not in `allergens`; **vegan** when `tags` includes `vegan`; **made-without-gluten** when `tags` includes `made-without-gluten`; **vegetarian** when the `vegetarian` field is `true`.

#### Scenario: Egg-free is derived, not tagged
- **WHEN** a cookie's `allergens` list does not include `egg`
- **THEN** the cookie is included in the egg-free filter results, even if no one has separately marked it egg-free

#### Scenario: Non-vegetarian cookie is excluded from the vegetarian filter
- **WHEN** a cookie's `vegetarian` field is `false`
- **THEN** the cookie is excluded from the vegetarian filter results

### Requirement: Gluten wording restricted to "made without gluten"
The system SHALL NOT use the phrase "gluten-free" anywhere cookie data is labeled or displayed. Cookies made without gluten SHALL be tagged `made-without-gluten` and labeled "Made without gluten."

#### Scenario: Made-without-gluten cookie is never labeled gluten-free
- **WHEN** a cookie tagged `made-without-gluten` is rendered anywhere in the system
- **THEN** the text "gluten-free" does not appear for that cookie; "made without gluten" is used instead

### Requirement: Bundle price never exceeds buying singles
No active bundle's `priceCents` SHALL exceed its `count` multiplied by the lowest `priceCents` among currently active cookies.

#### Scenario: Bundle priced within the singles ceiling
- **WHEN** a bundle's `count` is 6, its `priceCents` is 1300, and the cheapest active cookie costs 225 cents
- **THEN** the bundle satisfies the pricing rule, because 1300 is less than 6 × 225 (1350)

#### Scenario: Bundle priced above the singles ceiling is flagged
- **WHEN** a bundle's `priceCents` exceeds its `count` multiplied by the cheapest active cookie's `priceCents`
- **THEN** the system flags the bundle as violating the pricing rule so it can be corrected before publishing
