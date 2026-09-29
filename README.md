# Cookie Shop Website

A small Node.js website for a cookie shop: browse today's menu, see live
stock status, and check allergen/dietary information. See `spec.md` for
the full specification and `openspec/changes/` for the specs this build
follows.

This is the **browse-only** build (`add-cookie-shop-menu`). There is no
admin page yet — that's a separate, follow-on change
(`add-inventory-admin`) that adds the ability to update stock, price, and
visibility from a phone.

## Requirements

- Node.js 24 or later

## Setup

```bash
npm install
npm run dev   # starts the server with auto-reload on file changes
```

Then open <http://localhost:3000>.

To run it without auto-reload: `npm start`.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Port the server listens on |

## Tests

```bash
npm test
```

Runs the full suite with Node's built-in test runner: core inventory
logic (stock status, season math, dietary derivation, bundle pricing),
the data loader, the public API, and the public pages.

## Accessibility

The site targets WCAG 2.1 AA. Every stock-status and allergen/dietary
indicator is conveyed in text (not by color or icon alone), every image
has descriptive `alt` text, every form control has a visible `<label>`,
and every interactive element is a native, keyboard-operable HTML
element (link, button, `<select>`, or checkbox) rather than a custom
widget.

**Color contrast**: the palette in `public/css/site.css` was checked
against the WCAG 2.1 relative-luminance contrast formula (a small Node
script computing each foreground/background pair's ratio). All text and
UI-label pairs meet or exceed the 4.5:1 minimum for normal text:

| Pair | Ratio |
|------|-------|
| Body text on page background | 13.74:1 |
| Muted text on page background | 7.51:1 |
| Body text on card background | 12.71:1 |
| Button text on brand background | 5.34:1 |
| Link/brand color on page background | 5.07:1 |
| Link/brand color on card background | 4.69:1 |
| "Sold out" badge text on its background | 6.93:1 |
| "Only a few left" badge text on its background | 6.47:1 |
| "In stock" badge text on its background | 6.59:1 |
| Footer text on footer background | 13.74:1 |

**Phone-width layout**: the CSS is written mobile-first with fluid units
throughout (no fixed-pixel widths that could force horizontal scrolling):
the card grids use `minmax(min(100%, 14rem), 1fr)`, images and the main
content area use `max-width: 100%`/`width: 100%`, and the header, nav,
and filter form all wrap with `flex-wrap`. This was checked by reviewing
every `width` rule in `public/css/site.css` to confirm each one is either
`max-width` or a fluid `100%` value. A real-browser render check at a
375px viewport (e.g. with Playwright) was attempted in development but
could not complete in that sandboxed environment (missing system
libraries for headless Chromium); re-running that check in a normal
development machine or CI environment is recommended before launch.
