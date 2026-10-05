import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { startApp, makeCookie } from "./helpers.js";

const ALLERGEN_NOTICE =
  "All cookies are made in a kitchen that handles wheat, peanuts, tree nuts, milk, egg, and soy.";

describe("public pages", () => {
  let app;

  before(async () => {
    app = await startApp();
  });

  after(async () => {
    await app.close();
  });

  describe("layout", () => {
    const paths = ["/", "/menu", "/menu/in-season-featured", "/about", "/contact"];

    for (const p of paths) {
      test(`${p} includes the shared-kitchen allergen notice`, async () => {
        const res = await fetch(`${app.baseUrl}${p}`);
        const html = await res.text();
        assert.ok(html.includes(ALLERGEN_NOTICE), `notice missing on ${p}`);
      });

      test(`${p} never mentions "gluten-free"`, async () => {
        const res = await fetch(`${app.baseUrl}${p}`);
        const html = await res.text();
        assert.ok(!html.toLowerCase().includes("gluten-free"));
      });
    }
  });

  describe("Home page", () => {
    test("returns 200 and lists featured cookies when any exist", async () => {
      const res = await fetch(`${app.baseUrl}/`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes("Featured Classic"));
    });

    test("falls back to in-season seasonal cookies when none are featured", async () => {
      const fallbackApp = await startApp({
        cookies: [
          makeCookie({ id: "plain", name: "Plain Cookie", featured: false }),
          makeCookie({
            id: "fall-cookie",
            name: "Fall Fallback Cookie",
            category: "seasonal",
            season: { start: "09-01", end: "11-30" },
            featured: false,
          }),
        ],
      });
      try {
        const res = await fetch(`${fallbackApp.baseUrl}/`);
        const html = await res.text();
        assert.ok(html.includes("Fall Fallback Cookie"));
        assert.ok(!html.includes(">Plain Cookie<"));
      } finally {
        await fallbackApp.close();
      }
    });
  });

  describe("Menu page", () => {
    test("default listing shows active, in-season cookies grouped by category", async () => {
      const res = await fetch(`${app.baseUrl}/menu`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes("Featured Classic"));
      assert.ok(html.includes("Vegan Treat"));
      assert.ok(!html.includes("Hidden Cookie"));
      assert.ok(!html.includes("Winter Cookie")); // out of season
    });

    test("filters by category", async () => {
      const res = await fetch(`${app.baseUrl}/menu?category=dietary`);
      const html = await res.text();
      assert.ok(html.includes("Vegan Treat"));
      assert.ok(!html.includes("Featured Classic"));
    });

    test("filters by diet", async () => {
      const res = await fetch(`${app.baseUrl}/menu?diet=vegan`);
      const html = await res.text();
      assert.ok(html.includes("Vegan Treat"));
      assert.ok(!html.includes("Featured Classic"));
    });

    test("sold-out cookies are shown by default and hidden with the toggle", async () => {
      const shown = await fetch(`${app.baseUrl}/menu`);
      const shownHtml = await shown.text();
      assert.ok(shownHtml.includes("Sold Out Classic"));
      assert.ok(shownHtml.includes("Sold out"));

      const hidden = await fetch(`${app.baseUrl}/menu?hideSoldOut=1`);
      const hiddenHtml = await hidden.text();
      assert.ok(!hiddenHtml.includes("Sold Out Classic"));
    });

    test("lists active bundles with price and count", async () => {
      const res = await fetch(`${app.baseUrl}/menu`);
      const html = await res.text();
      assert.ok(html.includes("Half Dozen"));
      assert.ok(html.includes("$12.00"));
      assert.ok(!html.includes("Retired Bundle"));
    });
  });

  describe("Cookie detail page", () => {
    test("an in-season cookie's page loads with its details", async () => {
      const res = await fetch(`${app.baseUrl}/menu/in-season-featured`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes("Featured Classic"));
      assert.ok(html.includes("$3.00"));
    });

    test("an out-of-season cookie's page loads and shows a return date", async () => {
      const res = await fetch(`${app.baseUrl}/menu/out-of-season`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes("Winter Cookie"));
      assert.ok(html.includes("December 1"));
    });

    test("an inactive cookie's page returns 404", async () => {
      const res = await fetch(`${app.baseUrl}/menu/hidden-cookie`);
      assert.equal(res.status, 404);
    });

    test("an unknown cookie id returns 404", async () => {
      const res = await fetch(`${app.baseUrl}/menu/does-not-exist`);
      assert.equal(res.status, 404);
    });
  });

  describe("About page", () => {
    test("returns 200 and includes the shop's story", async () => {
      const res = await fetch(`${app.baseUrl}/about`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes("Test Shop"));
      assert.ok(html.includes("A shop used only in tests."));
    });
  });

  describe("Contact page", () => {
    test("returns 200 and includes address, phone, and email links", async () => {
      const res = await fetch(`${app.baseUrl}/contact`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes("1 Test Street"));
      assert.ok(html.includes('href="tel:+15550000000"'));
      assert.ok(html.includes('href="mailto:test@example.com"'));
    });
  });

  describe("404 page", () => {
    test("an unknown path returns the 404 page", async () => {
      const res = await fetch(`${app.baseUrl}/this-page-does-not-exist`);
      assert.equal(res.status, 404);
      const html = await res.text();
      assert.ok(html.includes("Page not found"));
    });
  });
});
