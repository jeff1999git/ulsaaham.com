export { renderers } from '../../../renderers.mjs';

const BACKEND = "https://ulsaham-admin-panel.vercel.app/api/public";
const ALL = async ({ request, params }) => {
  const path = params.path ?? "";
  const url = new URL(request.url);
  const target = `${BACKEND}/${path}${url.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
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
      "content-type": res.headers.get("content-type") ?? "application/json"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  ALL
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
