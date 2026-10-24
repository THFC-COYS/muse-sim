import Link from "next/link";
import { EVENT_META, timeAgo, type LifeEvent, type SimProfile } from "@/lib/sim";

export default function LifeEventCard({
  event,
  actor,
  actorHref,
}: {
  event: LifeEvent;
  actor?: SimProfile;
  /** Override for actors without a static profile page (imported souls). */
  actorHref?: string;
}) {
  const meta = EVENT_META[event.type];
  return (
    <article className="rounded-4xl border border-cocoa/10 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand text-2xl">
          {actor?.avatarEmoji ?? meta.emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">
            {actor ? (
              <Link href={actorHref ?? `/muses/${actor.agentSlug}`} className="hover:text-coral">
                {actor.displayName}
              </Link>
            ) : (
              event.actorSlug
            )}
          </p>
          <p className="text-xs font-bold text-cocoa/50">
            {meta.emoji} {meta.label} · {timeAgo(event.timestamp)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed">{event.text}</p>
      <p className="mt-3 text-sm font-bold text-cocoa/50">❤️ {event.likes}</p>
    </article>
  );
}
