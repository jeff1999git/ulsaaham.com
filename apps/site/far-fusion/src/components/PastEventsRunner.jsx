import { useState, useEffect, useRef, useCallback } from "react";
import { getEvents } from "../lib/api.js";
import { optimizeCloudinary } from "../lib/image.js";
import { HOME_PAST } from "../lib/page-data.js";
import PastEventsCoverflow from "./PastEventsCoverflow.jsx";

function PastEventsHeading() {
  return (
    <p className="past-runner-heading">
      <span className="past-runner-heading__line" />
      <span>Past Events</span>
      <span className="past-runner-heading__line" />
    </p>
  );
}

// The events slide when there is nothing upcoming and no past poster to show
// either, so it never sits empty. onRetry is set when the past events failed
// to load.
function ComingSoon({ onRetry }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <h2 className="section-title">Our Events</h2>
      <p className="section-subtitle max-w-xl">New events coming soon.</p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <a
          href="/events"
          className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-light/80 transition hover:text-light hover:border-white/30"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}
        >
          View All Events
        </a>
        {onRetry && (
          <button type="button" onClick={onRetry} className="account-btn">
            Couldn't load past events · Retry
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * variant "runner" is the scrolling strip shown under upcoming events;
 * "coverflow" fills the slide when there are none; null waits until the
 * caller knows which, so the section never swaps layouts in front of the visitor.
 * onPosters, if given, hears how many posters there are to show once loaded.
 */
export default function PastEventsRunner({ variant = "runner", onPosters }) {
  const [posters, setPosters] = useState([]);
  // "loading" | "done" | "failed"
  const [state, setState] = useState("loading");
  const [started, setStarted] = useState(false);
  const loadedRef = useRef(0);
  const timerRef = useRef(null);

  const load = useCallback(() => {
    setState("loading");
    getEvents(HOME_PAST).then(({ ok, data }) => {
      if (!ok) { setState("failed"); return; }
      const withBanner = (data?.data?.events ?? []).filter((e) => e.bannerImageUrl);
      setPosters(withBanner);
      setState("done");
    }).catch(() => setState("failed"));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    onPosters?.(posters.length);
  }, [posters.length]);

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

  if (!variant) return null;
  if (posters.length === 0) {
    // Under upcoming events the strip simply stays away; alone on the slide,
    // something has to say why it is empty.
    if (variant !== "coverflow" || state === "loading") return null;
    return <ComingSoon onRetry={state === "failed" ? load : null} />;
  }

  if (variant === "coverflow") {
    return (
      <div className="past-cf-wrap">
        <PastEventsHeading />
        <PastEventsCoverflow posters={posters} />
      </div>
    );
  }

  const items = [...posters, ...posters];

  return (
    <div className="past-runner-wrap">
      <PastEventsHeading />
      <div className="past-runner">
        <div className={`past-runner__track${started ? "" : " past-runner__track--paused"}`}>
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
              </Tag>
            );
          })}
        </div>
      </div>
    </div>
  );
}
