import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { getEvents } from "../lib/api.js";
import { HOME_UPCOMING } from "../lib/page-data.js";
import EventCard from "./EventCard.jsx";

/**
 * onResult, if given, hears "some", "none" or "error" once the list has loaded.
 * fitKey changes whenever something else on the slide changes height (the
 * Past Events strip arriving), so the cards are fitted again.
 */
export default function HomeEvents({ onResult, fitKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // How many cards the slide has room for; the rest become a "+N more" tile.
  const [shown, setShown] = useState(Infinity);
  const rootRef = useRef(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEvents(HOME_UPCOMING).then(({ ok, data }) => {
      if (cancelled) return;
      if (!ok) { setError(data?.error || "Failed to load events."); setLoading(false); onResult?.("error"); return; }
      const list = data?.data?.events ?? [];
      setEvents(list);
      setShown(Infinity);
      setLoading(false);
      onResult?.(list.length ? "some" : "none");
    }).catch(() => {
      if (!cancelled) { setError("Could not load events."); setLoading(false); onResult?.("error"); }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(load, [load]);

  // The home page is a set of fixed full-screen slides that never scroll, so
  // cards that do not fit would be cut off (and the Past Events strip with
  // them). Drop one card at a time until the slide's content fits. This runs
  // before the browser paints, so the extra cards are never seen.
  useLayoutEffect(() => {
    const slide = rootRef.current?.closest(".fp-section");
    const count = Math.min(shown, events.length);
    if (!slide || count <= 1) return;
    if (slide.scrollHeight - slide.clientHeight > 1) setShown(count - 1);
  }, [events, shown, fitKey]);

  // A new window size (a phone turned round) starts the fit again from every card.
  useEffect(() => {
    let frame = 0;
    let size = `${window.innerWidth}x${window.innerHeight}`;
    const onResize = () => {
      const next = `${window.innerWidth}x${window.innerHeight}`;
      if (next === size) return;
      size = next;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setShown(Infinity));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  // No upcoming events and nothing went wrong — past events carry this section instead
  if (!loading && !error && events.length === 0) return null;

  const visible = events.slice(0, shown);
  const more = events.length - visible.length;

  return (
    <div ref={rootRef} className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="section-title">Our Events</h2>
          <p className="section-subtitle max-w-xl">Upcoming events you can be part of.</p>
        </div>
        <a
          href="/events"
          className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-light/80 transition hover:text-light hover:border-white/30"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}
        >
          View All Events
        </a>
      </div>

      {loading ? (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="event-card-skeleton animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-12 py-16 text-center">
          <p className="text-light/40">{error}</p>
          <button type="button" onClick={load} className="account-btn mt-4">Retry</button>
        </div>
      ) : (
        <div className="home-events-grid grid gap-6 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
          {/* These cards sit on the second slide, off screen at load, so they
              stay lazy. The poster slot is 110-160 px wide: 360 px is enough
              even for a 3x phone screen. */}
          {visible.map((ev) => (
            <EventCard key={ev.id} event={ev} layout="horizontal" imgWidth={360} />
          ))}
          {more > 0 && (
            <a href="/events" className="home-events-more">
              <span className="home-events-more__count">+{more} more</span>
              <span className="home-events-more__cta">View All Events →</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
