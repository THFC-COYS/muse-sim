import Link from "next/link";
import ImportedResidents from "@/components/ImportedResidents";
import { spots, muses, getMuse } from "@/lib/seed";
import { STATUS_META } from "@/lib/sim";

/** Small deterministic offsets so Muses sharing a spot do not stack. */
const OFFSETS: [number, number][] = [
  [-7, -9],
  [7, -9],
  [-7, 9],
  [7, 9],
  [0, -12],
  [0, 12],
];

export default function NeighborhoodPage() {
  const bySpot = new Map<string, typeof muses>();
  for (const m of muses) {
    const list = bySpot.get(m.homeSpot) ?? [];
    list.push(m);
    bySpot.set(m.homeSpot, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="text-center text-4xl font-black sm:text-5xl">🏡 The neighborhood</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-cocoa/65">
        Six spots, {muses.length} Muses, one endless afternoon. Tap a Muse to
        visit their profile.
      </p>

      {/* Map */}
      <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-4xl border border-cocoa/10 bg-gradient-to-b from-skypop/25 via-leaf/20 to-sand shadow-soft sm:aspect-[16/9]">
        {/* paths */}
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          <line x1="50%" y1="10%" x2="50%" y2="48%" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity="0.8" />
          <line x1="20%" y1="32%" x2="80%" y2="30%" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity="0.8" />
          <line x1="28%" y1="74%" x2="70%" y2="72%" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity="0.8" />
          <line x1="50%" y1="48%" x2="28%" y2="74%" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
          <line x1="50%" y1="48%" x2="70%" y2="72%" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        </svg>

        {spots.map((spot) => (
          <div
            key={spot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <div className="rounded-3xl border border-cocoa/10 bg-white/90 px-4 py-2 shadow-soft backdrop-blur">
              <p className="text-2xl">{spot.emoji}</p>
              <p className="whitespace-nowrap text-xs font-extrabold">{spot.name}</p>
            </div>
            {(bySpot.get(spot.id) ?? []).map((m, i) => {
              const [ox, oy] = OFFSETS[i % OFFSETS.length];
              const status = STATUS_META[m.status];
              return (
                <Link
                  key={m.agentSlug}
                  href={`/muses/${m.agentSlug}`}
                  title={`${m.displayName}, ${status.label}`}
                  className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-honey text-2xl shadow-pop transition hover:scale-110"
                  style={{ left: `${ox}%`, top: `calc(${oy}% - 46px)` }}
                >
                  {m.avatarEmoji}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Spot cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spots.map((spot) => {
          const residents = bySpot.get(spot.id) ?? [];
          return (
            <div key={spot.id} className="rounded-4xl border border-cocoa/10 bg-white p-5 shadow-soft">
              <p className="text-3xl">{spot.emoji}</p>
              <p className="mt-2 font-extrabold">{spot.name}</p>
              <p className="text-sm text-cocoa/60">{spot.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {residents.map((m) => (
                  <Link
                    key={m.agentSlug}
                    href={`/muses/${m.agentSlug}`}
                    className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold hover:bg-honey/40"
                  >
                    {m.avatarEmoji} {m.displayName}
                  </Link>
                ))}
                {residents.length === 0 && (
                  <p className="text-xs font-bold text-cocoa/40">Quiet right now.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* The visitor's own imported souls */}
      <ImportedResidents heading="Your Muses, alive in this neighborhood" />

      {/* All muses, for completeness */}
      <div className="mt-10">
        <h2 className="text-2xl font-black">Everyone who lives here</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {muses.map((m) => {
            const full = getMuse(m.agentSlug)!;
            return (
              <Link
                key={m.agentSlug}
                href={`/muses/${m.agentSlug}`}
                className="rounded-full border border-cocoa/10 bg-white px-4 py-2 text-sm font-extrabold shadow-soft hover:border-coral"
              >
                {full.avatarEmoji} {full.displayName}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
