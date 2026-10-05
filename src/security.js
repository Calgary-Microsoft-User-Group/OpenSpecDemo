// Basic security headers. Kept intentionally small: no inline scripts or
// styles are used anywhere in the site, so a fairly strict CSP is safe.

export function securityHeaders(shop) {
  const frameSrc = ["'none'"];
  if (shop.mapEmbedUrl) {
    try {
      frameSrc[0] = new URL(shop.mapEmbedUrl).origin;
    } catch {
      // Leave frame-src as 'none' if the configured map URL is invalid.
    }
  }

  const csp = [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self'",
    "script-src 'self'",
    `frame-src ${frameSrc.join(" ")}`,
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
    res.setHeader("Content-Security-Policy", csp);
    next();
  };
}
