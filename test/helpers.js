// Shared test fixtures and a helper to start a real app instance on a
// random port for API/page tests that exercise it over HTTP.

import { createApp } from "../src/app.js";

export function makeCookie(overrides = {}) {
  return {
    id: "test-cookie",
    name: "Test Cookie",
    category: "classic",
    description: "A cookie used in tests",
    priceCents: 300,
    stock: 10,
    defaultStock: 10,
    lowStockThreshold: null,
    allergens: ["wheat", "milk", "egg"],
    tags: [],
    vegetarian: true,
    season: null,
    image: "/images/placeholder-cookie.svg",
    featured: false,
    active: true,
    ...overrides,
  };
}

/**
 * A fixed "now" of Sep 15, 2024 (UTC), so a season of Sep 1 - Nov 30 is
 * in season and a season of Dec 1 - Feb 28 is out of season.
 */
export function fixtureData() {
  const now = () => new Date("2024-09-15T12:00:00Z");
  const shop = {
    name: "Test Shop",
    tagline: "Cookies for testing",
    address: "1 Test Street",
    phone: "+1-555-000-0000",
    email: "test@example.com",
    hours: [{ day: "Every day", open: "09:00", close: "17:00" }],
    about: "A shop used only in tests.",
    mapEmbedUrl: "https://example.com/map",
    timeZone: "UTC",
    defaultLowStockThreshold: 6,
  };

  const cookies = [
    makeCookie({
      id: "in-season-featured",
      name: "Featured Classic",
      featured: true,
      stock: 10,
    }),
    makeCookie({
      id: "in-season-plain",
      name: "Plain Classic",
      stock: 10,
    }),
    makeCookie({
      id: "sold-out",
      name: "Sold Out Classic",
      stock: 0,
    }),
    makeCookie({
      id: "low-stock",
      name: "Low Stock Classic",
      stock: 3,
    }),
    makeCookie({
      id: "vegan-cookie",
      name: "Vegan Treat",
      category: "dietary",
      allergens: ["wheat"],
      tags: ["vegan"],
      stock: 5,
    }),
    makeCookie({
      id: "hidden-cookie",
      name: "Hidden Cookie",
      active: false,
      stock: 5,
    }),
    makeCookie({
      id: "out-of-season",
      name: "Winter Cookie",
      category: "seasonal",
      season: { start: "12-01", end: "02-28" },
      stock: 5,
    }),
    makeCookie({
      id: "in-season-seasonal",
      name: "Fall Cookie",
      category: "seasonal",
      season: { start: "09-01", end: "11-30" },
      stock: 5,
    }),
  ];

  const bundles = [
    {
      id: "bundle-a",
      name: "Half Dozen",
      description: "Any 6 cookies on today's menu",
      count: 6,
      priceCents: 1200,
      active: true,
    },
    {
      id: "bundle-hidden",
      name: "Retired Bundle",
      description: "No longer offered",
      count: 6,
      priceCents: 1200,
      active: false,
    },
  ];

  return { cookies, bundles, shop, now };
}

/** Starts a real app instance on a random port. Caller must call `close()`. */
export async function startApp(overrides = {}) {
  const fixture = fixtureData();
  const app = createApp({ ...fixture, ...overrides });

  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => server.close(res)),
      });
    });
  });
}
