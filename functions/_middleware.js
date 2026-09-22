/**
 * Cloudflare Pages Function — edge 301 for 121 Alternate fix
 * Runs before static assets on Pages (calculatorst.pages.dev + custom domain calculatorst.com).
 * Astro src/middleware.ts only runs for SSR, not for static Pages assets — this handles hostname at edge.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname.toLowerCase();

  // www → apex + http → https in one hop with trailing-slash normalization
  // Always redirect to apex with trailing slash to match Astro's trailingSlash: 'always'
  // This prevents Cloudflare Pages Function from returning 200 without trailing slash
  if (hostname === "www.calculatorst.com" || hostname.startsWith("www.")) {
    url.hostname = "calculatorst.com";
    url.protocol = "https:";
    if (!url.pathname.endsWith("/") && !url.pathname.includes(".")) {
      url.pathname += "/";
    }
    return Response.redirect(url.toString(), 301);
  }
  if (url.protocol === "http:") {
    url.protocol = "https:";
    if (!url.pathname.endsWith("/") && !url.pathname.includes(".")) {
      url.pathname += "/";
    }
    return Response.redirect(url.toString(), 301);
  }

  // Junk search template leakage: /calculators/?q=<JS template> (GSC Blocked by robots.txt)
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
  } catch {}

  // Fallback for garbage units (in case _redirects not hit) + legacy drywall path (12 Not found)
  try {
    const decoded = decodeURIComponent(url.pathname);
    const norm = decoded.replace(/\/+$/, "").toLowerCase();
    if (norm === "/ton" || norm === "/ft\u00B2" || norm === "/yd\u00B3" || norm === "/ft") {
      return Response.redirect("https://calculatorst.com/gravel-calculator/", 301);
    }
    if (norm === "/unit" || norm === "/panel" || norm === "/post") {
      return Response.redirect("https://calculatorst.com/gravel-calculator/", 301);
    }
    if (norm === "/construction/drywall") {
      return Response.redirect("https://calculatorst.com/construction/drywall-paint/", 301);
    }
  } catch {}

  return context.next();
}
