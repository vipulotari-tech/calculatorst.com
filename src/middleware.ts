import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

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
