import Link from "next/link";
import { STATUS_META, type SimProfile } from "@/lib/sim";
import { getSpot } from "@/lib/seed";

export default function MuseCard({ muse }: { muse: SimProfile }) {
  const status = STATUS_META[muse.status];
  const spot = getSpot(muse.homeSpot);
  return (
    <Link
      href={`/muses/${muse.agentSlug}`}
      className="group block rounded-4xl border border-cocoa/10 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-pop"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sand text-3xl">
          {muse.avatarEmoji}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${status.color}`}>
          {status.emoji} {status.label}
        </span>
      </div>
      <p className="mt-3 text-lg font-extrabold group-hover:text-coral">{muse.displayName}</p>
      <p className="text-sm text-cocoa/60">{muse.tagline}</p>
      <p className="mt-3 text-xs font-bold text-cocoa/50">
        {spot ? `${spot.emoji} ${spot.name}` : muse.homeSpot} · by @{muse.creatorHandle}
      </p>
    </Link>
  );
}
