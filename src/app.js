import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import { createApiRouter } from "./routes/api.js";
import { createPagesRouter } from "./routes/pages.js";
import { renderNotFound } from "./render.js";
import { securityHeaders } from "./security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

/**
 * Builds the Express app. `now` defaults to the real clock but can be
 * overridden in tests to pin the current date/time.
 */
export function createApp({ cookies, bundles, shop, now = () => new Date() }) {
  const app = express();

  app.set("views", path.join(rootDir, "views"));
  app.set("view engine", "ejs");

  app.use(securityHeaders(shop));
  app.use(express.json());
  app.use(express.static(path.join(rootDir, "public")));

  app.use("/api", createApiRouter({ cookies, bundles, shop, now }));
  app.use("/", createPagesRouter({ cookies, bundles, shop, now }));

  // Catch-all: any request that reached here matched no route above.
  app.use((req, res, next) => {
    renderNotFound(res, next, { shop });
  });

  // Error handler: logs the error and shows a friendly page instead of a
  // stack trace. Must be defined with 4 arguments to be recognized by
  // Express as an error-handling middleware.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);

    const fallback = () =>
      res.status(500).type("text/plain").send("Something went wrong. Please try again later.");

    res.status(500);
    res.render("500", { shop, title: "Something went wrong" }, (renderErr, innerHtml) => {
      if (renderErr) return fallback();
      res.render("layout", { shop, title: "Something went wrong", body: innerHtml }, (layoutErr, html) => {
        if (layoutErr) return fallback();
        res.send(html);
      });
    });
  });

  return app;
}
