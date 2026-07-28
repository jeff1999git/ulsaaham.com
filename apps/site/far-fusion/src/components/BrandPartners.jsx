import { useState, useEffect } from "react";
import { getBrandPartners } from "../lib/api.js";
import { optimizeCloudinary } from "../lib/image.js";

export default function BrandPartners() {
  const [partners, setPartners] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    getBrandPartners().then(({ ok, data }) => {
      setPartners(ok ? (data?.data?.partners ?? []) : []);
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (partners && partners.length === 0) return null;

  // The marquee works by duplicating the list and scrolling exactly half its
  // width — with only a handful of partners that just makes the repeat obvious
  // (and on mobile the wide item gaps leave long empty stretches as it scrolls),
  // so below this count, or on mobile, show a single static, centered row instead.
  const MIN_FOR_MARQUEE = 6;
  const scrollable = !!partners && partners.length >= MIN_FOR_MARQUEE && !isMobile;
  const items = partners ? (scrollable ? [...partners, ...partners] : partners) : [];

  return (
    <section className="partners-section py-14 md:py-24 text-light relative isolate z-10 border-t border-white/10" id="testimonials">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="section-title">Our Partners</h2>
          <p className="section-subtitle">Brands who trusted us.</p>
        </div>
      </div>
      <div className={`client-carousel${scrollable ? "" : " client-carousel--static"}`}>
        <div className={`client-carousel__track${scrollable ? "" : " client-carousel__track--paused"}`}>
          {partners ? (
            items.map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="client-carousel__item"
                aria-hidden={scrollable && index >= partners.length ? "true" : "false"}
              >
                <img
                  src={optimizeCloudinary(partner.logoUrl, 192)}
                  alt={partner.name}
                  loading="lazy"
                  decoding="async"
                  width="96"
                  height="96"
                />
                <span className="client-carousel__label">{partner.name}</span>
              </div>
            ))
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="client-carousel__item">
                <div className="client-carousel__skeleton animate-pulse" />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
