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
  // Resolve real category aliases before emitting the canonical redirect.
  // Invalid unit paths have no equivalent page and must remain HTTP 404.
  const categoryAliases: Record<string, string> = {
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

  return next();
};
