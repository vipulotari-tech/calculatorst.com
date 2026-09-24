import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  // Canonicalize junk search URLs, host, protocol and trailing slash in one hop.
  let redirectNeeded = false;
  try {
    const q = url.searchParams.get("q");
    if (q !== null) {
      const decodedQ = (() => { try { return decodeURIComponent(q); } catch { return q; } })();
      const isJunk = decodedQ.includes("$" + "{") || decodedQ.includes("%24%7B") || decodedQ.includes("encodeURIComponent") || decodedQ.includes("{search_term_string}");
      if (isJunk) {
        url.searchParams.delete("q");
        redirectNeeded = true;
      }
    }
  } catch { /* keep serving if query parsing fails */ }

  if (host !== "calculatorst.com") {
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

  return next();
};
