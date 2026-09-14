// Just enough MIME to assert on what a reader would actually see.
//
// Two details matter and both have bitten this suite before: nodemailer folds a
// long Subject into several encoded words and will split one mid-word, so each
// word cannot be decoded on its own; and body parts are quoted-printable with
// soft line breaks, so a plain substring search over the raw message can miss a
// string that is plainly there.

export function decodeQuotedPrintable(text) {
  const joined = text.replace(/=\r?\n/g, "");
  const bytes = [];
  for (let i = 0; i < joined.length; i += 1) {
    if (joined[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(joined.slice(i + 1, i + 3))) {
      bytes.push(parseInt(joined.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(joined.charCodeAt(i) & 0xff);
    }
  }
  return Buffer.from(bytes).toString("utf8");
}

export function decodeWords(value) {
  // Whitespace between two encoded words is layout, not content (RFC 2047).
  let text = value.replace(/\?=[\t ]+=\?/g, "?==?");

  // Join neighbours that share a charset and encoding before decoding, so a
  // word split through the middle of "script" or through a multi-byte
  // character comes back whole.
  const adjacent = /(=\?([^?]+)\?([QqBb])\?)([^?]*)\?=\1([^?]*)\?=/;
  for (let guard = 0; guard < 50 && adjacent.test(text); guard += 1) {
    text = text.replace(adjacent, "$1$4$5?=");
  }

  return text.replace(/=\?([^?]+)\?([QqBb])\?([^?]*)\?=/g, (_, charset, encoding, payload) =>
    encoding.toUpperCase() === "B"
      ? Buffer.from(payload, "base64").toString("utf8")
      : decodeQuotedPrintable(payload.replace(/_/g, " "))
  );
}

function parseHeaders(block) {
  const headers = {};
  const unfolded = block.replace(/\r\n([ \t])/g, "$1");
  for (const line of unfolded.split("\r\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (!(name in headers)) headers[name] = decodeWords(value);
  }
  return headers;
}

export function parseAddress(value) {
  const text = String(value ?? "").trim();
  const angled = text.match(/^(.*)<([^>]*)>$/);
  if (!angled) return { name: "", address: text };
  const name = angled[1].trim().replace(/^"(.*)"$/, "$1").trim();
  return { name, address: angled[2].trim() };
}

function parsePart(raw) {
  const split = raw.indexOf("\r\n\r\n");
  const headers = parseHeaders(split === -1 ? raw : raw.slice(0, split));
  const body = split === -1 ? "" : raw.slice(split + 4);

  const contentType = headers["content-type"] || "text/plain";
  const mime = contentType.split(";")[0].trim().toLowerCase();

  if (mime.startsWith("multipart/")) {
    const found = contentType.match(/boundary="?([^";]+)"?/i);
    const children = [];
    if (found) {
      const chunks = body.split("--" + found[1]);
      for (const chunk of chunks.slice(1)) {
        if (chunk.startsWith("--")) break;
        children.push(parsePart(chunk.replace(/^\r\n/, "").replace(/\r\n$/, "")));
      }
    }
    return { headers, mime, children, text: "", buffer: Buffer.alloc(0) };
  }

  const encoding = (headers["content-transfer-encoding"] || "7bit").toLowerCase();
  let buffer;
  if (encoding === "base64") buffer = Buffer.from(body.replace(/\s+/g, ""), "base64");
  else if (encoding === "quoted-printable") buffer = Buffer.from(decodeQuotedPrintable(body), "utf8");
  else buffer = Buffer.from(body, "utf8");

  return { headers, mime, children: [], text: buffer.toString("utf8"), buffer };
}

function flatten(part, into = []) {
  if (part.children.length) part.children.forEach((child) => flatten(child, into));
  else into.push(part);
  return into;
}

export function parseMail(raw) {
  const root = parsePart(raw);
  const leaves = flatten(root);
  const find = (mime) => leaves.find((part) => part.mime === mime);

  return {
    root,
    headers: root.headers,
    subject: root.headers.subject || "",
    from: parseAddress(root.headers.from),
    to: parseAddress(root.headers.to),
    parts: leaves,
    text: find("text/plain")?.text ?? "",
    html: find("text/html")?.text ?? "",
    attachments: leaves.filter(
      (part) => part.headers["content-id"] || /attachment|inline/.test(part.headers["content-disposition"] || "")
    ),
    /** Every decoded part plus the raw bytes with soft breaks undone. */
    searchable() {
      return [raw.replace(/=\r\n/g, ""), ...leaves.map((part) => part.buffer.toString("latin1")), ...leaves.map((part) => part.text)];
    },
  };
}
