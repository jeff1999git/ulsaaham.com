import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, n as defineScriptVars, m as maybeRenderHead } from '../../chunks/astro/server_DJAJWKax.mjs';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_BIUojYZc.mjs';
/* empty css                                       */
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const prerender = false;
const $$Complete = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Complete;
  const cookieValue = Astro2.cookies.get("google_auth_result")?.value;
  const next = Astro2.url.searchParams.get("next") || "/account";
  let userJson = null;
  if (cookieValue) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookieValue));
      userJson = JSON.stringify(parsed);
      Astro2.cookies.delete("google_auth_result", { path: "/" });
    } catch {
    }
  }
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Signing in\u2026 \u2014 Ulsaham Entertainments", "data-astro-cid-n2p7yvsj": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="min-h-screen bg-primary text-light flex items-center justify-center" data-astro-cid-n2p7yvsj> <div class="text-center space-y-4" data-astro-cid-n2p7yvsj> <div class="auth-spinner" data-astro-cid-n2p7yvsj></div> <p class="text-light/50 text-sm" data-astro-cid-n2p7yvsj>Completing sign-in\u2026</p> </div> </div> <script>(function(){', '\n    if (!userJson) {\n      window.location.replace("/login?error=no_auth_result");\n    } else {\n      try {\n        var googleUser = JSON.parse(userJson);\n        var KEY = "ulsaham_user";\n        var ACCOUNTS_KEY = "ulsaham_accounts";\n        var existing = JSON.parse(localStorage.getItem(KEY) || "null");\n        var merged = (existing && existing.email === googleUser.email)\n          ? Object.assign({}, existing, googleUser)\n          : Object.assign({ tickets: [] }, googleUser);\n        localStorage.setItem(KEY, JSON.stringify(merged));\n        // Update known accounts so re-login after logout routes correctly\n        try {\n          var accts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");\n          accts[merged.email.toLowerCase()] = {\n            name: merged.name,\n            phone: merged.phone,\n            hasGoogle: true,\n            googleId: merged.googleId,\n          };\n          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accts));\n        } catch(e2) {}\n        window.location.replace(next);\n      } catch (e) {\n        window.location.replace("/login?error=auth_failed");\n      }\n    }\n  })();<\/script> '])), maybeRenderHead(), defineScriptVars({ userJson, next })) })} `;
}, "F:/Ulsaaham/webapp/web-app/apps/site/far-fusion/src/pages/auth/complete.astro", void 0);

const $$file = "F:/Ulsaaham/webapp/web-app/apps/site/far-fusion/src/pages/auth/complete.astro";
const $$url = "/auth/complete";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Complete,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
