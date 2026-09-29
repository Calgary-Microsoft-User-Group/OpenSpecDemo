// Reads the inventory and shop data files into memory. This is the only
// module in the app that touches the filesystem for cookie/shop data;
// src/inventory.js stays pure so its date/derivation logic is trivial to test.

import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Loads `inventory.json` and `shop.json` from the given directory.
 * Throws a clear, specific error if either file is missing or not valid JSON.
 */
export function loadData(dataDir) {
  const inventoryPath = path.join(dataDir, "inventory.json");
  const shopPath = path.join(dataDir, "shop.json");

  const inventory = readJsonFile(inventoryPath, "inventory data");
  const shop = readJsonFile(shopPath, "shop settings");

  return {
    cookies: inventory.cookies,
    bundles: inventory.bundles,
    shop,
  };
}

function readJsonFile(filePath, label) {
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (err) {
    throw new Error(
      `Could not read ${label} from ${filePath}: ${err.message}`
    );
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Could not parse ${label} at ${filePath} as JSON: ${err.message}`
    );
  }
}
