import type { APIRoute } from "astro";
import { BACKEND_URL, applyProxyHeaders } from "../../../lib/backend.js";
import { getClientIp } from "../../../lib/rate-limit.js";

const NO_FORWARD = ["host", "origin", "referer", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto"];

export const ALL: APIRoute = async (context) => {
  const { request, params } = context;
  const path = params.path ?? "";
  const url = new URL(request.url);
  const target = `${BACKEND_URL}/${path}${url.search}`;

  const headers = new Headers(request.headers);
  for (const h of NO_FORWARD) headers.delete(h);

  // Relay the visitor's own IP so the backend rate-limits per person, not per
  // proxy egress address shared by every visitor of the site (5 bookings/hour
  // for everyone combined would otherwise block repeat bookings).
  applyProxyHeaders(headers, getClientIp(context));

  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      // @ts-ignore — needed for streaming POST bodies in Node/Vercel
      duplex: "half",
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Service temporarily unavailable. Please try again." }),
      {
        status: 503,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      }
    );
  }
};
