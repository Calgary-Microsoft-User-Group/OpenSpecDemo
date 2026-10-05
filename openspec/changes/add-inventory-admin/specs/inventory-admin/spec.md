# Spec Delta

## Purpose

Lets the shop owner update today's stock, prices, and which cookies are shown or featured from a password-protected page usable on a phone, with the writes protected against forgery and saved without corruption or loss.

## ADDED Requirements

### Requirement: Admin routes require a password
Both the admin page and every admin API endpoint SHALL require the password configured in the `ADMIN_PASSWORD` environment variable, checked via HTTP Basic Auth. A missing or incorrect password SHALL result in a 401 response. When `ADMIN_PASSWORD` is not set, every admin route SHALL respond as if it does not exist (404), rather than allowing unauthenticated access.

#### Scenario: Correct password grants access
- **WHEN** a request to `/admin` or an admin API endpoint includes the configured password via HTTP Basic Auth
- **THEN** the request is processed normally

#### Scenario: Missing or wrong password is rejected
- **WHEN** a request to `/admin` or an admin API endpoint omits the password or supplies the wrong one
- **THEN** the response is 401 and no data is read or changed

#### Scenario: Admin disabled when no password is configured
- **WHEN** the `ADMIN_PASSWORD` environment variable is not set
- **THEN** requests to `/admin` and every admin API endpoint receive 404

### Requirement: Admin writes are protected against cross-site forgery
An admin write request (any request that changes stored data) SHALL be accepted only if its `Content-Type` is `application/json`, and, when the request includes an `Origin` header, only if that header matches the site's own origin.

#### Scenario: Form-encoded write is rejected
- **WHEN** an admin write request has `Content-Type: application/x-www-form-urlencoded` or `multipart/form-data`
- **THEN** the request is rejected, because a plain HTML form on another site cannot send a JSON request body

#### Scenario: Mismatched Origin is rejected
- **WHEN** an admin write request includes an `Origin` header that does not match the site's own origin
- **THEN** the request is rejected, even if the password is correct

### Requirement: Admin can view every cookie, including hidden ones
The admin surface SHALL be able to list every cookie regardless of `active` or seasonal status, distinguishing inactive and out-of-season cookies from those currently visible to customers.

#### Scenario: Admin sees an out-of-season cookie
- **WHEN** the owner requests the full admin cookie list
- **THEN** cookies that are currently out of season are included and labeled as out of season, not hidden as they are on the public menu

### Requirement: Admin can update a cookie's stock, price, active, and featured settings
The admin API SHALL expose an endpoint to update one cookie's `stock`, `priceCents`, `active`, and/or `featured` fields, applying the validation rules defined by `cookie-inventory`. A successful update SHALL persist to storage before the response is returned. An update addressed to an unknown cookie id SHALL respond with 404.

#### Scenario: Valid update is accepted and saved
- **WHEN** the owner updates a cookie's `stock` from 10 to 3
- **THEN** the response confirms success and the new value is readable on a subsequent request, including after a process restart

#### Scenario: Invalid update is rejected with a clear reason
- **WHEN** the owner submits an update with a negative `stock`
- **THEN** the response is 400, names the invalid field, and the cookie's stored data is unchanged

#### Scenario: Unknown cookie id
- **WHEN** an update targets a cookie id that does not exist
- **THEN** the response is 404 and no data changes

### Requirement: Admin can reset all stock to daily defaults in one action
The admin API and admin page SHALL provide a single action that resets every cookie's `stock` to its `defaultStock`, per the `cookie-inventory` daily-reset requirement, and the admin page SHALL ask for confirmation before performing it.

#### Scenario: Reset requires confirmation on the admin page
- **WHEN** the owner selects "Reset to daily defaults" on the admin page
- **THEN** the page asks for confirmation before the reset is applied

### Requirement: Writes are saved without corruption or loss
Every accepted admin write SHALL be saved to disk using a write-to-temporary-file-then-rename sequence, so a failure partway through a save cannot leave the data file corrupted. Concurrent admin writes SHALL be applied one at a time, so two changes submitted close together cannot overwrite each other's result.

#### Scenario: Two quick updates both take effect
- **WHEN** two admin updates to different cookies are submitted in quick succession
- **THEN** both updates are present in the saved data afterward; neither is silently lost

#### Scenario: A failed save does not corrupt existing data
- **WHEN** a save operation fails partway through (e.g., a write error)
- **THEN** the previously saved `data/inventory.json` remains intact and readable, and the in-memory data is not left in a state inconsistent with what was last successfully saved

### Requirement: Admin page is usable on a phone
The admin page SHALL be operable on a phone-sized screen: each cookie's stock controls (decrease, increase, mark sold out) SHALL be large enough to tap reliably, and every control SHALL have a text label usable with a screen reader.

#### Scenario: Stock controls are labeled and tappable
- **WHEN** the admin page is viewed at a phone width
- **THEN** each cookie's stock controls are reachable without horizontal scrolling, are large enough to tap, and each has a descriptive accessible label (e.g., "Decrease stock for Snickerdoodle")

### Requirement: Admin page surfaces bundle pricing violations
When a bundle's price violates the `cookie-inventory` bundle-pricing rule (priced above the count times the cheapest active cookie), the admin page SHALL display a visible warning naming the affected bundle.

#### Scenario: Warning shown for an over-priced bundle
- **WHEN** an admin price change makes a bundle's price exceed its pricing ceiling
- **THEN** the admin page shows a warning identifying that bundle the next time it is loaded
