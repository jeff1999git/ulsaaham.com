import { BACKEND_URL, applyProxyHeaders } from "../../../lib/backend.js";
import { getClientIp } from "../../../lib/rate-limit.js";
import { edgePolicy, cacheHeaders } from "../../../lib/edge-cache.js";

const NO_FORWARD = ["host", "origin", "referer", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto"];
// Reads also drop the browser's validators, so the admin panel always answers
// with a full body the CDN can keep, never a 304.
const NO_FORWARD_READ = ["if-none-match", "if-modified-since"];

// A read that has not finished by then ends in a clear error instead of a
// spinner. Writes keep the platform's limit: a payment verification must not
// be cut short.
const READ_TIMEOUT_MS = 8000;

// Statuses whose response may not carry a body, not even an empty one.
const NULL_BODY = new Set([101, 103, 204, 205, 304]);

const jsonError = (status, error) =>
  new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** @type {import("astro").APIRoute} */
export const ALL = async (context) => {
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

  if (request.method === "GET" || request.method === "HEAD") {
    for (const h of NO_FORWARD_READ) headers.delete(h);
    return read(request, target, headers, path, url.search);
  }

  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      body: request.body,
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
    return jsonError(503, "Service temporarily unavailable. Please try again.");
  }
};

/**
 * GET and HEAD. The body is read in full before answering: the JSON is a few
 * KB, the timeout then covers the body as well as the headers, and the CDN
 * stores a complete response.
 */
async function read(request, target, headers, path, search) {
  let res;
  let body = null;
  try {
    res = await fetch(target, {
      method: request.method,
      headers,
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
    if (request.method !== "HEAD" && !NULL_BODY.has(res.status)) body = await res.arrayBuffer();
  } catch (err) {
    if (err?.name === "TimeoutError") {
      return jsonError(504, "The server took too long to respond. Please try again.");
    }
    return jsonError(503, "Service temporarily unavailable. Please try again.");
  }

  // Only JSON is stored: an HTML page the fetch reached through a redirect (a
  // login or platform page) must not stand in for the data until it expires.
  const isJson = /json/i.test(res.headers.get("content-type") ?? "");
  const profile = isJson ? edgePolicy(request.method, path, search, res.status, request.headers) : null;
  return new Response(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
      ...cacheHeaders(profile),
    },
  });
}
