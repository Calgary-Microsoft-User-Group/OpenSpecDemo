import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  stockStatus,
  localMonthDay,
  isInSeason,
  returnsOn,
  dietFilters,
  formatPrice,
  visibleCookies,
  featuredCookies,
  checkBundlePricing,
  DIET_FILTERS,
} from "../src/inventory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inventoryPath = path.join(__dirname, "..", "data", "inventory.json");
const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));

function makeCookie(overrides = {}) {
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

describe("stockStatus", () => {
  test("zero stock is sold-out regardless of threshold", () => {
    const cookie = makeCookie({ stock: 0, lowStockThreshold: 0 });
    assert.equal(stockStatus(cookie, 6), "sold-out");
  });

  test("stock at the threshold is low", () => {
    const cookie = makeCookie({ stock: 6 });
    assert.equal(stockStatus(cookie, 6), "low");
  });

  test("stock one above the threshold is in-stock", () => {
    const cookie = makeCookie({ stock: 7 });
    assert.equal(stockStatus(cookie, 6), "in-stock");
  });

  test("per-cookie threshold overrides the shop default", () => {
    const cookie = makeCookie({ stock: 4, lowStockThreshold: 2 });
    // Above the cookie's own threshold (2), even though below the shop default (6).
    assert.equal(stockStatus(cookie, 6), "in-stock");
  });
});

describe("localMonthDay", () => {
  test("uses the shop's time zone, not UTC", () => {
    // 11:30pm Aug 31 in America/New_York (EDT, UTC-4) is 03:30 UTC on Sep 1.
    const now = new Date("2024-09-01T03:30:00Z");
    assert.equal(localMonthDay(now, "America/New_York"), "08-31");
  });
});

describe("isInSeason", () => {
  const wrapping = makeCookie({
    season: { start: "12-01", end: "02-28" },
    category: "seasonal",
  });
  const ordinary = makeCookie({
    season: { start: "09-01", end: "11-30" },
    category: "seasonal",
  });

  test("null season is always in season", () => {
    assert.equal(isInSeason(makeCookie({ season: null }), "01-01"), true);
  });

  test("ordinary season includes both boundary days", () => {
    assert.equal(isInSeason(ordinary, "09-01"), true);
    assert.equal(isInSeason(ordinary, "11-30"), true);
  });

  test("wrapping season includes Dec 1, Dec 31, Jan 1, and Feb 28", () => {
    assert.equal(isInSeason(wrapping, "12-01"), true);
    assert.equal(isInSeason(wrapping, "12-31"), true);
    assert.equal(isInSeason(wrapping, "01-01"), true);
    assert.equal(isInSeason(wrapping, "02-28"), true);
  });

  test("wrapping season is in season on Dec 15, Jan 15, and Feb 15", () => {
    assert.equal(isInSeason(wrapping, "12-15"), true);
    assert.equal(isInSeason(wrapping, "01-15"), true);
    assert.equal(isInSeason(wrapping, "02-15"), true);
  });

  test("wrapping season excludes the gap month (Mar 1 through Nov 30)", () => {
    assert.equal(isInSeason(wrapping, "03-01"), false);
    assert.equal(isInSeason(wrapping, "09-01"), false);
    assert.equal(isInSeason(wrapping, "11-30"), false);
  });

  test("Feb 29 falls within a season ending Feb 28", () => {
    assert.equal(isInSeason(wrapping, "02-29"), true);
  });

  test("Feb 29 does not fall within a season that excludes Feb 28", () => {
    assert.equal(isInSeason(ordinary, "02-29"), false);
  });
});

describe("seasonal coverage in the real data file", () => {
  test("every calendar day (including Feb 29) is covered by at least one seasonal cookie", () => {
    const seasonal = inventory.cookies.filter((c) => c.category === "seasonal");
    assert.ok(seasonal.length > 0, "expected at least one seasonal cookie");

    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(Date.UTC(2024, month, 0)).getUTCDate(); // 2024 is a leap year
      for (let day = 1; day <= daysInMonth; day++) {
        const monthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const covered = seasonal.some((cookie) => isInSeason(cookie, monthDay));
        assert.ok(covered, `no seasonal cookie is in season on ${monthDay}`);
      }
    }
  });

  test("exactly one seasonal cookie is in season on any given day", () => {
    const seasonal = inventory.cookies.filter((c) => c.category === "seasonal");
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(Date.UTC(2024, month, 0)).getUTCDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const monthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const inSeasonCount = seasonal.filter((cookie) =>
          isInSeason(cookie, monthDay)
        ).length;
        assert.equal(
          inSeasonCount,
          1,
          `expected exactly one seasonal cookie in season on ${monthDay}, got ${inSeasonCount}`
        );
      }
    }
  });
});

describe("returnsOn", () => {
  test("returns the season's start date", () => {
    const cookie = makeCookie({ season: { start: "09-01", end: "11-30" } });
    assert.equal(returnsOn(cookie), "09-01");
  });

  test("returns the start date for a season that wraps past the new year", () => {
    const cookie = makeCookie({ season: { start: "12-01", end: "02-28" } });
    assert.equal(returnsOn(cookie), "12-01");
  });

  test("returns null for a cookie with no season", () => {
    assert.equal(returnsOn(makeCookie({ season: null })), null);
  });
});

describe("dietFilters", () => {
  test("egg-free is derived from the absence of egg in allergens", () => {
    const cookie = makeCookie({ allergens: ["wheat", "milk"] });
    assert.ok(dietFilters(cookie).includes("egg-free"));
  });

  test("dairy-free is derived from the absence of milk in allergens", () => {
    const cookie = makeCookie({ allergens: ["wheat", "soy"] });
    assert.ok(dietFilters(cookie).includes("dairy-free"));
  });

  test("vegan and made-without-gluten come from tags", () => {
    const cookie = makeCookie({ tags: ["vegan", "made-without-gluten"] });
    const filters = dietFilters(cookie);
    assert.ok(filters.includes("vegan"));
    assert.ok(filters.includes("made-without-gluten"));
  });

  test("non-vegetarian cookie is excluded from the vegetarian filter", () => {
    const cookie = makeCookie({ vegetarian: false });
    assert.ok(!dietFilters(cookie).includes("vegetarian"));
  });

  test("matches every cookie's expected filters in the real inventory", () => {
    const expected = {
      shortbread: ["egg-free", "vegetarian"],
      "vegan-oat": ["egg-free", "dairy-free", "vegan", "vegetarian"],
      "gf-choc-chip": ["made-without-gluten", "vegetarian"],
      "flourless-pb": ["dairy-free", "made-without-gluten", "vegetarian"],
      smores: ["vegetarian"].filter(() => false), // smores is not vegetarian
    };
    const byId = Object.fromEntries(inventory.cookies.map((c) => [c.id, c]));

    assert.deepEqual(
      dietFilters(byId["shortbread"]).sort(),
      expected.shortbread.sort()
    );
    assert.deepEqual(
      dietFilters(byId["vegan-oat"]).sort(),
      expected["vegan-oat"].sort()
    );
    assert.deepEqual(
      dietFilters(byId["gf-choc-chip"]).sort(),
      expected["gf-choc-chip"].sort()
    );
    assert.deepEqual(
      dietFilters(byId["flourless-pb"]).sort(),
      expected["flourless-pb"].sort()
    );
    assert.ok(!dietFilters(byId["smores"]).includes("vegetarian"));
  });
});

describe("formatPrice", () => {
  test("formats a whole-dollar amount", () => {
    assert.equal(formatPrice(300), "$3.00");
  });

  test("formats a fractional-dollar amount", () => {
    assert.equal(formatPrice(275), "$2.75");
  });
});

describe("visibleCookies", () => {
  const cookies = [
    makeCookie({ id: "a", active: true, category: "classic" }),
    makeCookie({ id: "b", active: false, category: "classic" }),
    makeCookie({
      id: "c",
      active: true,
      category: "seasonal",
      season: { start: "01-01", end: "01-02" },
    }),
    makeCookie({
      id: "d",
      active: true,
      category: "dietary",
      tags: ["vegan"],
    }),
    makeCookie({ id: "e", active: true, category: "classic", stock: 0 }),
  ];

  test("excludes inactive cookies", () => {
    const result = visibleCookies(cookies, { monthDay: "06-15", defaultThreshold: 6 });
    assert.ok(!result.some((c) => c.id === "b"));
  });

  test("excludes out-of-season cookies", () => {
    const result = visibleCookies(cookies, { monthDay: "06-15", defaultThreshold: 6 });
    assert.ok(!result.some((c) => c.id === "c"));
  });

  test("filters by category", () => {
    const result = visibleCookies(cookies, {
      monthDay: "06-15",
      category: "dietary",
      defaultThreshold: 6,
    });
    assert.deepEqual(result.map((c) => c.id), ["d"]);
  });

  test("filters by each diet value", () => {
    const result = visibleCookies(cookies, {
      monthDay: "06-15",
      diet: "vegan",
      defaultThreshold: 6,
    });
    assert.deepEqual(result.map((c) => c.id), ["d"]);
  });

  test("hides sold-out cookies when hideSoldOut is true", () => {
    const shown = visibleCookies(cookies, { monthDay: "06-15", defaultThreshold: 6 });
    assert.ok(shown.some((c) => c.id === "e"));

    const hidden = visibleCookies(cookies, {
      monthDay: "06-15",
      hideSoldOut: true,
      defaultThreshold: 6,
    });
    assert.ok(!hidden.some((c) => c.id === "e"));
  });
});

describe("featuredCookies", () => {
  test("returns featured, active, in-season cookies when any exist", () => {
    const cookies = [
      makeCookie({ id: "a", featured: true }),
      makeCookie({ id: "b", featured: false }),
      makeCookie({ id: "c", featured: true, active: false }),
    ];
    const result = featuredCookies(cookies, "06-15");
    assert.deepEqual(result.map((c) => c.id), ["a"]);
  });

  test("falls back to in-season seasonal cookies when none are featured", () => {
    const cookies = [
      makeCookie({ id: "a", featured: false, category: "classic" }),
      makeCookie({
        id: "b",
        featured: false,
        category: "seasonal",
        season: { start: "01-01", end: "12-31" },
      }),
      makeCookie({
        id: "c",
        featured: false,
        category: "seasonal",
        season: { start: "01-01", end: "01-02" },
      }),
    ];
    const result = featuredCookies(cookies, "06-15");
    assert.deepEqual(result.map((c) => c.id), ["b"]);
  });
});

describe("checkBundlePricing", () => {
  test("flags a bundle priced above the ceiling", () => {
    const cookies = [makeCookie({ id: "a", priceCents: 225, active: true })];
    const bundles = [
      { id: "over", name: "Over-priced", count: 6, priceCents: 1400, active: true },
    ];
    const violations = checkBundlePricing(cookies, bundles);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].id, "over");
    assert.equal(violations[0].ceilingCents, 1350);
  });

  test("passes a bundle priced at or below the ceiling", () => {
    const cookies = [makeCookie({ id: "a", priceCents: 225, active: true })];
    const bundles = [
      { id: "fine", name: "Fine", count: 6, priceCents: 1300, active: true },
    ];
    assert.deepEqual(checkBundlePricing(cookies, bundles), []);
  });

  test("the real inventory's bundles satisfy the pricing rule", () => {
    const violations = checkBundlePricing(inventory.cookies, inventory.bundles);
    assert.deepEqual(violations, []);
  });
});

describe("gluten wording", () => {
  test("no cookie or bundle record contains the phrase 'gluten-free'", () => {
    const haystacks = [
      ...inventory.cookies.flatMap((c) => [c.name, c.description, ...c.tags]),
      ...inventory.bundles.flatMap((b) => [b.name, b.description]),
    ];
    for (const text of haystacks) {
      assert.ok(
        !String(text).toLowerCase().includes("gluten-free"),
        `found "gluten-free" in: ${text}`
      );
    }
  });

  test("dietFilters never produces the label 'gluten-free'", () => {
    for (const cookie of inventory.cookies) {
      assert.ok(!dietFilters(cookie).includes("gluten-free"));
    }
    // The recognized filter names themselves never include "gluten-free" —
    // only "made-without-gluten" is offered as a gluten-related filter.
    assert.ok(!DIET_FILTERS.includes("gluten-free"));
  });
});
