// Post-build fix for the Build Output config that @astrojs/vercel 8 writes.
//
// The adapter emits its "cache /_astro/* for a year" rule after
// { handle: "filesystem" }. Vercel serves a static file at that step, and the
// routes after it only run when no file matched, so the rule never reached a
// real asset: every hashed file went out as max-age=0, must-revalidate. This
// moves the rule in front of the filesystem handle and adds the site-wide
// security headers there too, which is also where vercel.json `headers` would
// land.
//
// Run from the repo root once the output has been copied (root vercel.json
// buildCommand):
//   node apps/site/far-fusion/scripts/fix-vercel-routes.mjs .vercel/output/config.json
// It is idempotent, and it fails the build when the adapter stops writing the
// rule, so a layout change is noticed instead of silently losing the cache.

import { realpathSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SECURITY_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
});

const SECURITY_ROUTE_SRC = "^/(.*)$";

const isFilesystemHandle = (route) => route?.handle === "filesystem";

// The adapter's rule: `^/_astro/(.*)$` with an immutable cache-control.
const isImmutableAssetRule = (route) =>
  typeof route?.src === "string" &&
  route.src.includes("_astro") &&
  /\bimmutable\b/.test(String(route.headers?.["cache-control"] ?? ""));

const isSecurityRule = (route) =>
  route?.src === SECURITY_ROUTE_SRC &&
  route.continue === true &&
  Object.entries(SECURITY_HEADERS).every(([name, value]) => route.headers?.[name] === value);

/**
 * Returns a copy of the config with the security headers and the immutable
 * /_astro rule ahead of the filesystem handle. Throws if the adapter's rule is
 * missing.
 */
export function fixRoutes(config) {
  if (!Array.isArray(config?.routes)) {
    throw new Error("fix-vercel-routes: config.json has no routes array");
  }

  // Drop an earlier run's header rule so a second run changes nothing.
  const routes = config.routes.filter((route) => !isSecurityRule(route));

  const assetAt = routes.findIndex(isImmutableAssetRule);
  if (assetAt === -1) {
    throw new Error(
      "fix-vercel-routes: @astrojs/vercel no longer writes the immutable /_astro rule. " +
        "Check .vercel/output/config.json before deploying, or hashed assets will not be cached."
    );
  }

  let filesystemAt = routes.findIndex(isFilesystemHandle);
  if (filesystemAt !== -1 && assetAt > filesystemAt) {
    const [assetRule] = routes.splice(assetAt, 1);
    routes.splice(filesystemAt, 0, assetRule);
  }

  // With no filesystem handle every route already runs before the file check.
  filesystemAt = routes.findIndex(isFilesystemHandle);
  const securityRule = { src: SECURITY_ROUTE_SRC, headers: { ...SECURITY_HEADERS }, continue: true };
  routes.splice(filesystemAt === -1 ? 0 : filesystemAt, 0, securityRule);

  return { ...config, routes };
}

async function main(file = ".vercel/output/config.json") {
  const target = path.resolve(file);
  const config = JSON.parse(await readFile(target, "utf8"));
  const fixed = fixRoutes(config);
  // Same layout the adapter writes.
  await writeFile(target, JSON.stringify(fixed, null, "\t"));

  const at = (test) => fixed.routes.findIndex(test);
  console.log(
    `fix-vercel-routes: ${path.relative(process.cwd(), target) || target}: ` +
      `headers at ${at(isSecurityRule)}, /_astro rule at ${at(isImmutableAssetRule)}, ` +
      `filesystem handle at ${at(isFilesystemHandle)}`
  );
}

// import.meta.url is the resolved file while argv[1] is the path as typed, so
// both go through realpath: through a symlinked checkout the script would
// otherwise skip main() and exit 0 without patching anything. Windows can also
// hand the same file over with a different drive-letter case.
const realPath = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};
const normalise = (p) => (process.platform === "win32" ? p.toLowerCase() : p);
const invokedDirectly =
  Boolean(process.argv[1]) &&
  normalise(realPath(process.argv[1])) === normalise(realPath(fileURLToPath(import.meta.url)));

if (invokedDirectly) {
  main(process.argv[2]).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
