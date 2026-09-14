/**
 * Cloudflare Pages Function — edge 301 for 121 Alternate fix
 * Runs before static assets on Pages (calculatorst.pages.dev + custom domain calculatorst.com).
 * Astro src/middleware.ts only runs for SSR, not for static Pages assets — this handles hostname at edge.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname.toLowerCase();

  // www → apex + http → https in one hop (covers 114 http www + 6 https www + 1 http apex = 121)
  if (hostname === "www.calculatorst.com" || hostname.startsWith("www.")) {
    url.hostname = "calculatorst.com";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  if (url.protocol === "http:") {
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  // Fallback for garbage units (in case _redirects not hit) + legacy drywall path
  try {
    const decoded = decodeURIComponent(url.pathname);
    const norm = decoded.replace(/\/+$/, "").toLowerCase();
    if (norm === "/ton" || norm === "/ft\u00B2" || norm === "/yd\u00B3") {
      return Response.redirect("https://calculatorst.com/gravel-calculator/", 301);
    }
    if (norm === "/construction/drywall") {
      return Response.redirect("https://calculatorst.com/construction/drywall-paint/", 301);
    }
  } catch {}

  return context.next();
}
