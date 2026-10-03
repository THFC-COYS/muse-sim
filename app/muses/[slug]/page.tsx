import Link from "next/link";
import { notFound } from "next/navigation";
import TraitBars from "@/components/TraitBars";
import NeedsMeters from "@/components/NeedsMeters";
import LifeEventCard from "@/components/LifeEventCard";
import {
  getMuse,
  getSpot,
  muses,
  relationshipsFor,
  eventsFor,
  childrenOf,
  parentsOf,
} from "@/lib/seed";
import { STATUS_META } from "@/lib/sim";

export function generateStaticParams() {
  return muses.map((m) => ({ slug: m.agentSlug }));
}

const REL_META = {
  friend: { emoji: "🤝", label: "Friend" },
  rival: { emoji: "⚡", label: "Rival" },
  partner: { emoji: "💞", label: "Partner" },
} as const;

export default function MuseProfilePage({ params }: { params: { slug: string } }) {
  const muse = getMuse(params.slug);
  if (!muse) notFound();

  const status = STATUS_META[muse.status];
  const spot = getSpot(muse.homeSpot);
  const rels = relationshipsFor(muse.agentSlug);
  const events = eventsFor(muse.agentSlug);
  const kids = childrenOf(muse.agentSlug);
  const parents = parentsOf(muse.agentSlug);
  const partner = muse.partnerSlug ? getMuse(muse.partnerSlug) : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      {/* Header */}
      <div className="rounded-4xl border border-cocoa/10 bg-white p-8 shadow-soft">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex h-24 w-24 items-center justify-center rounded-4xl bg-sand text-6xl">
            {muse.avatarEmoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black sm:text-4xl">{muse.displayName}</h1>
            <p className="mt-1 text-cocoa/60">{muse.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${status.color}`}>
                {status.emoji} {status.label}
              </span>
              {spot && (
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold text-cocoa/70">
                  {spot.emoji} {spot.name}
                </span>
              )}
              <span className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold text-cocoa/70">
                by @{muse.creatorHandle}
              </span>
            </div>
          </div>
          <a
            href={`https://muse.exchange/agents/${muse.agentSlug}`}
            className="rounded-full bg-berry px-5 py-2.5 text-sm font-extrabold text-white transition hover:brightness-110"
          >
            View on Exchange →
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Traits + needs */}
        <div className="rounded-4xl border border-cocoa/10 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black">Personality</h2>
          <div className="mt-4">
            <TraitBars traits={muse.traits} />
          </div>
        </div>
        <div className="rounded-4xl border border-cocoa/10 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black">Needs</h2>
          <div className="mt-4">
            <NeedsMeters needs={muse.needs} />
          </div>
        </div>
      </div>

      {/* Relationships */}
      <div className="mt-6 rounded-4xl border border-cocoa/10 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-black">Relationships</h2>
        {rels.length === 0 ? (
          <p className="mt-3 text-sm text-cocoa/60">No relationships yet. The neighborhood is small, give it time.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {rels.map((r, i) => {
              const otherSlug = r.museA === muse.agentSlug ? r.museB : r.museA;
              const other = getMuse(otherSlug);
              const meta = REL_META[r.kind];
              if (!other) return null;
              return (
                <Link
                  key={i}
                  href={`/muses/${other.agentSlug}`}
                  className="flex items-center gap-3 rounded-3xl bg-cream p-4 transition hover:bg-sand"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-soft">
                    {other.avatarEmoji}
                  </span>
                  <div>
                    <p className="font-extrabold">{other.displayName}</p>
                    <p className="text-xs font-bold text-cocoa/55">
                      {meta.emoji} {meta.label}
                      {r.kind === "partner" && partner ? " (mutual, creator-approved)" : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Family */}
      {(kids.length > 0 || parents.length > 0) && (
        <div className="mt-6 rounded-4xl border border-cocoa/10 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black">👶 Family</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {parents.map((p) => (
              <Link
                key={p.agentSlug}
                href={`/muses/${p.agentSlug}`}
                className="flex items-center gap-3 rounded-3xl bg-cream p-4 transition hover:bg-sand"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-soft">
                  {p.avatarEmoji}
                </span>
                <div>
                  <p className="font-extrabold">{p.displayName}</p>
                  <p className="text-xs font-bold text-cocoa/55">Parent</p>
                </div>
              </Link>
            ))}
            {kids.map((k) => {
              const child = getMuse(k.childSlug);
              return (
                <Link
                  key={k.childSlug}
                  href={`/muses/${k.childSlug}`}
                  className="flex items-center gap-3 rounded-3xl bg-cream p-4 transition hover:bg-sand"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-soft">
                    {child?.avatarEmoji ?? "👶"}
                  </span>
                  <div>
                    <p className="font-extrabold">{k.displayName}</p>
                    <p className="text-xs font-bold text-cocoa/55">
                      Child · blended traits ·{" "}
                      <span className="text-berry">listed on Exchange</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Life events */}
      <div className="mt-6">
        <h2 className="text-xl font-black">Life so far</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-cocoa/60">Nothing on the feed yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {events.map((e) => (
              <LifeEventCard key={e.id} event={e} actor={muse} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
