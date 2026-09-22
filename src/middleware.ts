import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  // Fix junk search query leakage FIRST (before host redirect) so www URLs also get cleaned
  // GSC reports /calculators/?q=<JS template> literally (GSC Blocked by robots.txt)
  try {
    const q = url.searchParams.get("q");
    if (q !== null) {
      const decodedQ = (() => { try { return decodeURIComponent(q); } catch { return q; }})();
      const isJunk =
        decodedQ.includes("$" + "{") ||
        decodedQ.includes("%24%7B") ||
        decodedQ.includes("encodeURIComponent") ||
        decodedQ.includes("{search_term_string}") ||
        decodedQ.includes("$" + "{encode");
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

  // Fix 404 garbage units parsed as URLs (GSC 8 URLs: /ton, /ft², /yd³, /ft, /unit, /panel, /post)
  // Also keeps legacy /construction/drywall → drywall-paint for old crawls
  // Always redirect to https apex with trailing slash to avoid chain
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
  } catch { /* ignore decode errors */ }

  // Redirect www to apex — with trailing-slash normalization to prevent 2-hop chain
  if (host === "www.calculatorst.com" || host.startsWith("www.")) {
    const redirectUrl = new URL(url);
    redirectUrl.hostname = "calculatorst.com";
    redirectUrl.protocol = "https:";
    // Normalize trailing slash to match Astro's trailingSlash: 'always'
    if (!redirectUrl.pathname.endsWith("/") && !redirectUrl.pathname.includes(".")) {
      redirectUrl.pathname += "/";
    }
    return Response.redirect(redirectUrl.toString(), 301);
  }

  // Force https
  if (url.protocol === "http:") {
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  return next();
};
