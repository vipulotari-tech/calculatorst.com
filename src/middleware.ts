import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  // Fix 404 garbage units parsed as URLs FIRST (GSC 8 URLs: /ton, /ft², /yd³ + http/www + encoded variants)
  // Also handles /construction/drywall old path -> new drywall-paint (seen in both http www + https)
  // Always redirect to https apex to avoid chain (http www -> https apex target in one hop)
  // Fix junk search query leakage: GSC reports /calculators/?q=<template> literally
  // (JS template placeholder leaked to Googlebot via naive JS parsing).
  // Redirect those to clean /calculators/ with 301. Handles both raw and encoded forms.
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
        // Preserve other params? For calculators, just strip the junk q
        url.searchParams.delete("q");
        // If pathname is /calculators or /calculators/ keep it, else redirect to /calculators/
        const cleanPath = url.pathname.startsWith("/calculators") ? url.pathname : "/calculators/";
        const redirectUrl = new URL(cleanPath, "https://calculatorst.com");
        redirectUrl.pathname = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";
        // Keep non-junk params if any
        for (const [k, v] of url.searchParams.entries()) redirectUrl.searchParams.set(k, v);
        return Response.redirect(redirectUrl.toString(), 301);
      }
    }
  } catch { /* ignore */ }

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
