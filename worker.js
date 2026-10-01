/**
 * Apply canonical redirects and search-page indexing headers before serving
 * static assets. wrangler.jsonc must keep assets.run_worker_first enabled.
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
    // Resolve real category aliases before emitting the canonical redirect.
    // Invalid unit paths have no equivalent page and must remain HTTP 404.
    const categoryAliases = {
      "/construction/decking/": "/construction/deck-fence/",
      "/construction/fencing/": "/construction/deck-fence/",
      "/construction/drywall/": "/construction/drywall-paint/",
      "/construction/drywall-pain/": "/construction/drywall-paint/",
    };
    const aliasTarget = categoryAliases[url.pathname];
    if (aliasTarget) {
      url.pathname = aliasTarget;
      redirectNeeded = true;
    }

    if (redirectNeeded) {
      return Response.redirect(url.toString(), 301);
    }

    // 4) Serve static asset
    // env.ASSETS is bound via wrangler.jsonc assets.directory = "./dist"
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);

      // Search-filter URLs are useful to users but should not become indexable
      // duplicate landing pages. Keep them crawlable and preserve clean canonicals.
      if ((url.pathname === "/calculators/" || url.pathname === "/") && url.searchParams.has("q")) {
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
