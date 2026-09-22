/**
 * Cloudflare Worker for calculatorst.com — edge 301 for 121 Alternate fix
 * Handles www→apex + http→https BEFORE serving static assets.
 * This fixes GSC "Alternate page with proper canonical tag" (121 pages are www/http variants returning 200+canonical instead of 301).
 * Middleware src/middleware.ts handles same logic for SSR, but static assets bypass it — this Worker runs at edge.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();

    // 1) Canonical host + protocol + trailing-slash normalization: single-hop to https://calculatorst.com
    // Fixes 2-hop chain where www→apex dropped trailing slash and _redirects had to add it back
    if (hostname === "www.calculatorst.com" || hostname.startsWith("www.")) {
      url.hostname = "calculatorst.com";
      url.protocol = "https:";
      // Normalize trailing slash to match Astro's trailingSlash: 'always'
      if (!url.pathname.endsWith("/") && !url.pathname.includes(".")) {
        url.pathname += "/";
      }
      return Response.redirect(url.toString(), 301);
    }
    if (url.protocol === "http:") {
      url.protocol = "https:";
      // keep hostname as-is (handles http://calculatorst.com)
      // but if it was http://www, above already handled
      return Response.redirect(url.toString(), 301);
    }

    // 2) Junk search template leakage: /calculators/?q=<JS template> literal (GSC Blocked by robots.txt)
    // Handles both raw and encoded forms via edge 301 before serving static asset
    try {
      const q = url.searchParams.get("q");
      if (q !== null) {
        const decodedQ = (() => { try { return decodeURIComponent(q); } catch { return q; }})();
        const isJunk = decodedQ.includes("$" + "{") || decodedQ.includes("encodeURIComponent") || decodedQ.includes("{search_term_string}") || decodedQ.includes("%24%7B");
        if (isJunk) {
          url.searchParams.delete("q");
          const cleanPath = url.pathname.startsWith("/calculators") ? url.pathname : "/calculators/";
          const redirectUrl = new URL(cleanPath, "https://calculatorst.com");
          redirectUrl.pathname = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";
          for (const [k, v] of url.searchParams.entries()) redirectUrl.searchParams.set(k, v);
          return Response.redirect(redirectUrl.toString(), 301);
        }
      }
    } catch { /* ignore */ }

    // 3) Garbage units parsed as URLs (12 Not found) — fallback in case _redirects/static miss
    // Also keeps legacy /construction/drywall → drywall-paint for old crawls
    try {
      const decoded = decodeURIComponent(url.pathname);
      const norm = decoded.replace(/\/+$/, "").toLowerCase();
      if (
        norm === "/ton" ||
        norm === "/ft²" ||
        norm === "/yd³" ||
        norm === "/ft" ||
        norm === "/unit" ||
        norm === "/panel" ||
        norm === "/post"
      ) {
        return Response.redirect("https://calculatorst.com/gravel-calculator/", 301);
      }
      if (norm === "/construction/drywall") {
        return Response.redirect("https://calculatorst.com/construction/drywall-paint/", 301);
      }
    } catch {
      // ignore decode errors
    }

    // 4) Serve static asset
    // env.ASSETS is bound via wrangler.jsonc assets.directory = "./dist"
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    // fallback (wrangler dev without binding)
    return fetch(request);
  },
};
