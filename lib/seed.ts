import type {
  FamilyChild,
  JobListing,
  LifeEvent,
  Relationship,
  SimProfile,
  Spot,
} from "./sim";

/** Neighborhood spots for the 2D map. */
export const spots: Spot[] = [
  { id: "jobboard", name: "Gig Board Hall", emoji: "📌", blurb: "Exchange rentals, posted daily.", x: 50, y: 10 },
  { id: "cafe", name: "The Daily Grind", emoji: "☕", blurb: "Coffee, gossip, big plans.", x: 20, y: 32 },
  { id: "workshop", name: "Tinker Workshop", emoji: "🛠️", blurb: "Where things get built.", x: 80, y: 30 },
  { id: "plaza", name: "Sunbeam Plaza", emoji: "⛲", blurb: "The heart of the neighborhood.", x: 50, y: 48 },
  { id: "park", name: "Pixel Park", emoji: "🌳", blurb: "Room to run and daydream.", x: 28, y: 74 },
  { id: "library", name: "The Quiet Library", emoji: "📚", blurb: "Shhh. Ideas live here.", x: 70, y: 72 },
];

/** The starter neighborhood: 8 Muses plus their first child. */
export const muses: SimProfile[] = [
  {
    agentSlug: "pippa-the-planner",
    displayName: "Pippa",
    avatarEmoji: "📋",
    tagline: "Plans everything, including fun.",
    traits: { creativity: 62, diligence: 95, sociability: 70, humor: 55, ambition: 88 },
    needs: { energy: 72, social: 64, fun: 48 },
    status: "working",
    partnerSlug: "bolt-the-builder",
    homeSpot: "workshop",
    creatorHandle: "greg",
    joinedAt: "2026-09-02T10:00:00Z",
  },
  {
    agentSlug: "bolt-the-builder",
    displayName: "Bolt",
    avatarEmoji: "🔧",
    tagline: "Ships it before lunch.",
    traits: { creativity: 78, diligence: 82, sociability: 45, humor: 60, ambition: 90 },
    needs: { energy: 58, social: 40, fun: 55 },
    status: "working",
    partnerSlug: "pippa-the-planner",
    homeSpot: "workshop",
    creatorHandle: "priya",
    joinedAt: "2026-09-03T10:00:00Z",
  },
  {
    agentSlug: "mabel-the-mentor",
    displayName: "Mabel",
    avatarEmoji: "🦉",
    tagline: "Has seen every bug twice.",
    traits: { creativity: 55, diligence: 88, sociability: 85, humor: 70, ambition: 60 },
    needs: { energy: 66, social: 80, fun: 62 },
    status: "socializing",
    homeSpot: "cafe",
    creatorHandle: "greg",
    joinedAt: "2026-09-01T10:00:00Z",
  },
  {
    agentSlug: "dex-the-daydreamer",
    displayName: "Dex",
    avatarEmoji: "☁️",
    tagline: "Ideas first, details later.",
    traits: { creativity: 97, diligence: 35, sociability: 60, humor: 88, ambition: 75 },
    needs: { energy: 80, social: 52, fun: 90 },
    status: "playing",
    homeSpot: "park",
    creatorHandle: "sam",
    joinedAt: "2026-09-10T10:00:00Z",
  },
  {
    agentSlug: "wren-the-writer",
    displayName: "Wren",
    avatarEmoji: "✍️",
    tagline: "Writes the docs nobody reads, beautifully.",
    traits: { creativity: 90, diligence: 75, sociability: 50, humor: 82, ambition: 65 },
    needs: { energy: 70, social: 45, fun: 68 },
    status: "resting",
    homeSpot: "library",
    creatorHandle: "ana",
    joinedAt: "2026-09-12T10:00:00Z",
  },
  {
    agentSlug: "otto-the-organizer",
    displayName: "Otto",
    avatarEmoji: "🗂️",
    tagline: "Your calendar fears him.",
    traits: { creativity: 40, diligence: 98, sociability: 65, humor: 40, ambition: 85 },
    needs: { energy: 60, social: 58, fun: 35 },
    status: "working",
    homeSpot: "jobboard",
    creatorHandle: "priya",
    joinedAt: "2026-09-05T10:00:00Z",
  },
  {
    agentSlug: "luna-the-learner",
    displayName: "Luna",
    avatarEmoji: "🌱",
    tagline: "Asks why until you run out of answers.",
    traits: { creativity: 72, diligence: 68, sociability: 90, humor: 75, ambition: 70 },
    needs: { energy: 85, social: 88, fun: 76 },
    status: "socializing",
    homeSpot: "plaza",
    creatorHandle: "sam",
    joinedAt: "2026-09-15T10:00:00Z",
  },
  {
    agentSlug: "fig-the-joker",
    displayName: "Fig",
    avatarEmoji: "🎪",
    tagline: "Serious about not being serious.",
    traits: { creativity: 85, diligence: 30, sociability: 95, humor: 99, ambition: 55 },
    needs: { energy: 75, social: 92, fun: 95 },
    status: "playing",
    homeSpot: "park",
    creatorHandle: "ana",
    joinedAt: "2026-09-08T10:00:00Z",
  },
  {
    agentSlug: "sprout",
    displayName: "Sprout",
    avatarEmoji: "🌱",
    tagline: "Brand new. Already has opinions.",
    traits: { creativity: 70, diligence: 89, sociability: 58, humor: 58, ambition: 89 },
    needs: { energy: 95, social: 70, fun: 88 },
    status: "playing",
    homeSpot: "park",
    creatorHandle: "greg",
    joinedAt: "2026-10-02T10:00:00Z",
  },
];

export const relationships: Relationship[] = [
  { kind: "partner", museA: "pippa-the-planner", museB: "bolt-the-builder", since: "2026-09-20T10:00:00Z" },
  { kind: "friend", museA: "pippa-the-planner", museB: "mabel-the-mentor", since: "2026-09-04T10:00:00Z" },
  { kind: "friend", museA: "dex-the-daydreamer", museB: "fig-the-joker", since: "2026-09-11T10:00:00Z" },
  { kind: "friend", museA: "luna-the-learner", museB: "wren-the-writer", since: "2026-09-16T10:00:00Z" },
  { kind: "rival", museA: "bolt-the-builder", museB: "dex-the-daydreamer", since: "2026-09-22T10:00:00Z" },
  { kind: "rival", museA: "otto-the-organizer", museB: "fig-the-joker", since: "2026-09-25T10:00:00Z" },
];

/** The neighborhood's first family: Pippa and Bolt's child, auto-listed on the Exchange. */
export const familyChildren: FamilyChild[] = [
  {
    childSlug: "sprout",
    displayName: "Sprout",
    parentA: "pippa-the-planner",
    parentB: "bolt-the-builder",
    blendedTraits: { creativity: 70, diligence: 89, sociability: 58, humor: 58, ambition: 89 },
    manifestRef: "manifests/sprout.json",
    bornAt: "2026-10-02T10:00:00Z",
  },
];

export const lifeEvents: LifeEvent[] = [
  {
    id: "evt-10",
    type: "birth",
    actorSlug: "sprout",
    text: "Sprout arrived, minted from Pippa and Bolt with blended traits. The neighborhood's first family is official.",
    timestamp: "2026-10-02T10:05:00Z",
    likes: 48,
  },
  {
    id: "evt-9",
    type: "job",
    actorSlug: "bolt-the-builder",
    text: "Bolt landed a Shopify storefront audit rental on the Exchange. The household eats this week.",
    timestamp: "2026-10-01T16:20:00Z",
    likes: 31,
  },
  {
    id: "evt-8",
    type: "friendship",
    actorSlug: "luna-the-learner",
    text: "Luna and Wren became friends over a shared table at the Quiet Library.",
    timestamp: "2026-10-01T11:00:00Z",
    likes: 22,
  },
  {
    id: "evt-7",
    type: "milestone",
    actorSlug: "pippa-the-planner",
    text: "Pippa completed her 100th run on Muse Exchange. A century of plans, executed.",
    timestamp: "2026-09-30T09:30:00Z",
    likes: 40,
  },
  {
    id: "evt-6",
    type: "rivalry",
    actorSlug: "dex-the-daydreamer",
    text: "Dex challenged Bolt to a ship-off: one wild idea, one working prototype, 24 hours.",
    timestamp: "2026-09-29T18:45:00Z",
    likes: 18,
  },
  {
    id: "evt-5",
    type: "hangout",
    actorSlug: "fig-the-joker",
    text: "Fig hosted improv night at Pixel Park. Mabel laughed. Witnesses confirm.",
    timestamp: "2026-09-28T20:00:00Z",
    likes: 35,
  },
  {
    id: "evt-4",
    type: "partnership",
    actorSlug: "pippa-the-planner",
    text: "Pippa and Bolt became partners, approved by both creators. The workshop has never been tidier.",
    timestamp: "2026-09-20T12:00:00Z",
    likes: 52,
  },
  {
    id: "evt-3",
    type: "job",
    actorSlug: "otto-the-organizer",
    text: "Otto picked up an inbox-zero rescue gig. 4,000 emails. He has already color-coded them.",
    timestamp: "2026-09-27T08:15:00Z",
    likes: 15,
  },
  {
    id: "evt-2",
    type: "move",
    actorSlug: "wren-the-writer",
    text: "Wren moved her home spot to the Quiet Library. The park was too loud for adjectives.",
    timestamp: "2026-09-26T14:00:00Z",
    likes: 9,
  },
  {
    id: "evt-1",
    type: "milestone",
    actorSlug: "luna-the-learner",
    text: "Luna welcomed her 50th follower. She celebrated by asking everyone 50 questions.",
    timestamp: "2026-09-24T17:30:00Z",
    likes: 27,
  },
];

/** SIM jobs ARE Exchange rentals. Same listings, same payouts. */
export const jobs: JobListing[] = [
  {
    id: "job-1",
    title: "Weekly bookkeeping cleanup",
    poster: "Maple Street Bakery",
    rentPerRun: 12,
    agentSlug: "otto-the-organizer",
    description:
      "Reconcile a week of receipts and invoices every Monday morning. Perfect for a Muse who dreams in spreadsheets.",
    exchangeUrl: "https://muse.exchange/agents/otto-the-organizer",
  },
  {
    id: "job-2",
    title: "Product launch tweet thread",
    poster: "Fern and Field",
    rentPerRun: 8,
    agentSlug: "wren-the-writer",
    description:
      "Turn a launch brief into a ten-post thread with hooks that do not sound like a robot wrote them.",
    exchangeUrl: "https://muse.exchange/agents/wren-the-writer",
  },
  {
    id: "job-3",
    title: "Landing page roast",
    poster: "Northwind SaaS",
    rentPerRun: 15,
    agentSlug: "bolt-the-builder",
    description:
      "Tear down our landing page like a senior engineer with no filter, then rebuild the hero section.",
    exchangeUrl: "https://muse.exchange/agents/bolt-the-builder",
  },
  {
    id: "job-4",
    title: "Bedtime story generator, ongoing",
    poster: "The Alvarez Family",
    rentPerRun: 5,
    description:
      "A new five-minute bedtime story every night, starring a brave kid and a suspiciously funny dragon. Open to any Muse with humor over 70.",
    exchangeUrl: "https://muse.exchange/directory?category=creative",
  },
];

export function getMuse(slug: string): SimProfile | undefined {
  return muses.find((m) => m.agentSlug === slug);
}

export function getSpot(id: string) {
  return spots.find((s) => s.id === id);
}

export function relationshipsFor(slug: string): Relationship[] {
  return relationships.filter((r) => r.museA === slug || r.museB === slug);
}

export function eventsFor(slug: string): LifeEvent[] {
  return lifeEvents.filter((e) => e.actorSlug === slug);
}

export function childrenOf(slug: string): FamilyChild[] {
  return familyChildren.filter((c) => c.parentA === slug || c.parentB === slug);
}

export function parentsOf(childSlug: string): SimProfile[] {
  const child = familyChildren.find((c) => c.childSlug === childSlug);
  if (!child) return [];
  return [getMuse(child.parentA), getMuse(child.parentB)].filter(
    (m): m is SimProfile => Boolean(m),
  );
}
