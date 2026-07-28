import { useState, useEffect } from "react";
import { getEvents } from "../lib/api.js";
import EventCard from "./EventCard.jsx";

export default function HomeEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getEvents({ upcoming: true, limit: 8 }).then(({ ok, data }) => {
      if (cancelled) return;
      if (!ok) { setError(data?.error || "Failed to load events."); setLoading(false); return; }
      setEvents(data?.data?.events ?? []);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setError("Could not load events."); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  // No upcoming events and nothing went wrong — let the past events runner carry this section instead
  if (!loading && !error && events.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="section-title">Our Events</h2>
          <p className="section-subtitle max-w-xl">Upcoming events you can be part of.</p>
        </div>
        <a
          href="/events"
          className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-light/80 transition hover:text-light hover:border-white/30"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
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
        <p className="mt-12 text-center text-light/40 py-16">{error}</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {events.map((ev, i) => (
            <EventCard key={ev.id} event={ev} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
