import { e as createComponent, f as createAstro, r as renderTemplate, o as renderSlot, p as renderHead, l as renderScript, m as maybeRenderHead, h as addAttribute } from './astro/server_DrfaBzFh.mjs';
import 'clsx';
/* empty css                         */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const {
    title = "Ulsaham Entertainments",
    description = "Celebrate life's biggest milestones with immersive, bespoke event experiences.",
    image = "/meta-share.jpg"
  } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en" class="scroll-smooth"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', `><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><meta name="theme-color" content="#023301"><!-- Non-blocking async font load \u2014 only 2 families, 2 weights each --><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">`, '<noscript><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"></noscript><title>', "</title>", '<script defer src="/_vercel/speed-insights/script.js"><\/script>', '</head> <body class="antialiased"> <main class="relative font-sans" style="overflow-x: clip;"> ', " </main> </body></html>"])), addAttribute(description, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(image, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(image, "content"), maybeRenderHead(), title, renderScript($$result, "/vercel/sandbox/primary/apps/site/far-fusion/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts"), renderHead(), renderSlot($$result, $$slots["default"]));
}, "/vercel/sandbox/primary/apps/site/far-fusion/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
