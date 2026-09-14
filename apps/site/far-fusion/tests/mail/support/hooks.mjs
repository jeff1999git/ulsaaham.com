// Loader hooks that let the site's own modules run under plain node.
//
// Astro resolves import.meta.env at build time and node has no equivalent, so
// each read is rewritten to process.env before the module is evaluated. The
// alternative, copying the sources somewhere and editing them, drifts from what
// actually ships; this runs the real files.
import { SRC_URL } from "./paths.mjs";

const SRC_PREFIX = SRC_URL.toLowerCase() + "/";
const isSource = (url) => url.toLowerCase().startsWith(SRC_PREFIX);

export async function resolve(specifier, context, nextResolve) {
  const result = await nextResolve(specifier, context);
  // Carry the cache-busting token down the whole graph, so one load gives one
  // private copy of every module in it: its own env snapshot, its own rate
  // limit buckets, its own transporter.
  const parent = context.parentURL ?? "";
  const at = parent.indexOf("?v=");
  if (at !== -1 && isSource(result.url) && !result.url.includes("?")) {
    return { ...result, url: result.url + parent.slice(at), shortCircuit: true };
  }
  return result;
}

const stripComments = (code) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/gm, "$1");

// The two modules this migration owns. A bare import.meta.env in either would
// make the bundler copy the entire build-time environment, SMTP password
// included, into the output, so the suite refuses to run against one.
const GUARDED = ["/lib/mailer.js", "/lib/otp.js"];

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (!isSource(url) || result.format !== "module") return result;

  const original =
    typeof result.source === "string" ? result.source : Buffer.from(result.source).toString("utf8");

  const code = original
    .replace(/\bimport\.meta\.env\.PROD\b/g, '(process.env.NODE_ENV === "production")')
    .replace(/\bimport\.meta\.env\.([A-Za-z_$][\w$]*)/g, "process.env.$1");

  const lower = url.toLowerCase();
  if (GUARDED.some((name) => lower.includes(name)) && /\bimport\.meta\.env\b/.test(stripComments(code))) {
    throw new Error(`bare import.meta.env in ${url}`);
  }

  return { ...result, source: code, shortCircuit: true };
}
