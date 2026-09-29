import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { startApp } from "./helpers.js";

describe("unhandled route errors", () => {
  test("a handler error returns the friendly 500 page, not a stack trace, and is logged", async () => {
    const originalError = console.error;
    const logged = [];
    console.error = (...args) => logged.push(args);

    const app = await startApp({
      now: () => {
        throw new Error("boom: simulated handler failure");
      },
    });

    try {
      const res = await fetch(`${app.baseUrl}/`);
      assert.equal(res.status, 500);
      const html = await res.text();
      assert.ok(html.includes("Something went wrong"));
      assert.ok(!html.includes("boom: simulated handler failure"));
      assert.ok(!html.toLowerCase().includes("at file://")); // no raw stack trace leaked
      assert.ok(logged.length > 0, "expected the error to be logged to console.error");
    } finally {
      console.error = originalError;
      await app.close();
    }
  });
});
