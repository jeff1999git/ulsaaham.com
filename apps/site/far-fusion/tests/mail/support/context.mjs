// Stand-ins for the pieces of Astro a route handler touches.

export function makeCookieJar(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    sets: [],
    deletes: [],
    get(name) {
      return store.has(name) ? { value: store.get(name) } : undefined;
    },
    set(name, value, options) {
      store.set(name, value);
      this.sets.push({ name, value, options });
    },
    delete(name, options) {
      store.delete(name);
      this.deletes.push({ name, options });
    },
    value(name) {
      return store.get(name);
    },
    last(name) {
      const written = this.sets.filter((entry) => entry.name === name);
      return written[written.length - 1];
    },
  };
}

export function makeContext({
  path = "/api/test",
  body,
  raw,
  origin = "https://www.ulsaaham.com",
  referer,
  ip = "203.0.113.10",
  cookies,
  headers = {},
} = {}) {
  const sent = { "content-type": "application/json", ...headers };
  if (origin) sent.origin = origin;
  if (referer) sent.referer = referer;

  return {
    clientAddress: ip,
    cookies: cookies ?? makeCookieJar(),
    request: new Request("https://www.ulsaaham.com" + path, {
      method: "POST",
      headers: sent,
      body: raw !== undefined ? raw : JSON.stringify(body ?? {}),
    }),
  };
}

export async function readJson(response) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return { status: response.status, headers: response.headers, body, text };
}
