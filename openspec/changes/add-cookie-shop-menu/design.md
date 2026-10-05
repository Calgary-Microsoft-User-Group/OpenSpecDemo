# Design

## Context

See `proposal.md` - Why. This is a greenfield Node.js project (v24) with no existing code; `spec.md` (Draft v2) and `plan.md` in the repo root already work out most of the technical approach and a phase-by-phase build order. This design adopts that approach for the two capabilities in this change (`cookie-inventory`, `cookie-menu-site`) and calls out the decisions worth recording. It reuses `plan.md`'s Phases 1–6 and 8 as the implementation sequence; `tasks.md` in this change follows that sequence.

## Goals / Non-Goals

**Goals:**
- A single, well-tested module of pure functions (stock status, season math, dietary derivation, bundle pricing check) that both this change and the future admin change can rely on without duplicating rules.
- Public pages that render correctly with JavaScript disabled, since the only interactive behavior in this change (menu filters, hide-sold-out) is a plain GET-based form.
- Season and stock-status logic that is unit-testable without a server or clock mocking hacks — every date-dependent function takes `now`/`monthDay` as a parameter.

**Non-Goals:**
- Anything that writes to `data/inventory.json` — that's `add-inventory-admin`.
- Choosing final hosting, or wiring up a persistent disk — covered when the admin change (which actually needs writes) is designed, per `plan.md` §7.4.
- Pickup ordering, payments, accounts (out of scope for v1 per `spec.md` §2).

## Decisions

**Express + EJS, server-rendered pages.** Matches `spec.md` §7.1. Alternative considered: a client-side framework (React/Vue) — rejected because the content is simple, mostly static per request, and server rendering keeps the menu filters working without JavaScript (accessibility requirement, R16/`cookie-menu-site` phone/a11y requirement).

**Filters as a GET form, not client-side JS.** `/menu?category=classic&diet=vegan&hideSoldOut=1`. Alternative: `fetch`-based filtering against `/api/cookies` — rejected for this change because it would make the menu depend on JavaScript being enabled, conflicting with the "works without JavaScript" goal above. Client-side JS is reserved for progressive enhancement only (e.g., instant filtering without full navigation), never as the only path.

**Core logic isolated in one pure module (`src/inventory.js`).** No Express or filesystem code in it. Rationale: this module encodes nearly every requirement in the `cookie-inventory` spec delta (stock status, season math including the Dec→Feb wraparound and Feb 29 case, dietary derivation, bundle pricing check), and it will be reused unchanged by `add-inventory-admin`. Keeping it pure makes the wraparound/leap-day scenarios trivial to test without mocking `Date`.

**Prices in whole cents (`priceCents`), not decimal dollars.** Matches `spec.md` §5.1/Q6.1. Avoids floating-point rounding when computing the bundle-pricing ceiling (`count × cheapest priceCents`).

**Time zone is a configured value, evaluated per request, not baked into stored dates.** `data/shop.json` holds an IANA zone (e.g. `America/New_York`); `Intl.DateTimeFormat` derives `MM-DD` from `now` in that zone. Alternative considered: storing season dates as UTC — rejected because "today" for a shop's stock/season display must match the shop's wall-clock day, not UTC's, especially near midnight.

**Data loaded into memory at startup, read-only in this change.** `add-inventory-admin` will introduce the write/save path (safe temp-file-then-rename, one save at a time); this change only needs a loader, so it stays simple and has nothing to get wrong about concurrent writes yet.

**Seasonal coverage is a data-integrity property, not just a display rule.** The `cookie-inventory` spec requires the four seasonal ranges to cover the full year with no gap (`spec.md` §4.4). This is checked by a test against the real `data/inventory.json`, not just asserted in prose, so a future edit to the seasonal lineup that leaves a gap fails CI rather than shipping silently.

## Risks / Trade-offs

- **[Risk]** A future edit to `data/inventory.json` (e.g., adding a fifth seasonal cookie, or changing a season's dates) could reintroduce a calendar gap or overlap. → **Mitigation**: the seasonal-coverage test (see Decisions) runs against the live data file, not a fixture, so it catches this on every `npm test`.
- **[Risk]** Rendering pages without JavaScript means every filter change is a full page reload. → **Mitigation**: accepted for v1 given the goal of a JS-optional site (spec.md R16); reload cost is low for a menu-sized page. Can be layered with progressive-enhancement JS later without changing the URL contract.
- **[Risk]** Placeholder shop details and cookie photos (spec.md §10) ship to production if the owner hasn't supplied real ones yet. → **Mitigation**: out of this design's control; `plan.md` already tracks this as an owner follow-up, not a blocker to building.
- **[Trade-off]** Keeping the admin capability entirely out of this change means the site initially has no way to update stock except editing `data/inventory.json` by hand. → Accepted: this change is scoped to ship and review the read side first; `add-inventory-admin` follows immediately after and depends on nothing else changing here.
