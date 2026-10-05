// Pure inventory logic: no Express, no filesystem access.
// Every date-dependent function takes a monthDay/now value as a parameter
// so it can be tested without mocking the system clock.

export const CATEGORIES = ["classic", "specialty", "dietary", "seasonal"];

export const DIET_FILTERS = [
  "egg-free",
  "dairy-free",
  "vegan",
  "made-without-gluten",
  "vegetarian",
];

/**
 * Derives a cookie's stock status from its stock count and effective
 * low-stock threshold (the cookie's own threshold, or the shop default
 * when the cookie's is null).
 * @returns {"sold-out"|"low"|"in-stock"}
 */
export function stockStatus(cookie, defaultThreshold) {
  const threshold =
    cookie.lowStockThreshold === null || cookie.lowStockThreshold === undefined
      ? defaultThreshold
      : cookie.lowStockThreshold;

  if (cookie.stock === 0) return "sold-out";
  if (cookie.stock <= threshold) return "low";
  return "in-stock";
}

/**
 * Returns the shop's local calendar date, as "MM-DD", for the given
 * instant and IANA time zone.
 */
export function localMonthDay(now, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  return `${month}-${day}`;
}

/**
 * Whether a cookie is in season on the given "MM-DD" date.
 * A null season means always in season. A season whose start is later
 * in the year than its end wraps past December 31. February 29 is
 * treated as within any season whose range includes February 28.
 */
export function isInSeason(cookie, monthDay) {
  if (!cookie.season) return true;

  const { start, end } = cookie.season;
  const effective = monthDay === "02-29" ? "02-28" : monthDay;

  if (start <= end) {
    return effective >= start && effective <= end;
  }
  // Wraps past the new year (e.g. start "12-01", end "02-28").
  return effective >= start || effective <= end;
}

/**
 * The "MM-DD" date a cookie's season next begins. Seasons recur every
 * year, so this is always the season's configured start date.
 */
export function returnsOn(cookie) {
  return cookie.season ? cookie.season.start : null;
}

/** Formats a "MM-DD" value as a human-readable date, e.g. "December 1". */
export function formatMonthDay(monthDay) {
  const [month, day] = monthDay.split("-").map(Number);
  // A fixed non-leap reference year; only month/day are used.
  const date = new Date(Date.UTC(2001, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * The dietary filters a cookie satisfies, derived from its allergens,
 * tags, and vegetarian field rather than stored directly.
 */
export function dietFilters(cookie) {
  const filters = [];
  if (!cookie.allergens.includes("egg")) filters.push("egg-free");
  if (!cookie.allergens.includes("milk")) filters.push("dairy-free");
  if (cookie.tags.includes("vegan")) filters.push("vegan");
  if (cookie.tags.includes("made-without-gluten")) {
    filters.push("made-without-gluten");
  }
  if (cookie.vegetarian) filters.push("vegetarian");
  return filters;
}

/** Formats a whole-cent price as a dollar string, e.g. 300 -> "$3.00". */
export function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Active, in-season cookies, optionally filtered by category and/or
 * dietary need, optionally excluding sold-out cookies.
 */
export function visibleCookies(
  cookies,
  { monthDay, category, diet, hideSoldOut = false, defaultThreshold }
) {
  return cookies.filter((cookie) => {
    if (!cookie.active) return false;
    if (!isInSeason(cookie, monthDay)) return false;
    if (category && cookie.category !== category) return false;
    if (diet && !dietFilters(cookie).includes(diet)) return false;
    if (hideSoldOut && stockStatus(cookie, defaultThreshold) === "sold-out") {
      return false;
    }
    return true;
  });
}

/**
 * Cookies to show on the Home page: active, in-season, featured cookies,
 * or (when none are featured) active, in-season seasonal cookies.
 */
export function featuredCookies(cookies, monthDay) {
  const visible = cookies.filter(
    (cookie) => cookie.active && isInSeason(cookie, monthDay)
  );
  const featured = visible.filter((cookie) => cookie.featured);
  if (featured.length > 0) return featured;
  return visible.filter((cookie) => cookie.category === "seasonal");
}

/**
 * Checks every active bundle against the rule that its price must not
 * exceed its cookie count times the cheapest active cookie's price.
 * @returns {Array<{id: string, name: string, priceCents: number, ceilingCents: number}>}
 *   the bundles that violate the rule (empty when all bundles are fine).
 */
export function checkBundlePricing(cookies, bundles) {
  const activeCookies = cookies.filter((cookie) => cookie.active);
  if (activeCookies.length === 0) return [];

  const cheapestCents = Math.min(...activeCookies.map((c) => c.priceCents));

  return bundles
    .filter((bundle) => bundle.active)
    .filter((bundle) => bundle.priceCents > bundle.count * cheapestCents)
    .map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      priceCents: bundle.priceCents,
      ceilingCents: bundle.count * cheapestCents,
    }));
}
