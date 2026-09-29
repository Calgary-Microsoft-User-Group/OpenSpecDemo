import { Router } from "express";

import {
  CATEGORIES,
  DIET_FILTERS,
  visibleCookies,
  featuredCookies,
  isInSeason,
  returnsOn,
  formatMonthDay,
  localMonthDay,
} from "../inventory.js";
import {
  presentCookie,
  presentBundle,
  CATEGORY_LABELS,
  DIET_LABELS,
} from "../present.js";
import { renderPage, renderNotFound } from "../render.js";

/** The public-facing pages: Home, Menu, cookie detail, About, Contact. */
export function createPagesRouter({ cookies, bundles, shop, now }) {
  const router = Router();

  function currentMonthDay() {
    return localMonthDay(now(), shop.timeZone);
  }

  router.get("/", (req, res, next) => {
    const featured = featuredCookies(cookies, currentMonthDay()).map((cookie) =>
      presentCookie(cookie, shop)
    );
    renderPage(res, next, "home", { shop, featured, title: null });
  });

  router.get("/menu", (req, res, next) => {
    const category = CATEGORIES.includes(req.query.category)
      ? req.query.category
      : undefined;
    const diet = DIET_FILTERS.includes(req.query.diet)
      ? req.query.diet
      : undefined;
    const hideSoldOut = req.query.hideSoldOut === "1";

    const visible = visibleCookies(cookies, {
      monthDay: currentMonthDay(),
      category,
      diet,
      hideSoldOut,
      defaultThreshold: shop.defaultLowStockThreshold,
    });

    const grouped = CATEGORIES.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      cookies: visible
        .filter((cookie) => cookie.category === cat)
        .map((cookie) => presentCookie(cookie, shop)),
    })).filter((group) => group.cookies.length > 0);

    const activeBundles = bundles.filter((bundle) => bundle.active).map(presentBundle);

    renderPage(res, next, "menu", {
      shop,
      grouped,
      activeBundles,
      title: "Menu",
      filters: { category: category || "", diet: diet || "", hideSoldOut },
      categories: CATEGORIES,
      categoryLabels: CATEGORY_LABELS,
      dietFilterOptions: DIET_FILTERS,
      dietLabels: DIET_LABELS,
    });
  });

  router.get("/menu/:id", (req, res, next) => {
    const cookie = cookies.find((c) => c.id === req.params.id);
    if (!cookie || !cookie.active) {
      return renderNotFound(res, next, { shop });
    }

    const inSeason = isInSeason(cookie, currentMonthDay());
    const presented = presentCookie(cookie, shop);
    const returnsOnText = inSeason ? null : formatMonthDay(returnsOn(cookie));

    renderPage(res, next, "cookie-detail", {
      shop,
      cookie: presented,
      inSeason,
      returnsOnText,
      title: cookie.name,
    });
  });

  router.get("/about", (req, res, next) => {
    renderPage(res, next, "about", { shop, title: "About" });
  });

  router.get("/contact", (req, res, next) => {
    renderPage(res, next, "contact", { shop, title: "Contact" });
  });

  return router;
}
