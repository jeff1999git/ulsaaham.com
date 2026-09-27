import { useState, useEffect, useRef } from "react";
import { cloudinarySrcSet, optimizeCloudinary } from "../lib/image.js";

const AUTOPLAY_MS = 3000;
const SWIPE_PX = 40;
const ENTRANCE_MS = 1600;
// How long auto-scroll holds after the mouse last moved over a poster.
const HOVER_HOLD_MS = 2500;

// Where a card sits by its distance from the centre. x is a share of the card's
// own width; side cards turn their inner edge away from the viewer, and the
// last row is the parking spot for cards that are out of view.
const LAYOUT = [
  { x: 0, rot: 0, scale: 1, opacity: 1, dim: 0 },
  { x: 66, rot: 30, scale: 0.8, opacity: 1, dim: 0.35 },
  { x: 116, rot: 38, scale: 0.64, opacity: 0.45, dim: 0.55 },
  { x: 150, rot: 42, scale: 0.5, opacity: 0, dim: 0.7 },
];
const VISIBLE = LAYOUT.length - 2;
// A card this close to the centre gets its poster (one step before it shows)
// and its own compositor layer.
const NEAR = VISIBLE + 1;
// The centre card is min(64vw, 44vh, 400px) wide (global.css --cf-w).
const POSTER_WIDTHS = [360, 480, 640];
const POSTER_SIZES = "(min-width: 640px) 400px, 64vw";

// Before the slide is first seen every card waits, hidden, stacked behind the
// centre; on arrival they fan out to their places.
const STACKED = { x: 0, rot: 0, scale: 0.86, opacity: 0, dim: 0.35 };

/** Signed distance from the centre card, going round the shorter way. */
function offsetOf(index, active, count) {
  let d = (index - active + count) % count;
  if (d > count / 2) d -= count;
  return d;
}

export default function PastEventsCoverflow({ posters }) {
  const count = posters.length;
  const [active, setActive] = useState(0);
  // Auto-scroll holds while someone is reaching for a poster with the mouse,
  // or moving through the posters with the keyboard. A cursor merely resting
  // on the strip, or a poster sliding under it, does not count: the strip
  // spans the screen, so a resting cursor would otherwise stop it for good.
  const [reaching, setReaching] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const paused = reaching || keyboardFocus;
  const [inView, setInView] = useState(false);
  const [entered, setEntered] = useState(false);
  const [entering, setEntering] = useState(false);

  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const prevOffsets = useRef([]);
  const touchStart = useRef(null);
  const swiped = useRef(false);
  const holdTimer = useRef(null);
  // Indexes of cards that have come within NEAR of the centre. Only these
  // render a poster src, and keep it, so the slide fetches a handful of
  // posters rather than all of them at once. Filled during render so a card's
  // src lands in the same commit as its move.
  const seenRef = useRef(null);
  seenRef.current ??= new Set();
  for (let k = -NEAR; k <= NEAR; k++) seenRef.current.add((((active + k) % count) + count) % count);

  const step = (dir) => setActive((a) => (a + dir + count) % count);

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  function onPointerMove(e) {
    if (e.pointerType !== "mouse") return;
    clearTimeout(holdTimer.current);
    if (!e.target.closest(".past-cf__card")) { setReaching(false); return; }
    setReaching(true);
    holdTimer.current = setTimeout(() => setReaching(false), HOVER_HOLD_MS);
  }

  function onPointerLeave() {
    clearTimeout(holdTimer.current);
    setReaching(false);
  }

  // The home page moves between slides with transforms, so this is the only
  // reliable way to know the events slide is the one on screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      setEntered(true);
      return;
    }
    let fanned = false;
    let timer;
    let fallback;
    function fanOut() {
      if (fanned) return;
      fanned = true;
      clearTimeout(fallback);
      // Set together, so the cards already carry their staggered delays when
      // they start to move.
      setEntered(true);
      setEntering(true);
      timer = setTimeout(() => setEntering(false), ENTRANCE_MS);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        setInView(entry.isIntersecting && ratio >= 0.35);
        if (fanned) return;
        // Wait for the page's own slide to settle so the fan-out is seen whole.
        // A window too short to ever show 90% of it still gets the fan-out.
        if (ratio >= 0.9) fanOut();
        else if (entry.isIntersecting) fallback ??= setTimeout(fanOut, 900);
        else { clearTimeout(fallback); fallback = undefined; }
      },
      { threshold: [0, 0.35, 0.9] }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, []);

  // Auto-scroll, only while the slide is on screen and nobody is pointing at
  // it. Restarted on every change, so a manual move gets a full pause first.
  useEffect(() => {
    if (count < 2 || paused || !inView || entering) return;
    const timer = setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused, inView, entering, active]);

  // Keyboard users keep their place: focus follows the centre card.
  useEffect(() => {
    if (stageRef.current?.contains(document.activeElement)) {
      cardRefs.current[active]?.focus({ preventScroll: true });
    }
  }, [active]);

  // A horizontal trackpad swipe moves the carousel one card. The page's slide
  // scroller reads any wheel event as vertical, so it must not see this one.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || count < 2) return;
    let locked = false;
    let idle;
    function onWheel(e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(idle);
      idle = setTimeout(() => { locked = false; }, 200);
      if (locked || Math.abs(e.deltaX) < 8) return;
      locked = true;
      setActive((a) => (a + (e.deltaX > 0 ? 1 : -1) + count) % count);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(idle);
    };
  }, [count]);

  useEffect(() => {
    prevOffsets.current = posters.map((_, i) => offsetOf(i, active, count));
  });

  function onTouchStart(e) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e) {
    const start = touchStart.current;
    touchStart.current = null;
    const t = e.changedTouches[0];
    if (!start || !t || count < 2) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
    // A sideways swipe is the carousel's, not a request to change page slide.
    e.stopPropagation();
    swiped.current = true;
    setTimeout(() => { swiped.current = false; }, 400);
    step(dx < 0 ? 1 : -1);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  }

  return (
    <div
      ref={stageRef}
      className={`past-cf${entering ? " past-cf--entering" : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Past events"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      // A mouse click also focuses the poster link; only keyboard focus holds.
      onFocus={(e) => {
        try { if (e.target.matches(":focus-visible")) setKeyboardFocus(true); } catch { /* old browser */ }
      }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setKeyboardFocus(false); }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
    >
      {posters.map((ev, i) => {
        const d = offsetOf(i, active, count);
        const dist = Math.min(Math.abs(d), LAYOUT.length - 1);
        const side = Math.sign(d);
        const spot = entered ? LAYOUT[dist] : STACKED;
        const hidden = dist > VISIBLE;
        // A card that wraps round from one end to the other jumps instead of
        // sliding across the front of the others.
        const prev = prevOffsets.current[i];
        const jumped = prev !== undefined && Math.abs(d - prev) > 1;
        // dist is capped at the parking row, so nearness uses the raw offset.
        const near = Math.abs(d) <= NEAR;
        const seen = seenRef.current.has(i);

        return (
          <a
            key={ev.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            href={`/events/detail?slug=${encodeURIComponent(ev.slug)}`}
            className={`past-cf__card${d === 0 ? " is-active" : ""}${near ? " is-near" : ""}${jumped ? " past-cf__card--instant" : ""}`}
            style={{
              transform: `translateX(${side * spot.x}%) rotateY(${-side * spot.rot}deg) scale(${spot.scale})`,
              opacity: spot.opacity,
              zIndex: LAYOUT.length - dist,
              "--cf-dim": spot.dim,
              // The fan-out: the centre card lands first, then each row outwards.
              transitionDelay: entering ? `${dist * 120}ms` : undefined,
            }}
            aria-hidden={hidden || undefined}
            aria-label={d === 0 ? ev.name : `Show ${ev.name}`}
            tabIndex={d === 0 ? 0 : -1}
            draggable={false}
            onClick={(e) => {
              if (swiped.current) { e.preventDefault(); return; }
              if (d !== 0) { e.preventDefault(); setActive(i); }
            }}
          >
            <img
              src={seen ? optimizeCloudinary(ev.bannerImageUrl, 640) : undefined}
              srcSet={seen ? cloudinarySrcSet(ev.bannerImageUrl, POSTER_WIDTHS) : undefined}
              sizes={POSTER_SIZES}
              alt=""
              loading={dist <= VISIBLE ? "eager" : "lazy"}
              fetchPriority={d === 0 ? "auto" : "low"}
              decoding="async"
              width="400"
              height="500"
              draggable={false}
            />
          </a>
        );
      })}
      <p className="sr-only" aria-live={keyboardFocus ? "polite" : "off"}>
        {posters[active]?.name}, {active + 1} of {count}
      </p>
    </div>
  );
}
