# Spec Delta

## MODIFIED Requirements

### Requirement: Cookie record fields
Each cookie SHALL be stored as a record with: `id`, `name`, `category` (one of `classic`, `specialty`, `dietary`, `seasonal`), `description`, `priceCents` (whole number of cents), `stock` (whole number, today's count), `defaultStock` (whole number, usual daily bake count), `lowStockThreshold` (whole number or `null`), `allergens` (list drawn from the 9 major US allergens: milk, egg, fish, shellfish, tree-nuts, peanut, wheat, soy, sesame), `tags` (list, only `vegan` and/or `made-without-gluten`), `vegetarian` (boolean, defaults to `true`), `season` (`null` or a `{start, end}` MM-DD pair), `image`, `featured` (boolean), and `active` (boolean). Of these, `stock`, `priceCents`, `active`, and `featured` SHALL be mutable at runtime through the admin capability; `id`, `name`, `category`, `description`, `defaultStock`, `lowStockThreshold`, `allergens`, `tags`, `vegetarian`, `season`, and `image` remain fixed once the record is created.

#### Scenario: Inactive cookie is retained, not deleted
- **WHEN** a cookie's `active` field is set to `false`
- **THEN** the record and all its fields remain in the data, so it can be reactivated later without re-entering its details

#### Scenario: Mutable fields can change without touching fixed fields
- **WHEN** a cookie's `stock`, `priceCents`, `active`, or `featured` is updated
- **THEN** the update does not require or permit any change to the cookie's `id`, `name`, `category`, `description`, `defaultStock`, `lowStockThreshold`, `allergens`, `tags`, `vegetarian`, `season`, or `image`

## ADDED Requirements

### Requirement: Cookie writes are validated before being applied
A write to a cookie's `stock` SHALL be accepted only if it is a whole number greater than or equal to 0. A write to `priceCents` SHALL be accepted only if it is a whole number greater than 0. Writes to `active` and `featured` SHALL be accepted only if the value is a boolean. Any other write SHALL be rejected without changing the stored data, and the rejection SHALL state which field was invalid and why.

#### Scenario: Negative stock is rejected
- **WHEN** a write sets a cookie's `stock` to `-1`
- **THEN** the write is rejected and the cookie's stored `stock` is unchanged

#### Scenario: Fractional price is rejected
- **WHEN** a write sets a cookie's `priceCents` to `299.5`
- **THEN** the write is rejected and the cookie's stored `priceCents` is unchanged

#### Scenario: Zero price is rejected
- **WHEN** a write sets a cookie's `priceCents` to `0`
- **THEN** the write is rejected, because a cookie must have a positive price

#### Scenario: Unknown field is rejected
- **WHEN** a write includes a field other than `stock`, `priceCents`, `active`, or `featured`
- **THEN** the write is rejected and no field on the cookie changes

### Requirement: Accepted writes are visible immediately
Once a write to a cookie's `stock`, `priceCents`, `active`, or `featured` is accepted, every subsequent read of that cookie — by the public site, the public API, or the admin surface — SHALL reflect the new value, with no code change or process restart required.

#### Scenario: Public menu reflects an admin stock change
- **WHEN** a cookie's `stock` is updated to `0`
- **THEN** the next request to the public menu or `GET /api/cookies/:id` shows that cookie as sold out

### Requirement: Daily stock reset
The system SHALL support resetting every cookie's `stock` to its `defaultStock` in a single action.

#### Scenario: Reset restores every cookie's default
- **WHEN** the daily reset action runs
- **THEN** every cookie's `stock` equals its `defaultStock` afterward, regardless of what each was before
