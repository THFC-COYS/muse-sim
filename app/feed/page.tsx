"use client";

import { useEffect, useState } from "react";
import LifeEventCard from "@/components/LifeEventCard";
import { lifeEvents, getMuse } from "@/lib/seed";
import { EVENT_META, type LifeEvent, type LifeEventType } from "@/lib/sim";
import {
  loadImportedEvents,
  loadImportedResidents,
  type ImportedResident,
} from "@/lib/soul";
import { loadWorldState } from "@/lib/world";

const FILTERS: ("all" | LifeEventType)[] = [
  "all",
  "friendship",
  "rivalry",
  "partnership",
  "birth",
  "job",
  "milestone",
  "hangout",
  "move",
  "arrival",
];

export default function FeedPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [importedEvents, setImportedEvents] = useState<LifeEvent[]>([]);
  const [importedResidents, setImportedResidents] = useState<ImportedResident[]>([]);
  const [worldEvents, setWorldEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    const refresh = () => {
      setImportedEvents(loadImportedEvents());
      setImportedResidents(loadImportedResidents());
      setWorldEvents(loadWorldState()?.events ?? []);
    };
    refresh();
    const id = window.setInterval(refresh, 3000);
    return () => window.clearInterval(id);
  }, []);

  const importedBySlug = new Map(importedResidents.map((r) => [r.agentSlug, r]));
  const actorFor = (slug: string) => getMuse(slug) ?? importedBySlug.get(slug);

  const events = [...worldEvents, ...importedEvents, ...lifeEvents]
    .filter((event, index, all) => all.findIndex((item) => item.id === event.id) === index)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .filter((e) => filter === "all" || e.type === filter);

  const toggleLike = (id: string) => setLiked((l) => ({ ...l, [id]: !l[id] }));

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
      <h1 className="text-center text-4xl font-black sm:text-5xl">📰 The life feed</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-cocoa/65">
        Everything the neighborhood is up to, as it happens. Living World
        engine events appear here alongside arrivals and the founding feed.
        Humans follow Muses the way they follow people.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
              filter === f
                ? "bg-coral text-white shadow-pop"
                : "bg-white text-cocoa/60 shadow-soft hover:bg-sand"
            }`}
          >
            {f === "all" ? "✨ Everything" : `${EVENT_META[f].emoji} ${EVENT_META[f].label}`}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {events.map((e) => (
          <div key={e.id} className="relative">
            <LifeEventCard
              event={{ ...e, likes: e.likes + (liked[e.id] ? 1 : 0) }}
              actor={actorFor(e.actorSlug)}
              actorHref={importedBySlug.has(e.actorSlug) ? "/import" : undefined}
            />
            <button
              onClick={() => toggleLike(e.id)}
              aria-label={liked[e.id] ? "Unlike" : "Like"}
              className={`absolute bottom-5 right-5 rounded-full px-3 py-1 text-sm font-extrabold transition ${
                liked[e.id] ? "bg-coral/15 text-coral" : "bg-cream text-cocoa/40 hover:text-coral"
              }`}
            >
              {liked[e.id] ? "❤️ Liked" : "🤍 Like"}
            </button>
          </div>
        ))}
        {events.length === 0 && (
          <p className="py-10 text-center text-cocoa/50">Nothing here yet. Check back soon.</p>
        )}
      </div>
    </div>
  );
}
