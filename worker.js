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

    // 1) Canonicalize junk search URLs, host, protocol and trailing slash in one hop.
    let redirectNeeded = false;
    try {
      const q = url.searchParams.get("q");
      if (q !== null) {
        const decodedQ = (() => { try { return decodeURIComponent(q); } catch { return q; } })();
        const isJunk = decodedQ.includes("$" + "{") || decodedQ.includes("encodeURIComponent") || decodedQ.includes("{search_term_string}") || decodedQ.includes("%24%7B");
        if (isJunk) {
          url.searchParams.delete("q");
          redirectNeeded = true;
        }
      }
    } catch { /* keep serving if query parsing fails */ }

    if (hostname !== "calculatorst.com") {
      url.hostname = "calculatorst.com";
      redirectNeeded = true;
    }
    if (url.protocol !== "https:") {
      url.protocol = "https:";
      redirectNeeded = true;
    }
    if (!url.pathname.endsWith("/") && !url.pathname.includes(".")) {
      url.pathname += "/";
      redirectNeeded = true;
    }
    if (redirectNeeded) {
      return Response.redirect(url.toString(), 301);
    }

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
      if (norm === "/construction/drywall" || norm === "/construction/drywall-pain") {
        return Response.redirect("https://calculatorst.com/construction/drywall-paint/", 301);
      }
    } catch {
      // ignore decode errors
    }

    // 4) Serve static asset
    // env.ASSETS is bound via wrangler.jsonc assets.directory = "./dist"
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);

      // Search-filter URLs are useful to users but should not become indexable
      // duplicate landing pages. Keep them crawlable and preserve clean canonicals.
      if ((url.pathname === "/calculators/" || url.pathname === "/calculators") && url.searchParams.has("q")) {
        const headers = new Headers(response.headers);
        headers.set("X-Robots-Tag", "noindex, follow");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      return response;
    }
    // fallback (wrangler dev without binding)
    return fetch(request);
  },
};
