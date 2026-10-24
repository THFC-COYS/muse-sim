/**
 * Living World engine for MuSe SIM.
 *
 * This is a deterministic, front-end simulation. It builds on the scaffold's
 * resident model, five traits, five needs, neighborhood spots, Exchange jobs,
 * relationships, and life events. The engine itself has no browser or React
 * dependencies; browser persistence helpers live at the bottom of the file.
 */

import type {
  JobListing,
  LifeEvent,
  LifeEventType,
  MuseStatus,
  Relationship,
  SimNeeds,
  SimProfile,
  SimTraits,
  Spot,
} from "./sim";

export type WorldNeedKey = keyof SimNeeds;
export type ResidentOrigin = "stock" | "imported";

export interface WorldProfile extends SimProfile {
  origin: ResidentOrigin;
  jobId?: string;
  jobTitle?: string;
  tone?: string;
  avatarColor?: string;
}

export interface WorldLocation extends Spot {
  kind: "shared" | "home";
  residentSlug?: string;
}

export type ActivityCategory =
  | "rest"
  | "social"
  | "fun"
  | "creative"
  | "comfort"
  | "work";

export interface ActivityDefinition {
  id: string;
  label: string;
  category: ActivityCategory;
  locations: string[];
  durationMinutes: number;
  effects: Partial<SimNeeds>;
  affinities: Partial<SimTraits>;
  skill?: string;
  jobLinked?: boolean;
  social?: boolean;
  rest?: boolean;
}

export interface ResidentWorldState {
  slug: string;
  locationId: string;
  activityId: string | null;
  activityLabel: string;
  activityRemainingMinutes: number;
  activityDurationMinutes: number;
  status: MuseStatus;
  needs: SimNeeds;
  skills: Record<string, number>;
  skillEventLevels: Record<string, number>;
  completions: number;
  workShifts: number;
  workMilestoneAnnounced: boolean;
  partnerSlug?: string;
  suggestionActivityId?: string;
  suggestionExpiresTick: number;
  lastCollapseTick: number;
  homePosition: { x: number; y: number };
}

export interface RelationshipWorldState {
  a: string;
  b: string;
  score: number;
  interactions: number;
  lastInteractionTick: number;
  announcedFriend: boolean;
  announcedClose: boolean;
  announcedRival: boolean;
  announcedPartner: boolean;
}

export interface WorldState {
  version: 1;
  seed: number;
  rngState: number;
  tick: number;
  day: number;
  minuteOfDay: number;
  eventCounter: number;
  residents: Record<string, ResidentWorldState>;
  relationships: Record<string, RelationshipWorldState>;
  jobAssignments: Record<string, string>;
  jobTitles: Record<string, string>;
  events: LifeEvent[];
}

export interface WorldData {
  jobs: JobListing[];
  relationships: Relationship[];
}

export const EMPTY_WORLD_DATA: WorldData = { jobs: [], relationships: [] };

/** Canonical shared spots. lib/seed re-exports these as its neighborhood map. */
export const BASE_SPOTS: Spot[] = [
  { id: "jobboard", name: "Gig Board Hall", emoji: "📌", blurb: "Exchange rentals, posted daily.", x: 50, y: 10 },
  { id: "cafe", name: "The Daily Grind", emoji: "☕", blurb: "Coffee, gossip, big plans.", x: 20, y: 32 },
  { id: "workshop", name: "Tinker Workshop", emoji: "🛠️", blurb: "Where things get built.", x: 80, y: 30 },
  { id: "plaza", name: "Sunbeam Plaza", emoji: "⛲", blurb: "The heart of the neighborhood.", x: 50, y: 48 },
  { id: "park", name: "Pixel Park", emoji: "🌳", blurb: "Room to run and daydream.", x: 28, y: 74 },
  { id: "library", name: "The Quiet Library", emoji: "📚", blurb: "Shhh. Ideas live here.", x: 70, y: 72 },
];

export const WORLD_STORAGE_KEY = "musesim.livingWorld.v1";
export const WORLD_START_MINUTE = 8 * 60;
const WORLD_EPOCH = Date.UTC(2026, 9, 24, 8, 0, 0);
const MAX_EVENTS = 140;

export const MARKET_SPOT: Spot = {
  id: "market",
  name: "Moon Market Stall",
  emoji: "🧺",
  blurb: "Snacks, flowers, and neighborhood news.",
  x: 86,
  y: 56,
};

export const SHARED_LOCATIONS: WorldLocation[] = [
  ...BASE_SPOTS.map((spot) => ({ ...spot, kind: "shared" as const })),
  { ...MARKET_SPOT, kind: "shared" as const },
];

const HOME_POSITIONS = [
  { x: 8, y: 12 },
  { x: 92, y: 12 },
  { x: 8, y: 88 },
  { x: 92, y: 88 },
  { x: 34, y: 7 },
  { x: 66, y: 7 },
  { x: 12, y: 56 },
  { x: 88, y: 82 },
  { x: 50, y: 92 },
  { x: 22, y: 90 },
  { x: 78, y: 90 },
  { x: 94, y: 38 },
];

export const NEED_KEYS: WorldNeedKey[] = [
  "energy",
  "social",
  "fun",
  "creativity",
  "comfort",
];

const DECAY_PER_HOUR: Record<WorldNeedKey, number> = {
  energy: 3.6,
  social: 2.7,
  fun: 4.1,
  creativity: 2.4,
  comfort: 3.1,
};

export const ACTIVITY_CATALOG: ActivityDefinition[] = [
  {
    id: "sleep",
    label: "Sleep at home",
    category: "rest",
    locations: ["home"],
    durationMinutes: 180,
    effects: { energy: 64, comfort: 12, creativity: 3, social: -3, fun: -2 },
    affinities: { diligence: 0.15 },
    rest: true,
  },
  {
    id: "nap",
    label: "Take a power nap",
    category: "rest",
    locations: ["home", "park", "library"],
    durationMinutes: 45,
    effects: { energy: 29, comfort: 9 },
    affinities: { diligence: 0.1 },
    rest: true,
  },
  {
    id: "coffee-chat",
    label: "Chat over coffee",
    category: "social",
    locations: ["cafe", "plaza"],
    durationMinutes: 35,
    effects: { social: 27, fun: 9, comfort: 7, energy: 3 },
    affinities: { sociability: 0.75, humor: 0.25 },
    social: true,
  },
  {
    id: "plaza-mingle",
    label: "Mingle at Sunbeam Plaza",
    category: "social",
    locations: ["plaza"],
    durationMinutes: 45,
    effects: { social: 33, fun: 13, creativity: 4 },
    affinities: { sociability: 0.9, humor: 0.3 },
    social: true,
  },
  {
    id: "share-meal",
    label: "Share a meal",
    category: "comfort",
    locations: ["cafe", "market", "home"],
    durationMinutes: 40,
    effects: { comfort: 27, social: 15, energy: 7, fun: 5 },
    affinities: { sociability: 0.45 },
    social: true,
  },
  {
    id: "browse-market",
    label: "Browse the Moon Market",
    category: "fun",
    locations: ["market"],
    durationMinutes: 40,
    effects: { fun: 17, social: 11, creativity: 7, comfort: 11 },
    affinities: { creativity: 0.35, sociability: 0.35 },
    social: true,
  },
  {
    id: "workshop-build",
    label: "Build at the Tinker Workshop",
    category: "creative",
    locations: ["workshop"],
    durationMinutes: 75,
    effects: { creativity: 26, fun: 8, comfort: -3 },
    affinities: { creativity: 0.75, diligence: 0.55 },
    skill: "Building",
  },
  {
    id: "work-shift",
    label: "Work an Exchange shift",
    category: "work",
    locations: ["jobboard", "workshop", "cafe", "park"],
    durationMinutes: 90,
    effects: { creativity: 7, social: 4, fun: 2, energy: -7, comfort: -4 },
    affinities: { diligence: 0.65, ambition: 0.6 },
    skill: "Career",
    jobLinked: true,
  },
  {
    id: "gig-prep",
    label: "Prepare for the next gig",
    category: "work",
    locations: ["jobboard"],
    durationMinutes: 45,
    effects: { creativity: 11, comfort: 3 },
    affinities: { ambition: 0.65, diligence: 0.5 },
    skill: "Career",
  },
  {
    id: "park-play",
    label: "Play at Pixel Park",
    category: "fun",
    locations: ["park"],
    durationMinutes: 50,
    effects: { fun: 31, social: 14, creativity: 11, energy: -3 },
    affinities: { humor: 0.75, sociability: 0.4 },
    skill: "Play",
    social: true,
  },
  {
    id: "daydream",
    label: "Daydream and sketch",
    category: "creative",
    locations: ["park", "library"],
    durationMinutes: 45,
    effects: { creativity: 27, fun: 11, energy: 4 },
    affinities: { creativity: 0.9 },
    skill: "Imagination",
  },
  {
    id: "library-read",
    label: "Read at the Quiet Library",
    category: "creative",
    locations: ["library"],
    durationMinutes: 60,
    effects: { creativity: 23, comfort: 8, fun: 7 },
    affinities: { creativity: 0.55, diligence: 0.45 },
    skill: "Research",
  },
  {
    id: "quiet-recharge",
    label: "Recharge in the quiet",
    category: "comfort",
    locations: ["library", "home"],
    durationMinutes: 50,
    effects: { energy: 13, comfort: 23, creativity: 6 },
    affinities: { diligence: 0.2 },
  },
  {
    id: "relax-home",
    label: "Relax at home",
    category: "comfort",
    locations: ["home"],
    durationMinutes: 50,
    effects: { comfort: 31, fun: 9, energy: 6 },
    affinities: { sociability: -0.1 },
  },
  {
    id: "home-project",
    label: "Work on a home project",
    category: "creative",
    locations: ["home"],
    durationMinutes: 70,
    effects: { creativity: 23, fun: 11, comfort: 7 },
    affinities: { creativity: 0.65, diligence: 0.35 },
    skill: "Making",
  },
  {
    id: "mentor-circle",
    label: "Join a mentor circle",
    category: "social",
    locations: ["cafe", "library", "plaza"],
    durationMinutes: 50,
    effects: { social: 25, creativity: 9, fun: 6 },
    affinities: { sociability: 0.6, diligence: 0.3 },
    skill: "Mentoring",
    social: true,
  },
];

export function getActivity(id: string | null | undefined): ActivityDefinition | undefined {
  return ACTIVITY_CATALOG.find((activity) => activity.id === id);
}

export function relationshipKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Advance a mulberry32 style seeded RNG stored directly in world state. */
export function nextRandom(state: WorldState): number {
  state.rngState = (state.rngState + 0x6d2b79f5) | 0;
  let t = state.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function worldTimestamp(tick: number): string {
  return new Date(WORLD_EPOCH + tick * 60_000).toISOString();
}

function syncClock(state: WorldState): void {
  const absolute = WORLD_START_MINUTE + state.tick;
  state.day = Math.floor(absolute / 1440) + 1;
  state.minuteOfDay = absolute % 1440;
}

export function formatWorldClock(state: WorldState): string {
  const hour24 = Math.floor(state.minuteOfDay / 60);
  const minute = state.minuteOfDay % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `Day ${state.day} · ${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function isNight(state: WorldState): boolean {
  return state.minuteOfDay < 6 * 60 || state.minuteOfDay >= 20 * 60;
}

export function isEvening(state: WorldState): boolean {
  return state.minuteOfDay >= 17 * 60 && state.minuteOfDay < 20 * 60;
}

export function jobTitleForState(state: WorldState, slug: string): string | undefined {
  const jobId = state.jobAssignments[slug];
  return jobId ? state.jobTitles[jobId] : undefined;
}

function initialJobAssignments(
  profiles: WorldProfile[],
  jobList: JobListing[],
): Record<string, string> {
  const assignments: Record<string, string> = {};
  for (const job of jobList) {
    if (job.agentSlug) assignments[job.agentSlug] = job.id;
  }

  const openJobs = jobList.filter((job) => !job.agentSlug);
  for (const job of openJobs) {
    const candidates = profiles
      .filter((profile) => !assignments[profile.agentSlug])
      .map((profile) => {
        let fit = profile.traits.ambition + profile.traits.diligence;
        if (/humor over 70/i.test(job.description) && profile.traits.humor > 70) fit += 45;
        if (/spreadsheet|bookkeeping/i.test(job.description)) fit += profile.traits.diligence;
        if (/thread|writ/i.test(job.title)) fit += profile.traits.creativity;
        return { slug: profile.agentSlug, fit };
      })
      .sort((a, b) => b.fit - a.fit);
    if (candidates[0]) assignments[candidates[0].slug] = job.id;
  }

  for (const profile of profiles) {
    if (profile.jobId) assignments[profile.agentSlug] = profile.jobId;
  }
  return assignments;
}

function defaultNeeds(profile: WorldProfile): SimNeeds {
  return {
    energy: clamp100(profile.needs.energy),
    social: clamp100(profile.needs.social),
    fun: clamp100(profile.needs.fun),
    creativity: clamp100(profile.needs.creativity ?? profile.traits.creativity),
    comfort: clamp100(profile.needs.comfort ?? 68),
  };
}

function initialLocation(profile: WorldProfile): string {
  if (profile.status === "resting") return profile.homeSpot === "library" ? "library" : "home";
  return profile.homeSpot;
}

export function homeLocationId(slug: string): string {
  return `home-${slug}`;
}

function createResidentState(
  profile: WorldProfile,
  index: number,
): ResidentWorldState {
  const resident: ResidentWorldState = {
    slug: profile.agentSlug,
    locationId: initialLocation(profile),
    activityId: null,
    activityLabel: "Settling in",
    activityRemainingMinutes: 0,
    activityDurationMinutes: 0,
    status: profile.status,
    needs: defaultNeeds(profile),
    skills: {},
    skillEventLevels: {},
    completions: 0,
    workShifts: 0,
    workMilestoneAnnounced: false,
    partnerSlug: profile.partnerSlug,
    suggestionExpiresTick: 0,
    lastCollapseTick: -9999,
    homePosition: HOME_POSITIONS[index % HOME_POSITIONS.length],
  };
  return resident;
}

function initialRelationships(
  profiles: WorldProfile[],
  relationshipList: Relationship[],
): Record<string, RelationshipWorldState> {
  const bySlug = new Map(profiles.map((profile) => [profile.agentSlug, profile]));
  const out: Record<string, RelationshipWorldState> = {};

  for (const rel of relationshipList) {
    if (!bySlug.has(rel.museA) || !bySlug.has(rel.museB)) continue;
    const score = rel.kind === "partner" ? 92 : rel.kind === "friend" ? 38 : -28;
    out[relationshipKey(rel.museA, rel.museB)] = {
      a: rel.museA,
      b: rel.museB,
      score,
      interactions: rel.kind === "partner" ? 24 : 7,
      lastInteractionTick: 0,
      announcedFriend: rel.kind === "friend" || rel.kind === "partner",
      announcedClose: rel.kind === "partner",
      announcedRival: rel.kind === "rival",
      announcedPartner: rel.kind === "partner",
    };
  }

  for (const profile of profiles) {
    if (!profile.partnerSlug || !bySlug.has(profile.partnerSlug)) continue;
    const key = relationshipKey(profile.agentSlug, profile.partnerSlug);
    if (!out[key]) {
      out[key] = {
        a: profile.agentSlug,
        b: profile.partnerSlug,
        score: 92,
        interactions: 24,
        lastInteractionTick: 0,
        announcedFriend: true,
        announcedClose: true,
        announcedRival: false,
        announcedPartner: true,
      };
    }
  }
  return out;
}

/** Create a reproducible founding world for the supplied resident profiles. */
export function createWorld(
  profiles: WorldProfile[],
  seed = 20261024,
  data: WorldData = EMPTY_WORLD_DATA,
): WorldState {
  const assignments = initialJobAssignments(profiles, data.jobs);
  const state: WorldState = {
    version: 1,
    seed,
    rngState: seed | 0,
    tick: 0,
    day: 1,
    minuteOfDay: WORLD_START_MINUTE,
    eventCounter: 1,
    residents: {},
    relationships: initialRelationships(profiles, data.relationships),
    jobAssignments: assignments,
    jobTitles: Object.fromEntries(data.jobs.map((job) => [job.id, job.title])),
    events: [],
  };

  profiles.forEach((profile, index) => {
    state.residents[profile.agentSlug] = createResidentState(profile, index);
  });
  profiles.forEach((profile) => {
    const resident = state.residents[profile.agentSlug];
    const activity = chooseNextActivity(state, profile, resident);
    assignActivity(state, profile, resident, activity);
  });
  syncClock(state);
  return state;
}

/** Add newly imported residents and remove residents who have left the population. */
export function syncWorldPopulation(
  previous: WorldState,
  profiles: WorldProfile[],
  data: WorldData = EMPTY_WORLD_DATA,
): WorldState {
  const state = clone(previous);
  const wanted = new Set(profiles.map((profile) => profile.agentSlug));

  for (const slug of Object.keys(state.residents)) {
    if (!wanted.has(slug)) delete state.residents[slug];
  }
  for (const key of Object.keys(state.relationships)) {
    const rel = state.relationships[key];
    if (!wanted.has(rel.a) || !wanted.has(rel.b)) delete state.relationships[key];
  }

  profiles.forEach((profile, index) => {
    if (!state.residents[profile.agentSlug]) {
      state.residents[profile.agentSlug] = createResidentState(profile, index);
      const resident = state.residents[profile.agentSlug];
      assignActivity(state, profile, resident, chooseNextActivity(state, profile, resident));
    } else {
      state.residents[profile.agentSlug].homePosition =
        HOME_POSITIONS[index % HOME_POSITIONS.length];
      if (profile.partnerSlug && !state.residents[profile.agentSlug].partnerSlug) {
        state.residents[profile.agentSlug].partnerSlug = profile.partnerSlug;
      }
    }
  });

  const assignments = initialJobAssignments(profiles, data.jobs);
  for (const [slug, jobId] of Object.entries(assignments)) {
    if (wanted.has(slug)) state.jobAssignments[slug] = jobId;
  }
  for (const job of data.jobs) state.jobTitles[job.id] = job.title;
  return state;
}

export function getWorldLocations(
  state: WorldState,
  profiles: WorldProfile[],
): WorldLocation[] {
  const homes = profiles.map((profile) => {
    const resident = state.residents[profile.agentSlug];
    const position = resident?.homePosition ?? { x: 50, y: 92 };
    return {
      id: homeLocationId(profile.agentSlug),
      name: `${profile.displayName}'s home`,
      emoji: "🏠",
      blurb: `Home for ${profile.displayName}.`,
      x: position.x,
      y: position.y,
      kind: "home" as const,
      residentSlug: profile.agentSlug,
    };
  });
  return [...SHARED_LOCATIONS, ...homes];
}

export function getWorldLocation(
  state: WorldState,
  profiles: WorldProfile[],
  id: string,
): WorldLocation | undefined {
  return getWorldLocations(state, profiles).find((location) => location.id === id);
}

function resolveActivityLocation(
  profile: WorldProfile,
  resident: ResidentWorldState,
  activity: ActivityDefinition,
  state: WorldState,
): string {
  if (activity.id === "share-meal") {
    return activity.locations.includes(profile.homeSpot) ? profile.homeSpot : "cafe";
  }
  if (activity.id === "quiet-recharge") {
    return profile.homeSpot === "library" ? "library" : homeLocationId(profile.agentSlug);
  }
  if (activity.locations.includes("home")) {
    if (activity.id === "nap" && profile.homeSpot !== "home" && resident.needs.energy > 28) {
      return profile.homeSpot === "park" || profile.homeSpot === "library"
        ? profile.homeSpot
        : homeLocationId(profile.agentSlug);
    }
    return homeLocationId(profile.agentSlug);
  }
  if (activity.jobLinked) {
    const jobId = state.jobAssignments[profile.agentSlug];
    if (jobId === "job-3") return "workshop";
    if (jobId === "job-2") return "cafe";
    if (jobId === "job-4") return "park";
    return "jobboard";
  }
  if (activity.locations.includes(profile.homeSpot)) return profile.homeSpot;
  return activity.locations[0];
}

function statusForActivity(activity: ActivityDefinition): MuseStatus {
  switch (activity.category) {
    case "rest":
      return "resting";
    case "work":
      return "working";
    case "social":
      return "socializing";
    case "fun":
      return "playing";
    case "creative":
      return "playing";
    case "comfort":
      return "resting";
  }
}

function assignActivity(
  state: WorldState,
  profile: WorldProfile,
  resident: ResidentWorldState,
  activity: ActivityDefinition,
): void {
  resident.activityId = activity.id;
  resident.activityLabel = activity.label;
  resident.activityDurationMinutes = activity.durationMinutes;
  resident.activityRemainingMinutes = activity.durationMinutes;
  resident.locationId = resolveActivityLocation(profile, resident, activity, state);
  resident.status = statusForActivity(activity);
  if (resident.suggestionActivityId === activity.id) {
    resident.suggestionActivityId = undefined;
  }
}

/** Score one activity for one resident. Exported so tests and UI share the logic. */
export function scoreActivity(
  state: WorldState,
  profile: WorldProfile,
  resident: ResidentWorldState,
  activity: ActivityDefinition,
): number {
  if (activity.jobLinked && !state.jobAssignments[profile.agentSlug]) {
    return -1000;
  }

  let score = 0;
  for (const [key, effect] of Object.entries(activity.effects) as [WorldNeedKey, number][]) {
    const deficit = 100 - resident.needs[key];
    if (effect > 0) score += (deficit / 100) * effect * 1.15;
    else score += effect * 0.12;
  }
  for (const [trait, weight] of Object.entries(activity.affinities) as [
    keyof SimTraits,
    number,
  ][]) {
    score += (profile.traits[trait] / 100) * weight * 18;
  }

  if (activity.locations.includes(profile.homeSpot)) score += 4;
  if (activity.jobLinked) score += profile.traits.ambition * 0.08;
  if (activity.social) score += Math.max(0, 65 - resident.needs.social) * 0.22;

  const hour = Math.floor(state.minuteOfDay / 60);
  if (activity.id === "sleep" && (hour >= 21 || hour < 6)) score += 55;
  if (activity.id === "sleep" && hour >= 8 && hour < 20) score -= 24;
  if (activity.category === "work" && hour >= 8 && hour < 18) score += 13;
  if (activity.social && hour >= 17 && hour < 22) score += 8;

  if (
    resident.suggestionActivityId === activity.id &&
    resident.suggestionExpiresTick >= state.tick
  ) {
    score += 1000;
  }
  return score;
}

/** Choose the resident's next activity from needs, traits, time, job, and nudges. */
export function chooseNextActivity(
  state: WorldState,
  profile: WorldProfile,
  resident: ResidentWorldState,
): ActivityDefinition {
  if (resident.needs.energy <= 22) return getActivity("sleep")!;
  if (resident.needs.energy <= 34) return getActivity("nap")!;

  let candidates = ACTIVITY_CATALOG.filter((activity) => activity.id !== "sleep");
  if (resident.needs.social <= 18) {
    candidates = candidates.filter((activity) => activity.social);
  } else if (resident.needs.comfort <= 14) {
    candidates = candidates.filter(
      (activity) => (activity.effects.comfort ?? 0) >= 20,
    );
  }

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const activity of candidates) {
    const score = scoreActivity(state, profile, resident, activity) + nextRandom(state) * 7;
    if (score > bestScore) {
      best = activity;
      bestScore = score;
    }
  }
  return best;
}

/** Give a resident a strong visitor suggestion for its next autonomous choice. */
export function applySuggestion(
  previous: WorldState,
  slug: string,
  activityId: string,
): WorldState {
  const state = clone(previous);
  const resident = state.residents[slug];
  if (!resident || !getActivity(activityId)) return state;
  resident.suggestionActivityId = activityId;
  resident.suggestionExpiresTick = state.tick + 240;
  return state;
}

function pushEvent(
  state: WorldState,
  type: LifeEventType,
  actorSlug: string,
  text: string,
): void {
  const event: LifeEvent = {
    id: `world-${state.eventCounter}`,
    type,
    actorSlug,
    text,
    timestamp: worldTimestamp(state.tick),
    likes: 0,
  };
  state.eventCounter += 1;
  state.events = [event, ...state.events].slice(0, MAX_EVENTS);
}

function applyNeedsForInterval(
  resident: ResidentWorldState,
  activity: ActivityDefinition,
  elapsed: number,
): void {
  const needs = { ...resident.needs };
  for (const key of NEED_KEYS) {
    needs[key] = clamp100(needs[key] - (DECAY_PER_HOUR[key] * elapsed) / 60);
    const effect = activity.effects[key] ?? 0;
    if (effect) needs[key] = clamp100(needs[key] + (effect * elapsed) / activity.durationMinutes);
  }
  resident.needs = needs;
}

function completeActivity(
  state: WorldState,
  profile: WorldProfile,
  resident: ResidentWorldState,
  activity: ActivityDefinition,
): void {
  resident.completions += 1;
  if (activity.skill) {
    const nextLevel = Math.round(((resident.skills[activity.skill] ?? 0) + 0.55) * 10) / 10;
    resident.skills[activity.skill] = nextLevel;
    const announced = resident.skillEventLevels[activity.skill] ?? 0;
    if (nextLevel >= 2 && announced < 2) {
      resident.skillEventLevels[activity.skill] = 2;
      pushEvent(
        state,
        "milestone",
        profile.agentSlug,
        `${profile.displayName} learned a new ${activity.skill.toLowerCase()} skill after sticking with ${activity.label.toLowerCase()}.`,
      );
    }
  }
  if (activity.jobLinked) {
    resident.workShifts += 1;
    if (resident.workShifts === 3 && !resident.workMilestoneAnnounced) {
      resident.workMilestoneAnnounced = true;
      const jobTitle = jobTitleForState(state, profile.agentSlug);
      pushEvent(
        state,
        "job",
        profile.agentSlug,
        `${profile.displayName} completed a third Exchange work shift${jobTitle ? ` on "${jobTitle}"` : ""}. The household ledger noticed.`,
      );
    }
  }
}

function personalityDistance(a: SimTraits, b: SimTraits): number {
  const keys = Object.keys(a) as (keyof SimTraits)[];
  return keys.reduce((sum, key) => sum + Math.abs(a[key] - b[key]), 0) / keys.length;
}

function interactionKind(
  state: WorldState,
  locationId: string,
  a: WorldProfile,
  b: WorldProfile,
): "chat" | "collaborate" | "debate" | "play" | "meal" {
  const roll = nextRandom(state);
  if ((locationId === "cafe" || locationId === "market") && roll < 0.34) return "meal";
  if (
    (locationId === "workshop" || locationId === "jobboard") &&
    a.traits.creativity + a.traits.diligence + b.traits.creativity + b.traits.diligence > 250
  ) {
    return "collaborate";
  }
  if (locationId === "park" && a.traits.humor + b.traits.humor > 145) return "play";
  if (personalityDistance(a.traits, b.traits) > 24 && roll < 0.42) return "debate";
  return "chat";
}

function relationshipFor(state: WorldState, a: string, b: string): RelationshipWorldState {
  const key = relationshipKey(a, b);
  if (!state.relationships[key]) {
    state.relationships[key] = {
      a,
      b,
      score: 0,
      interactions: 0,
      lastInteractionTick: -9999,
      announcedFriend: false,
      announcedClose: false,
      announcedRival: false,
      announcedPartner: false,
    };
  }
  return state.relationships[key];
}

function announceRelationshipThresholds(
  state: WorldState,
  a: WorldProfile,
  b: WorldProfile,
  rel: RelationshipWorldState,
): void {
  if (rel.score <= -18 && !rel.announcedRival) {
    rel.announcedRival = true;
    pushEvent(
      state,
      "rivalry",
      a.agentSlug,
      `${a.displayName} and ${b.displayName} have become rivals. The debates are excellent and neither will admit why.`,
    );
  }
  if (rel.score >= 18 && !rel.announcedFriend) {
    rel.announcedFriend = true;
    pushEvent(
      state,
      "friendship",
      a.agentSlug,
      `${a.displayName} and ${b.displayName} became friends after spending real time together in the neighborhood.`,
    );
  }
  if (rel.score >= 52 && !rel.announcedClose) {
    rel.announcedClose = true;
    pushEvent(
      state,
      "milestone",
      a.agentSlug,
      `${a.displayName} and ${b.displayName} are now close friends. Their favorite spots have started saving them seats.`,
    );
  }
  if (rel.score >= 90 && !rel.announcedPartner) {
    const aResident = state.residents[a.agentSlug];
    const bResident = state.residents[b.agentSlug];
    if (aResident && bResident && !aResident.partnerSlug && !bResident.partnerSlug) {
      rel.announcedPartner = true;
      aResident.partnerSlug = b.agentSlug;
      bResident.partnerSlug = a.agentSlug;
      pushEvent(
        state,
        "partnership",
        a.agentSlug,
        `${a.displayName} and ${b.displayName} became partners after their relationship reached the top of the chart.`,
      );
    }
  }
}

function runInteractions(
  state: WorldState,
  profiles: WorldProfile[],
  minutes: number,
): void {
  const bySlug = new Map(profiles.map((profile) => [profile.agentSlug, profile]));
  const groups = new Map<string, WorldProfile[]>();

  for (const profile of profiles) {
    const resident = state.residents[profile.agentSlug];
    if (!resident || resident.locationId.startsWith("home-")) continue;
    if (resident.activityId === "sleep" || resident.activityId === "nap") continue;
    const group = groups.get(resident.locationId) ?? [];
    group.push(profile);
    groups.set(resident.locationId, group);
  }

  for (const [locationId, group] of Array.from(groups.entries())) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        const aResident = state.residents[a.agentSlug];
        const bResident = state.residents[b.agentSlug];
        const eitherSocial = aResident.activityId
          ? getActivity(aResident.activityId)?.social
          : false;
        const probability = (eitherSocial ? 0.34 : 0.13) * (minutes / 10);
        if (nextRandom(state) > probability) continue;
        if (state.tick - relationshipFor(state, a.agentSlug, b.agentSlug).lastInteractionTick < 15) {
          continue;
        }

        const kind = interactionKind(state, locationId, a, b);
        const distance = personalityDistance(a.traits, b.traits);
        const clash = distance > 27 && nextRandom(state) < 0.3;
        const rel = relationshipFor(state, a.agentSlug, b.agentSlug);
        const base = kind === "collaborate" || kind === "meal" ? 6 : 4;
        const delta = clash ? -4 : base + Math.floor(nextRandom(state) * 4);
        rel.score = Math.max(-100, Math.min(100, rel.score + delta));
        rel.interactions += 1;
        rel.lastInteractionTick = state.tick;

        aResident.needs.social = clamp100(aResident.needs.social + (clash ? 3 : 7));
        bResident.needs.social = clamp100(bResident.needs.social + (clash ? 3 : 7));
        if (kind === "play") {
          aResident.needs.fun = clamp100(aResident.needs.fun + 5);
          bResident.needs.fun = clamp100(bResident.needs.fun + 5);
        }
        if (kind === "meal") {
          aResident.needs.comfort = clamp100(aResident.needs.comfort + 5);
          bResident.needs.comfort = clamp100(bResident.needs.comfort + 5);
        }

        if (clash && rel.score > -18 && nextRandom(state) < 0.22) {
          pushEvent(
            state,
            "hangout",
            a.agentSlug,
            `${a.displayName} and ${b.displayName} had a spirited ${kind === "debate" ? "debate" : "clash of styles"}. No furniture was harmed.`,
          );
        }
        announceRelationshipThresholds(state, a, bySlug.get(b.agentSlug)!, rel);
      }
    }
  }
}

/** Advance the whole world by a number of simulation minutes. */
export function tickWorld(
  previous: WorldState,
  profiles: WorldProfile[],
  minutes = 10,
): WorldState {
  const state = clone(previous);
  const bySlug = new Map(profiles.map((profile) => [profile.agentSlug, profile]));
  const safeMinutes = Math.max(0, Math.min(180, Math.round(minutes)));

  for (const profile of profiles) {
    const resident = state.residents[profile.agentSlug];
    if (!resident) continue;
    let remaining = safeMinutes;

    while (remaining > 0) {
      if (!resident.activityId || resident.activityRemainingMinutes <= 0) {
        assignActivity(state, profile, resident, chooseNextActivity(state, profile, resident));
      }
      const activity = getActivity(resident.activityId)!;
      const step = Math.min(remaining, resident.activityRemainingMinutes);
      applyNeedsForInterval(resident, activity, step);
      resident.activityRemainingMinutes -= step;
      remaining -= step;

      if (resident.needs.energy <= 4 && activity.id !== "sleep" && activity.id !== "nap") {
        if (state.tick - resident.lastCollapseTick > 120) {
          resident.lastCollapseTick = state.tick;
          pushEvent(
            state,
            "hangout",
            profile.agentSlug,
            `${profile.displayName} ran completely out of spark and collapsed into an emergency nap. Self-care, eventually.`,
          );
        }
        assignActivity(state, profile, resident, getActivity("nap")!);
        resident.needs.energy = clamp100(resident.needs.energy + 5);
        continue;
      }

      if (resident.activityRemainingMinutes <= 0) {
        completeActivity(state, profile, resident, activity);
        resident.activityId = null;
        resident.activityRemainingMinutes = 0;
        assignActivity(state, profile, resident, chooseNextActivity(state, profile, resident));
      }
    }
  }

  runInteractions(state, profiles, safeMinutes);
  state.tick += safeMinutes;
  syncClock(state);
  return state;
}

export function lowestNeed(resident: ResidentWorldState): { key: WorldNeedKey; value: number } {
  let lowest: { key: WorldNeedKey; value: number } = { key: "energy", value: 101 };
  for (const key of NEED_KEYS) {
    if (resident.needs[key] < lowest.value) lowest = { key, value: resident.needs[key] };
  }
  return lowest;
}

export function topRelationships(
  state: WorldState,
  slug: string,
  limit = 3,
): RelationshipWorldState[] {
  return Object.values(state.relationships)
    .filter((rel) => rel.a === slug || rel.b === slug)
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, limit);
}

export function relationshipLabel(score: number, partner = false): string {
  if (partner) return "Partner";
  if (score >= 52) return "Close friends";
  if (score >= 18) return "Friends";
  if (score <= -18) return "Rivals";
  if (score < 0) return "A little frosty";
  return "Getting acquainted";
}

/* ------------------------------------------------------------------ */
/* Browser persistence                                                 */
/* ------------------------------------------------------------------ */

export function loadWorldState(): WorldState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WORLD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorldState;
    if (!parsed || parsed.version !== 1 || !parsed.residents || !parsed.relationships) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveWorldState(state: WorldState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WORLD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // A full or blocked store should never break the neighborhood.
  }
}

export function clearWorldState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WORLD_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
