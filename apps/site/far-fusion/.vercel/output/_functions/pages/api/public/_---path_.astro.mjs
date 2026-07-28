export { renderers } from '../../../renderers.mjs';

const BACKEND = "https://ulsaham-admin-panel.vercel.app/api/public";
const NO_FORWARD = ["host", "origin", "referer", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto"];
const ALL = async ({ request, params }) => {
  const path = params.path ?? "";
  const url = new URL(request.url);
  const target = `${BACKEND}/${path}${url.search}`;
  const headers = new Headers(request.headers);
  for (const h of NO_FORWARD) headers.delete(h);
  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? void 0 : request.body,
      // @ts-ignore — needed for streaming POST bodies in Node/Vercel
      duplex: "half"
    });
    return new Response(res.body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store"
      }
    });
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Service temporarily unavailable. Please try again." }),
      {
        status: 503,
        headers: { "content-type": "application/json", "cache-control": "no-store" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  ALL
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
