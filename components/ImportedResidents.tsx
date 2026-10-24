"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSpot } from "@/lib/seed";
import { loadImportedResidents, type ImportedResident } from "@/lib/soul";

/**
 * The visitor's own imported Muses, read from localStorage.
 * Renders nothing until at least one soul has moved in, so the seeded
 * neighborhood looks exactly as before for everyone else.
 */
export default function ImportedResidents({
  heading = "Your Muses, alive here",
}: {
  heading?: string;
}) {
  const [residents, setResidents] = useState<ImportedResident[]>([]);

  useEffect(() => {
    setResidents(loadImportedResidents());
  }, []);

  if (residents.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">{heading}</h2>
        <Link href="/import" className="text-sm font-extrabold text-coral hover:underline">
          Bring another →
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {residents.map((r) => {
          const spot = getSpot(r.homeSpot);
          return (
            <div
              key={r.agentSlug}
              className="rounded-4xl border border-cocoa/10 bg-white p-5 shadow-soft"
            >
              <div className="flex items-start justify-between">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-3xl text-3xl"
                  style={{ backgroundColor: r.avatarColor }}
                >
                  {r.avatarEmoji}
                </span>
                <span className="rounded-full bg-berry/15 px-3 py-1 text-xs font-extrabold text-berrydeep">
                  🪪 Imported soul
                </span>
              </div>
              <p className="mt-3 text-lg font-extrabold">{r.displayName}</p>
              <p className="text-sm text-cocoa/60">{r.tagline}</p>
              <p className="mt-3 text-xs font-bold text-cocoa/50">
                {spot ? `${spot.emoji} Hangs out at ${spot.name}` : r.homeSpot} · 🎙️{" "}
                {r.tone} · by @you
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
