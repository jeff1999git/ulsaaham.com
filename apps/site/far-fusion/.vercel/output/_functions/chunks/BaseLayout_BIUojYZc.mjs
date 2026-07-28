import { e as createComponent, f as createAstro, h as addAttribute, m as maybeRenderHead, o as renderHead, p as renderSlot, r as renderTemplate } from './astro/server_DJAJWKax.mjs';
import 'clsx';
/* empty css                         */

const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const {
    title = "Ulsaham Entertainments",
    description = "Celebrate life's biggest milestones with immersive, bespoke event experiences.",
    image = "/meta-share.jpg"
  } = Astro2.props;
  return renderTemplate`<html lang="en" class="scroll-smooth"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description"${addAttribute(description, "content")}><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:image"${addAttribute(image, "content")}><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"${addAttribute(title, "content")}><meta name="twitter:description"${addAttribute(description, "content")}><meta name="twitter:image"${addAttribute(image, "content")}><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://res.cloudinary.com"><link rel="dns-prefetch" href="//checkout.razorpay.com"><link rel="preload" as="image" href="/brand_logo.avif" type="image/avif"><meta name="theme-color" content="#023301"><!-- Non-blocking async font load — only 2 families, 2 weights each --><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">${maybeRenderHead()}<noscript><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"></noscript><title>${title}</title>${renderHead()}</head> <body class="antialiased"> <main class="relative font-sans" style="overflow-x: clip;"> ${renderSlot($$result, $$slots["default"])} </main> </body></html>`;
}, "F:/Ulsaaham/webapp/web-app/apps/site/far-fusion/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
