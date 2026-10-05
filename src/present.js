// Shapes a raw cookie/bundle record into the plain object used for display,
// shared by the JSON API and the server-rendered pages so there's exactly
// one place that decides what a cookie/bundle "looks like" to a reader.

import { stockStatus, dietFilters, formatPrice } from "./inventory.js";

const STATUS_LABELS = {
  "sold-out": "Sold out",
  low: "Only a few left",
  "in-stock": "In stock",
};

export const DIET_LABELS = {
  "egg-free": "Egg-free",
  "dairy-free": "Dairy-free",
  vegan: "Vegan",
  "made-without-gluten": "Made without gluten",
  vegetarian: "Vegetarian",
};

export const CATEGORY_LABELS = {
  classic: "Classics",
  specialty: "Specialty",
  dietary: "Dietary-Friendly",
  seasonal: "Seasonal",
};

export function presentCookie(cookie, shop) {
  const status = stockStatus(cookie, shop.defaultLowStockThreshold);
  return {
    id: cookie.id,
    name: cookie.name,
    category: cookie.category,
    description: cookie.description,
    priceCents: cookie.priceCents,
    price: formatPrice(cookie.priceCents),
    status,
    statusLabel: STATUS_LABELS[status],
    allergens: cookie.allergens,
    dietFilters: dietFilters(cookie),
    dietFilterLabels: dietFilters(cookie).map((filter) => DIET_LABELS[filter]),
    image: cookie.image,
  };
}

export function presentBundle(bundle) {
  return {
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,
    count: bundle.count,
    priceCents: bundle.priceCents,
    price: formatPrice(bundle.priceCents),
  };
}
