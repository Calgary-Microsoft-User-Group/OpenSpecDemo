import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadData } from "../src/data.js";

function makeTempDataDir({ inventory, shop } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "cookie-shop-test-"));
  if (inventory !== undefined) {
    writeFileSync(
      path.join(dir, "inventory.json"),
      typeof inventory === "string" ? inventory : JSON.stringify(inventory)
    );
  }
  if (shop !== undefined) {
    writeFileSync(
      path.join(dir, "shop.json"),
      typeof shop === "string" ? shop : JSON.stringify(shop)
    );
  }
  return dir;
}

describe("loadData", () => {
  test("loads a valid temp-directory copy of the real data files", () => {
    const dir = makeTempDataDir({
      inventory: { cookies: [{ id: "a" }], bundles: [{ id: "b" }] },
      shop: { name: "Test Shop" },
    });
    try {
      const data = loadData(dir);
      assert.equal(data.cookies.length, 1);
      assert.equal(data.bundles.length, 1);
      assert.equal(data.shop.name, "Test Shop");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("throws a clear error when inventory.json is missing", () => {
    const dir = makeTempDataDir({ shop: { name: "Test Shop" } });
    try {
      assert.throws(() => loadData(dir), /Could not read inventory data/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("throws a clear error when shop.json is invalid JSON", () => {
    const dir = makeTempDataDir({
      inventory: { cookies: [], bundles: [] },
      shop: "{ not valid json",
    });
    try {
      assert.throws(() => loadData(dir), /Could not parse shop settings/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
