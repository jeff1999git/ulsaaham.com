import { useState, useEffect } from "react";
import { getEvents } from "../lib/api.js";
import EventCard from "./EventCard.jsx";

const FILTERS = [
  { label: "All Events", params: {} },
  { label: "Upcoming", params: { upcoming: true } },
  { label: "Featured", params: { featured: true } },
];

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEvents({ ...FILTERS[filter].params, page, limit: 12 }).then(({ ok, data }) => {
      if (cancelled) return;
      if (!ok) { setError(data.error || "Failed to load events."); setLoading(false); return; }
      setEvents(data.data.events);
      setTotalPages(data.data.totalPages);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setError("Network error. Please check your connection."); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [filter, page]);

  const changeFilter = (i) => { setFilter(i); setPage(1); };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-10">
        {FILTERS.map((f, i) => (
          <button
            key={f.label}
            onClick={() => changeFilter(i)}
            className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-widest border transition-all ${
              filter === i
                ? "bg-accent text-primary border-accent"
                : "border-light/20 text-light/60 hover:border-accent hover:text-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="event-card-skeleton animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-center text-light/50 py-20">{error}</p>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="text-center text-light/50 py-20">No events found.</p>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => <EventCard key={ev.id} event={ev} />)}
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-5 py-2 rounded-full border border-light/20 text-light/60 text-sm disabled:opacity-30 hover:border-accent hover:text-accent transition"
          >
            ← Prev
          </button>
          <span className="text-light/40 text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-5 py-2 rounded-full border border-light/20 text-light/60 text-sm disabled:opacity-30 hover:border-accent hover:text-accent transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
