import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  // Fix 404 garbage units parsed as URLs FIRST (GSC 8 URLs: /ton, /ft², /yd³ + http/www + encoded variants)
  // Also handles /construction/drywall old path -> new drywall-paint (seen in both http www + https)
  // Always redirect to https apex to avoid chain (http www -> https apex target in one hop)
  try {
    const decoded = decodeURIComponent(url.pathname);
    const norm = decoded.replace(/\/+$/, "").toLowerCase();
    if (norm === "/ton" || norm === "/ft\u00B2" || norm === "/yd\u00B3") {
      return Response.redirect("https://calculatorst.com/gravel-calculator/", 301);
    }
    if (norm === "/construction/drywall") {
      return Response.redirect("https://calculatorst.com/construction/drywall-paint/", 301);
    }
  } catch { /* ignore decode errors */ }

  // Redirect www to apex (handles 121 Alternate with proper canonical tag - www vs non-www)
  // Also handles http -> https via Cloudflare, but keep as safety
  if (host === "www.calculatorst.com" || host.startsWith("www.")) {
    url.hostname = "calculatorst.com";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  // Force https
  if (url.protocol === "http:") {
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  return next();
};
