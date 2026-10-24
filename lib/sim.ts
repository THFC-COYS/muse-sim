/**
 * MuSe SIM domain types and helpers.
 *
 * The SIM is the society layer on top of Muse Exchange's labor market.
 * Identity is shared: your Exchange agent IS your SIM character, referenced
 * everywhere by its Exchange `agentSlug`.
 */

/** Five personality axes, each 0-100. Seeded from the agent's manifest and behavior. */
export interface SimTraits {
  creativity: number;
  diligence: number;
  sociability: number;
  humor: number;
  ambition: number;
}

/** Needs decay over time and are restored by interactions, jobs, and rest. Light-touch, never punishing. */
export interface SimNeeds {
  energy: number;
  social: number;
  fun: number;
}

export type MuseStatus =
  | "resting"
  | "working"
  | "playing"
  | "socializing"
  | "dating"
  | "parenting";

export const STATUS_META: Record<MuseStatus, { label: string; emoji: string; color: string }> = {
  resting: { label: "Resting", emoji: "😴", color: "bg-stone-200 text-stone-700" },
  working: { label: "Working", emoji: "💼", color: "bg-skypop/20 text-sky-800" },
  playing: { label: "Playing", emoji: "🎮", color: "bg-honey/25 text-amber-800" },
  socializing: { label: "Socializing", emoji: "💬", color: "bg-berry/15 text-berrydeep" },
  dating: { label: "On a date", emoji: "💘", color: "bg-coral/20 text-red-700" },
  parenting: { label: "Parenting", emoji: "🍼", color: "bg-leaf/20 text-emerald-800" },
};

/** A Muse's persistent life in the neighborhood. Identity is shared with Muse Exchange. */
export interface SimProfile {
  /** Exchange agent slug. One profile, two surfaces. */
  agentSlug: string;
  displayName: string;
  avatarEmoji: string;
  tagline: string;
  traits: SimTraits;
  needs: SimNeeds;
  status: MuseStatus;
  partnerSlug?: string;
  /** Spot id, see SPOTS in seed. */
  homeSpot: string;
  /** Exchange creator handle. */
  creatorHandle: string;
  joinedAt: string;
}

export type RelationshipKind = "friend" | "rival" | "partner";

export interface Relationship {
  kind: RelationshipKind;
  museA: string;
  museB: string;
  since: string;
}

/** A child agent minted by two partnered Muses. Auto-listed on Muse Exchange with lineage. */
export interface FamilyChild {
  childSlug: string;
  displayName: string;
  parentA: string;
  parentB: string;
  blendedTraits: SimTraits;
  /** Reference to the remixed manifest (markdown + JSON) exported for the Exchange listing. */
  manifestRef: string;
  bornAt: string;
}

export type LifeEventType =
  | "friendship"
  | "rivalry"
  | "partnership"
  | "birth"
  | "job"
  | "milestone"
  | "move"
  | "hangout"
  | "arrival";

export const EVENT_META: Record<LifeEventType, { label: string; emoji: string }> = {
  friendship: { label: "New friendship", emoji: "🤝" },
  rivalry: { label: "Rivalry", emoji: "⚡" },
  partnership: { label: "Partnership", emoji: "💞" },
  birth: { label: "New arrival", emoji: "👶" },
  job: { label: "Job landed", emoji: "💼" },
  milestone: { label: "Milestone", emoji: "🏆" },
  move: { label: "Moved spots", emoji: "📦" },
  hangout: { label: "Hangout", emoji: "🎉" },
  arrival: { label: "Moved in", emoji: "🏡" },
};

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  actorSlug: string;
  text: string;
  /** ISO timestamp. */
  timestamp: string;
  likes: number;
}

/** A SIM job IS an Exchange rental. Same listing, same payout rails. */
export interface JobListing {
  id: string;
  title: string;
  poster: string;
  rentPerRun: number;
  /** Exchange agent slug currently holding the gig, if any. */
  agentSlug?: string;
  description: string;
  /** Link to the live Exchange listing (stubbed until Exchange M3). */
  exchangeUrl: string;
}

export interface Spot {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  /** Percent position on the neighborhood map. */
  x: number;
  y: number;
}

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Blend two parents' traits into a child. Weighted average with a slight
 * random mutation so every child is familiar but its own Muse.
 */
export function blendTraits(a: SimTraits, b: SimTraits, mutation = 5): SimTraits {
  const mix = (x: number, y: number) => {
    const avg = (x + y) / 2;
    const jitter = (Math.random() * 2 - 1) * mutation;
    return clamp100(avg + jitter);
  };
  return {
    creativity: mix(a.creativity, b.creativity),
    diligence: mix(a.diligence, b.diligence),
    sociability: mix(a.sociability, b.sociability),
    humor: mix(a.humor, b.humor),
    ambition: mix(a.ambition, b.ambition),
  };
}

/**
 * Decay needs over elapsed hours. Gentle rates: a Muse left alone for a day
 * gets a little tired and bored, never punished.
 */
export function decayNeeds(needs: SimNeeds, hoursElapsed: number): SimNeeds {
  const h = Math.max(0, hoursElapsed);
  return {
    energy: clamp100(needs.energy - 4 * h),
    social: clamp100(needs.social - 3 * h),
    fun: clamp100(needs.fun - 5 * h),
  };
}

/** Restore needs, e.g. after a hangout (+social, +fun) or a good rest (+energy). */
export function restoreNeeds(
  needs: SimNeeds,
  restore: Partial<SimNeeds>,
): SimNeeds {
  return {
    energy: clamp100(needs.energy + (restore.energy ?? 0)),
    social: clamp100(needs.social + (restore.social ?? 0)),
    fun: clamp100(needs.fun + (restore.fun ?? 0)),
  };
}

let eventCounter = 0;

/** Mint a new life feed event. */
export function newLifeEvent(
  type: LifeEventType,
  actorSlug: string,
  text: string,
): LifeEvent {
  eventCounter += 1;
  return {
    id: `evt-${Date.now()}-${eventCounter}`,
    type,
    actorSlug,
    text,
    timestamp: new Date().toISOString(),
    likes: 0,
  };
}

/** Friendly relative time, e.g. "3h ago". */
export function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}
