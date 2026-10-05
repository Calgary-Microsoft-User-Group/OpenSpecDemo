import { Router } from "express";

import {
  CATEGORIES,
  DIET_FILTERS,
  visibleCookies,
  isInSeason,
  returnsOn,
  localMonthDay,
} from "../inventory.js";
import { presentCookie, presentBundle } from "../present.js";

/**
 * The public, read-only cookies and bundles API.
 * `now` is a function returning the current Date, so tests can pin it.
 */
export function createApiRouter({ cookies, bundles, shop, now }) {
  const router = Router();

  function currentMonthDay() {
    return localMonthDay(now(), shop.timeZone);
  }

  router.get("/cookies", (req, res) => {
    const { category, diet } = req.query;

    if (category !== undefined && !CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Unknown category: ${category}` });
    }
    if (diet !== undefined && !DIET_FILTERS.includes(diet)) {
      return res.status(400).json({ error: `Unknown diet filter: ${diet}` });
    }

    const results = visibleCookies(cookies, {
      monthDay: currentMonthDay(),
      category,
      diet,
      defaultThreshold: shop.defaultLowStockThreshold,
    });

    res.json(results.map((cookie) => presentCookie(cookie, shop)));
  });

  router.get("/cookies/:id", (req, res) => {
    const cookie = cookies.find((c) => c.id === req.params.id);
    if (!cookie || !cookie.active) {
      return res.status(404).json({ error: "Cookie not found" });
    }

    const inSeason = isInSeason(cookie, currentMonthDay());
    const body = { ...presentCookie(cookie, shop), inSeason };
    if (!inSeason) {
      body.returnsOn = returnsOn(cookie);
    }
    res.json(body);
  });

  router.get("/bundles", (req, res) => {
    const results = bundles.filter((bundle) => bundle.active).map(presentBundle);
    res.json(results);
  });

  return router;
}
