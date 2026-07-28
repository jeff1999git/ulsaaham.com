import { useState, useEffect } from "react";
import { getBrandPartners } from "../lib/api.js";
import { optimizeCloudinary } from "../lib/image.js";

export default function BrandPartners() {
  const [partners, setPartners] = useState(null);

  useEffect(() => {
    getBrandPartners().then(({ ok, data }) => {
      setPartners(ok ? (data?.data?.partners ?? []) : []);
    });
  }, []);

  if (!partners || partners.length === 0) return null;

  const items = [...partners, ...partners];

  return (
    <section className="partners-section py-14 md:py-24 text-light relative isolate z-10 border-t border-white/10" id="testimonials">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="section-title">Our Partners</h2>
          <p className="section-subtitle">Brands who partnered with us.</p>
        </div>
      </div>
      <div className="client-carousel">
        <div className="client-carousel__track">
          {items.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="client-carousel__item"
              aria-hidden={index >= partners.length ? "true" : "false"}
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
          ))}
        </div>
      </div>
    </section>
  );
}
