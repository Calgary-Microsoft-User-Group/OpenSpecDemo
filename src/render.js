// A small manual "layout" helper: renders a page's own view to an HTML
// string, then renders views/layout.ejs with that string as `body`. Plain
// EJS has no built-in layout inheritance, and this avoids adding another
// dependency for it.

export function renderPage(res, next, view, locals, status = 200) {
  res.status(status);
  res.render(view, locals, (err, innerHtml) => {
    if (err) return next(err);
    res.render("layout", { ...locals, body: innerHtml }, (layoutErr, html) => {
      if (layoutErr) return next(layoutErr);
      res.send(html);
    });
  });
}

export function renderNotFound(res, next, locals) {
  renderPage(res, next, "404", { title: "Not Found", ...locals }, 404);
}
