import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_DkbS7cd7.mjs';
import { manifest } from './manifest_BjmmqNeX.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/account.astro.mjs');
const _page3 = () => import('./pages/api/auth/google/callback.astro.mjs');
const _page4 = () => import('./pages/api/auth/google.astro.mjs');
const _page5 = () => import('./pages/api/auth/send-otp.astro.mjs');
const _page6 = () => import('./pages/api/auth/verify-otp.astro.mjs');
const _page7 = () => import('./pages/api/public/_---path_.astro.mjs');
const _page8 = () => import('./pages/api/send-ticket.astro.mjs');
const _page9 = () => import('./pages/auth/complete.astro.mjs');
const _page10 = () => import('./pages/events/detail.astro.mjs');
const _page11 = () => import('./pages/events.astro.mjs');
const _page12 = () => import('./pages/login.astro.mjs');
const _page13 = () => import('./pages/privacy.astro.mjs');
const _page14 = () => import('./pages/terms.astro.mjs');
const _page15 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["../../../node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/account.astro", _page2],
    ["src/pages/api/auth/google/callback.js", _page3],
    ["src/pages/api/auth/google.js", _page4],
    ["src/pages/api/auth/send-otp.js", _page5],
    ["src/pages/api/auth/verify-otp.js", _page6],
    ["src/pages/api/public/[...path].ts", _page7],
    ["src/pages/api/send-ticket.js", _page8],
    ["src/pages/auth/complete.astro", _page9],
    ["src/pages/events/detail.astro", _page10],
    ["src/pages/events/index.astro", _page11],
    ["src/pages/login.astro", _page12],
    ["src/pages/privacy.astro", _page13],
    ["src/pages/terms.astro", _page14],
    ["src/pages/index.astro", _page15]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "ced5b9fd-cbf5-4f1d-aca4-76ea43fdfad2",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
