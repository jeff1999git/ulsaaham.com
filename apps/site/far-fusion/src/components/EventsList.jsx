import { useState, useEffect } from "react";
import { getEvents } from "../lib/api.js";
import EventCard from "./EventCard.jsx";

function Skeletons({ count = 6 }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="event-card-skeleton animate-pulse" />
      ))}
    </div>
  );
}

function Section({ title, params, limit = 12, filter, cardProps, paginate = true }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEvents({ ...params, page, limit }).then(({ ok, data }) => {
      if (cancelled) return;
      if (!ok) { setError(data?.error || "Failed to load events."); setLoading(false); return; }
      setEvents(data.data.events);
      setTotalPages(data.data.totalPages);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setError("Network error. Please check your connection."); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [page]);

  const displayed = filter ? events.filter(filter) : events;

  if (!loading && !error && displayed.length === 0) return null;

  return (
    <div className="mb-16">
      <h2 className="text-xl font-semibold uppercase tracking-[0.2em] text-accent mb-8">{title}</h2>

      {loading && <Skeletons count={3} />}

      {!loading && error && (
        <p className="text-light/40 py-10">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayed.map((ev) => <EventCard key={ev.id} event={ev} {...(cardProps || {})} />)}
        </div>
      )}

      {paginate && totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-4 mt-10">
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

export default function EventsList() {
  return (
    <div>
      <Section title="Featured Events" params={{ featured: true }} limit={12} />
      <Section title="Upcoming Events" params={{ upcoming: true }} limit={12} />
      <Section
        title="Past Events"
        params={{ past: true }}
        limit={6}
        cardProps={{ linkable: false }}
        paginate={true}
      />
    </div>
  );
}
