import { useState, useEffect, useRef } from "react";
import { getEvents } from "../lib/api.js";
import { EVENTS_FEATURED, EVENTS_UPCOMING, EVENTS_PAST } from "../lib/page-data.js";
import EventCard from "./EventCard.jsx";

/** short: past cards, which have no price line or button. */
function Skeletons({ count = 6, short = false }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`event-card-skeleton event-card-skeleton--card${short ? " event-card-skeleton--short" : ""} animate-pulse`} />
      ))}
    </div>
  );
}

/** One page of a list as { events, totalPages } or { error }. Never rejects. */
function loadPage(query, page) {
  return getEvents({ ...query, page }).then(({ ok, data }) => {
    if (!ok) return { error: data?.error || "Failed to load events." };
    return { events: data.data.events, totalPages: data.data.totalPages };
  }).catch(() => ({ error: "Network error. Please check your connection." }));
}

/**
 * initial: the section's first page, loaded by EventsList.
 * eagerCount: how many leading posters load straight away rather than lazily.
 * priorityFirst: fetch the first poster at high priority (the likely LCP).
 */
function Section({ title, query, initial, filter, cardProps, paginate = true, gridClass = "grid gap-6 md:grid-cols-2 lg:grid-cols-3", eagerCount = 0, priorityFirst = false, shortSkeletons = false }) {
  const [events, setEvents] = useState(initial.events ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initial.error ?? null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initial.totalPages ?? 1);
  // The first page arrives with `initial`; only later pages are fetched here.
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadPage(query, page).then((result) => {
      if (cancelled) return;
      if (result.error) { setError(result.error); setLoading(false); return; }
      setEvents(result.events);
      setTotalPages(result.totalPages);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page]);

  const displayed = filter ? events.filter(filter) : events;
  const hasPager = paginate && totalPages > 1;

  // A page the filter emptied keeps its pager, so the next page stays reachable.
  if (!loading && !error && displayed.length === 0 && !hasPager) return null;

  return (
    <div className="mb-16">
      <h2 className="text-xl font-semibold uppercase tracking-[0.2em] text-accent mb-8">{title}</h2>

      {loading && <Skeletons count={3} short={shortSkeletons} />}

      {!loading && error && (
        <p className="text-light/40 py-10">{error}</p>
      )}

      {!loading && !error && (
        <div className={gridClass}>
          {displayed.map((ev, i) => (
            <EventCard key={ev.id} event={ev} eager={i < eagerCount} priority={priorityFirst && i === 0} {...(cardProps || {})} />
          ))}
        </div>
      )}

      {hasPager && !loading && (
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

// Only the first two posters of each top section load eagerly, and only
// Featured's first gets high priority; Past sits below the fold.
const SECTIONS = [
  { title: "Featured Events", query: EVENTS_FEATURED, eagerCount: 2, priorityFirst: true },
  // The server leaves featured events out (featured=false). The filter only
  // matters while an admin panel that ignores that parameter is live.
  { title: "Upcoming Events", query: EVENTS_UPCOMING, filter: (ev) => !ev.featured, eagerCount: 2 },
  {
    title: "Past Events",
    query: EVENTS_PAST,
    cardProps: { linkable: false },
    gridClass: "grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    shortSkeletons: true,
  },
];

export default function EventsList() {
  // The three first pages load together and appear at once, headings included,
  // so a section that turns out empty never moves the others (no layout shift).
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(SECTIONS.map((section) => loadPage(section.query, 1))).then((pages) => {
      if (!cancelled) setInitial(pages);
    });
    return () => { cancelled = true; };
  }, []);

  if (!initial) {
    return (
      <div className="mb-16" aria-busy="true">
        <Skeletons count={3} />
      </div>
    );
  }

  return (
    <div>
      {SECTIONS.map((section, i) => (
        <Section key={section.title} {...section} initial={initial[i]} />
      ))}
    </div>
  );
}
