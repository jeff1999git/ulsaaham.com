import { useState, useEffect, useRef } from "react";
import { getEvents } from "../lib/api.js";
import { optimizeCloudinary } from "../lib/image.js";

export default function PastEventsRunner() {
  const [posters, setPosters] = useState([]);
  const [started, setStarted] = useState(false);
  const loadedRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    getEvents({ past: true, limit: 30 }).then(({ ok, data }) => {
      if (!ok) return;
      const withBanner = (data?.data?.events ?? []).filter((e) => e.bannerImageUrl);
      setPosters(withBanner);
    }).catch(() => {});
  }, []);

  // Fallback: start animation after 2s even if images are slow
  useEffect(() => {
    if (posters.length === 0) return;
    timerRef.current = setTimeout(() => setStarted(true), 2000);
    return () => clearTimeout(timerRef.current);
  }, [posters.length]);

  function handleLoad() {
    loadedRef.current += 1;
    // Start as soon as first 3 images (or all if fewer) are loaded
    const threshold = Math.min(3, posters.length);
    if (!started && loadedRef.current >= threshold) {
      clearTimeout(timerRef.current);
      setStarted(true);
    }
  }

  if (posters.length === 0) return null;

  const items = [...posters, ...posters];

  return (
    <div className="past-runner-wrap">
      <p className="past-runner-heading">
        <span className="past-runner-heading__line" />
        <span>Past Events</span>
        <span className="past-runner-heading__line" />
      </p>
      <div className="past-runner">
        <div className={`past-runner__track${started ? "" : " past-runner__track--paused"}`}>
          {items.map((ev, i) => {
            const isOriginal = i < posters.length;
            return (
              <div
                key={`${ev.id}-${i}`}
                className="past-runner__item"
                aria-hidden={!isOriginal ? "true" : "false"}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
