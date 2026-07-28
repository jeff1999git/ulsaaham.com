import { useState, useEffect, useRef } from "react";
import { getEvents } from "../lib/api.js";
import { optimizeCloudinary } from "../lib/image.js";

export default function PastEventsRunner() {
  const [posters, setPosters] = useState([]);
  const [started, setStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const loadedRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    getEvents({ past: true, limit: 30 }).then(({ ok, data }) => {
      if (!ok) return;
      const withBanner = (data?.data?.events ?? []).filter((e) => e.bannerImageUrl);
      setPosters(withBanner);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Fallback: start animation after 2s even if images are slow (desktop marquee only —
  // on mobile the wide item gaps would just leave long empty stretches as it scrolls)
  useEffect(() => {
    if (isMobile || posters.length === 0) return;
    timerRef.current = setTimeout(() => setStarted(true), 2000);
    return () => clearTimeout(timerRef.current);
  }, [posters.length, isMobile]);

  function handleLoad() {
    if (isMobile) return;
    loadedRef.current += 1;
    // Start as soon as first 3 images (or all if fewer) are loaded
    const threshold = Math.min(3, posters.length);
    if (!started && loadedRef.current >= threshold) {
      clearTimeout(timerRef.current);
      setStarted(true);
    }
  }

  if (posters.length === 0) return null;

  const scrollable = !isMobile;
  const items = scrollable ? [...posters, ...posters] : posters;

  return (
    <div className="past-runner-wrap">
      <p className="past-runner-heading">
        <span className="past-runner-heading__line" />
        <span>Past Events</span>
        <span className="past-runner-heading__line" />
      </p>
      <div className={`past-runner${scrollable ? "" : " past-runner--static"}`}>
        <div className={`past-runner__track${scrollable && started ? "" : " past-runner__track--paused"}`}>
          {items.map((ev, i) => {
            const isOriginal = i < posters.length;
            const Tag = isOriginal ? "a" : "div";
            const tagProps = isOriginal ? { href: `/events/detail?slug=${ev.slug}` } : { "aria-hidden": "true" };
            return (
              <Tag
                key={`${ev.id}-${i}`}
                className="past-runner__item"
                {...tagProps}
              >
                <img
                  src={optimizeCloudinary(ev.bannerImageUrl, 400)}
                  alt={ev.name}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="auto"
                  width="200"
                  height="267"
                  onLoad={isOriginal ? handleLoad : undefined}
                />
                <div className="past-runner__label">{ev.name}</div>
              </Tag>
            );
          })}
        </div>
      </div>
    </div>
  );
}
