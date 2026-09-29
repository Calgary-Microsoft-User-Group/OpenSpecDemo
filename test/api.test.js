import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { startApp } from "./helpers.js";

describe("public cookies and bundles API", () => {
  let app;

  before(async () => {
    app = await startApp();
  });

  after(async () => {
    await app.close();
  });

  describe("GET /api/cookies", () => {
    test("default listing includes active, in-season cookies only", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies`);
      assert.equal(res.status, 200);
      const body = await res.json();
      const ids = body.map((c) => c.id).sort();
      assert.deepEqual(ids, [
        "in-season-featured",
        "in-season-plain",
        "in-season-seasonal",
        "low-stock",
        "sold-out",
        "vegan-cookie",
      ]);
    });

    test("each result includes formatted price, status, allergens, and diet filters", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies`);
      const body = await res.json();
      const soldOut = body.find((c) => c.id === "sold-out");
      assert.equal(soldOut.price, "$3.00");
      assert.equal(soldOut.status, "sold-out");
      assert.deepEqual(soldOut.allergens, ["wheat", "milk", "egg"]);
      assert.ok(Array.isArray(soldOut.dietFilters));
    });

    test("filters by category", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies?category=dietary`);
      const body = await res.json();
      assert.deepEqual(body.map((c) => c.id), ["vegan-cookie"]);
    });

    test("filters by diet", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies?diet=vegan`);
      const body = await res.json();
      assert.deepEqual(body.map((c) => c.id), ["vegan-cookie"]);
    });

    test("rejects an unrecognized category with 400", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies?category=nonsense`);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /nonsense/);
    });

    test("rejects an unrecognized diet value with 400", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies?diet=nonsense`);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /nonsense/);
    });
  });

  describe("GET /api/cookies/:id", () => {
    test("an in-season cookie has inSeason: true and no returnsOn", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies/in-season-featured`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.inSeason, true);
      assert.equal(body.returnsOn, undefined);
    });

    test("an out-of-season cookie has inSeason: false and a returnsOn date", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies/out-of-season`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.inSeason, false);
      assert.equal(body.returnsOn, "12-01");
    });

    test("an inactive cookie returns 404", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies/hidden-cookie`);
      assert.equal(res.status, 404);
    });

    test("an unknown id returns 404", async () => {
      const res = await fetch(`${app.baseUrl}/api/cookies/does-not-exist`);
      assert.equal(res.status, 404);
    });
  });

  describe("GET /api/bundles", () => {
    test("returns active bundles with price and count", async () => {
      const res = await fetch(`${app.baseUrl}/api/bundles`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.deepEqual(body.map((b) => b.id), ["bundle-a"]);
      assert.equal(body[0].count, 6);
      assert.equal(body[0].price, "$12.00");
    });
  });

  describe("read-only enforcement", () => {
    const endpoints = ["/api/cookies", "/api/cookies/in-season-featured", "/api/bundles"];
    const writeMethods = ["POST", "PATCH", "PUT", "DELETE"];

    for (const endpoint of endpoints) {
      for (const method of writeMethods) {
        test(`${method} ${endpoint} is rejected`, async () => {
          const res = await fetch(`${app.baseUrl}${endpoint}`, { method });
          assert.ok(
            res.status === 404 || res.status === 405,
            `expected 404 or 405, got ${res.status}`
          );
        });
      }
    }
  });
});
