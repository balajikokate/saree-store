// Adds a short-lived public Cache-Control header to a route. Meant for
// read-only, non-personalized endpoints (product catalog, categories,
// theme settings) that don't change from request to request for a given
// moment in time — this lets browsers and any CDN in front of the API
// skip a full round-trip on repeat navigation (e.g. going back to Shop
// after viewing a product), without risking noticeably stale data since
// the window is short and an admin edit is visible again within seconds.
function cacheControl(seconds) {
  return (req, res, next) => {
    res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
    next();
  };
}

module.exports = { cacheControl };
