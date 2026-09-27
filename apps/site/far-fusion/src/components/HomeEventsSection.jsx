import { useState } from "react";
import HomeEvents from "./HomeEvents.jsx";
import PastEventsRunner from "./PastEventsRunner.jsx";

// The home page events slide. With upcoming events, past events run as a strip
// beneath them; with none, past events take over the slide as a coverflow.
export default function HomeEventsSection() {
  // "some" | "none" | "error", or null until the upcoming list has loaded.
  const [upcoming, setUpcoming] = useState(null);
  const variant = upcoming === null ? null : upcoming === "none" ? "coverflow" : "runner";

  return (
    <>
      <HomeEvents onResult={setUpcoming} />
      <PastEventsRunner variant={variant} />
    </>
  );
}
