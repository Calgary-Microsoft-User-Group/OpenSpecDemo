import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { startApp } from "./helpers.js";
import { securityHeaders } from "../src/security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shopPath = path.join(__dirname, "..", "data", "shop.json");
const realShop = JSON.parse(readFileSync(shopPath, "utf8"));

describe("securityHeaders", () => {
  test("derives frame-src from the real shop's map embed origin (OpenStreetMap)", () => {
    const headers = {};
    const res = { setHeader: (k, v) => (headers[k] = v) };
    securityHeaders(realShop)({}, res, () => {});
    assert.match(headers["Content-Security-Policy"], /frame-src https:\/\/www\.openstreetmap\.org/);
  });
});

describe("security headers on real requests", () => {
  test("every response includes the expected security headers", async () => {
    const app = await startApp();
    try {
      const res = await fetch(`${app.baseUrl}/`);
      assert.equal(res.headers.get("x-content-type-options"), "nosniff");
      assert.equal(res.headers.get("x-frame-options"), "DENY");
      assert.ok(res.headers.get("content-security-policy"));
      assert.match(res.headers.get("content-security-policy"), /frame-src https:\/\/example\.com/);
    } finally {
      await app.close();
    }
  });
});
