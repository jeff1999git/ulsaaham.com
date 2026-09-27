import { useState, useEffect, useCallback } from "react";
import { getBrandPartners } from "../lib/api.js";
import { optimizeCloudinary } from "../lib/image.js";

export default function BrandPartners() {
  const [partners, setPartners] = useState(null);
  const [failed, setFailed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const load = useCallback(() => {
    setPartners(null);
    setFailed(false);
    getBrandPartners().then(({ ok, data }) => {
      if (ok) setPartners(data?.data?.partners ?? []);
      else setFailed(true);
    }).catch(() => setFailed(true));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // The slide stays in the pager whatever happens, so an empty or failed list
  // gets a line of its own rather than a blank screen.
  const empty = failed || (partners && partners.length === 0);

  // The marquee works by duplicating the list and scrolling exactly half its
  // width — with only a handful of partners that just makes the repeat obvious
  // (and on mobile the wide item gaps leave long empty stretches as it scrolls),
  // so below this count, or on mobile, show a single static, centered row instead.
  const MIN_FOR_MARQUEE = 6;
  const scrollable = !!partners && partners.length >= MIN_FOR_MARQUEE && !isMobile;
  const items = partners ? (scrollable ? [...partners, ...partners] : partners) : [];

  return (
    <section className="partners-section pt-16 sm:pt-24 pb-6 md:pb-10 text-light relative isolate z-10 border-t border-white/10" id="testimonials">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="section-title">Our Partners</h2>
          <p className="section-subtitle">Brands who trusted us.</p>
        </div>
      </div>
      {empty ? (
        <div className="client-carousel client-carousel--empty">
          {failed ? (
            <>
              <p>Couldn't load our partners.</p>
              <button type="button" onClick={load} className="account-btn">Retry</button>
            </>
          ) : (
            <>
              <p>Your brand could be the first here.</p>
              <a href="#connect" className="client-carousel__cta">Partner with us</a>
            </>
          )}
        </div>
      ) : (
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
      )}
    </section>
  );
}
