import { register } from "node:module";
import { appFileUrl } from "./paths.mjs";
import { hasTestEnv } from "./env.mjs";

register("./hooks.mjs", import.meta.url);

let counter = 0;

/**
 * Import one of the site's modules with a private copy of its state.
 *
 * Refuses to run before setTestEnv(), so `node --env-file=.env --test tests/`
 * cannot hand the real SMTP credentials to a test that expects dummies.
 */
export async function loadSource(rel) {
  if (!hasTestEnv()) throw new Error("call setTestEnv() before loadSource()");
  return import(`${appFileUrl(rel)}?v=${++counter}`);
}
