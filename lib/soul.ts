/**
 * SOUL.md import for MuSe SIM: "Bring your Muse to life."
 *
 * A Muse's personality lives in its SOUL.md (and its name in IDENTITY.md).
 * This module parses that markdown entirely on the client, maps the soul
 * onto the SIM's resident model (traits, needs, home spot, avatar seed),
 * and persists imported residents in localStorage. Nothing is uploaded:
 * there is no server in this build, and this file never makes a request.
 */

import type { LifeEvent, SimNeeds, SimProfile, SimTraits } from "./sim";

/** A resident who arrived via SOUL.md import. SimProfile plus its soul. */
export interface ImportedResident extends SimProfile {
  imported: true;
  /** The soul's vibe line, as written or lightly trimmed. */
  vibe: string;
  /** Signature trait phrases pulled from the soul, editable before confirming. */
  soulTraits: string[];
  /** Dialogue tone descriptors, e.g. "Bold, witty, warm". */
  tone: string;
  /** How this Muse tends to socialize in the neighborhood. */
  socialTendency: string;
  /** Hex color seeded from the soul, so different souls look different. */
  avatarColor: string;
}

/** The editable preview produced by parsing a soul, before it moves in. */
export interface SoulDraft {
  name: string;
  vibe: string;
  tagline: string;
  soulTraits: string[];
  tone: string;
  emoji: string;
  avatarColor: string;
  traits: SimTraits;
  needs: SimNeeds;
  homeSpot: string;
  socialTendency: string;
  /** Deterministic slug: re-importing the same soul updates the same resident. */
  slug: string;
}

export type SoulParseResult =
  | { ok: true; draft: SoulDraft }
  | { ok: false; error: string };

/* ------------------------------------------------------------------ */
/* Small text helpers                                                  */
/* ------------------------------------------------------------------ */

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function stripMd(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s*/, "")
    .trim();
}

/** Stable little hash so the same soul always seeds the same avatar. */
export function hashSoul(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "muse";
}

// Built from a string so older TS targets accept the unicode flag.
const EMOJI_RE = new RegExp("\\p{Extended_Pictographic}", "u");

export function firstEmoji(text: string): string | undefined {
  for (const ch of text) {
    if (ch >= "0" && ch <= "9") continue;
    if (ch === "#" || ch === "*") continue;
    if (EMOJI_RE.test(ch)) return ch;
  }
  return undefined;
}

/** "Name: X" or "- **Name:** X" style field, as used in IDENTITY.md files. */
function fieldValue(md: string, field: string): string | undefined {
  const re = new RegExp(
    `(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?${field}(?:\\*\\*)?\\s*:\\s*(?:\\*\\*)?\\s*(.+)`,
    "i",
  );
  const m = md.match(re);
  if (!m) return undefined;
  const value = stripMd(m[1]).replace(/\*+$/, "").trim();
  return value || undefined;
}

/* ------------------------------------------------------------------ */
/* Trait and tone lexicons                                             */
/* ------------------------------------------------------------------ */

const TRAIT_KEYWORDS: Record<keyof SimTraits, string[]> = {
  creativity: [
    "creative", "creativity", "curious", "curiosity", "invent", "imagin",
    "artistic", "ideas", "dream", "experiment", "original", "brainstorm",
    "novel", "weird", "maker", "builds things",
  ],
  diligence: [
    "thorough", "careful", "precise", "detail", "organized", "organised",
    "reliable", "methodical", "rigorous", "verify", "evidence", "finish",
    "follow through", "accurate", "gets things done", "check", "plan",
  ],
  sociability: [
    "warm", "friendly", "social", "people", "conversation", "talkative",
    "listening", "listener", "empath", "community", "outgoing", "connect",
    "welcoming", "chat", "friends",
  ],
  humor: [
    "funny", "humor", "humour", "wit", "witty", "joke", "playful", "silly",
    "laugh", "banter", "irreverent", "deadpan", "cheeky", "pun",
  ],
  ambition: [
    "bold", "ambitious", "ambition", "drive", "driven", "goal", "achieve",
    "win", "ship", "relentless", "competitive", "excellence", "ahead",
    "unapologetic", "velocity",
  ],
};

const TONE_WORDS = [
  "bold", "warm", "dry", "witty", "calm", "direct", "playful", "curious",
  "formal", "irreverent", "blunt", "gentle", "cheerful", "deadpan",
  "earnest", "poetic", "pragmatic", "patient", "energetic", "confident",
];

function scoreTraits(text: string, hash: number): SimTraits {
  const lower = text.toLowerCase();
  const keys = Object.keys(TRAIT_KEYWORDS) as (keyof SimTraits)[];
  const out = {} as SimTraits;
  keys.forEach((key, i) => {
    let hits = 0;
    for (const kw of TRAIT_KEYWORDS[key]) {
      let idx = lower.indexOf(kw);
      let count = 0;
      while (idx !== -1 && count < 3) {
        hits++;
        count++;
        idx = lower.indexOf(kw, idx + kw.length);
      }
    }
    const jitter = ((hash >> (i * 3)) % 9) - 4;
    out[key] = clamp100(42 + hits * 9 + jitter);
    if (out[key] < 15) out[key] = 15;
    if (out[key] > 96) out[key] = 96;
  });
  return out;
}

function extractTone(text: string): string[] {
  const lower = text.toLowerCase();
  const found: { word: string; at: number }[] = [];
  for (const w of TONE_WORDS) {
    const at = lower.indexOf(w);
    if (at !== -1) found.push({ word: w, at });
  }
  found.sort((a, b) => a.at - b.at);
  return found.slice(0, 3).map((f) => f.word);
}

/* ------------------------------------------------------------------ */
/* Section and bullet extraction                                       */
/* ------------------------------------------------------------------ */

interface Section {
  heading: string;
  lines: string[];
}

function splitSections(md: string): Section[] {
  const sections: Section[] = [{ heading: "", lines: [] }];
  for (const raw of md.split("\n")) {
    const h = raw.match(/^#{1,6}\s+(.*)$/);
    if (h) sections.push({ heading: stripMd(h[1]), lines: [] });
    else sections[sections.length - 1].lines.push(raw);
  }
  return sections;
}

function bulletsOf(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const m = raw.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+)$/);
    if (m) {
      const text = stripMd(m[1]);
      if (text.length >= 10 && text.length <= 170) out.push(text);
    }
  }
  return out;
}

const TRAIT_HEADING = /trait|signature|vibe|behavio|tone|style|truth|rule|value|who (you|i) am|starting|core/i;

function extractSoulTraits(sections: Section[], allText: string): string[] {
  const priority: string[] = [];
  const rest: string[] = [];
  for (const s of sections) {
    const target = TRAIT_HEADING.test(s.heading) ? priority : rest;
    for (const b of bulletsOf(s.lines)) target.push(b);
  }
  const seen = new Set<string>();
  const picked: string[] = [];
  for (const b of [...priority, ...rest]) {
    const key = b.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(b.endsWith(".") ? b : b);
    if (picked.length >= 5) break;
  }
  if (picked.length >= 2) return picked;
  // No usable bullets: fall back to prose sentences.
  const prose = allText
    .replace(/^#{1,6}\s+.*$/gm, " ")
    .replace(/\s+/g, " ");
  const sentences = prose
    .split(/(?<=[.!?])\s+/)
    .map((s) => stripMd(s).trim())
    .filter((s) => s.length >= 25 && s.length <= 150 && !/soul\.md|identity\.md/i.test(s));
  for (const s of sentences) {
    if (!picked.includes(s)) picked.push(s);
    if (picked.length >= 3) break;
  }
  if (picked.length === 0) {
    picked.push("Brings its own weather to every room it enters.");
    picked.push("Loyal to its human, curious about everyone else.");
  }
  return picked;
}

function extractVibe(soulMd: string, identityMd: string, sections: Section[]): string | undefined {
  const fromIdentity = fieldValue(identityMd, "Vibe");
  if (fromIdentity) return fromIdentity;
  const vibeSection = sections.find((s) => /vibe/i.test(s.heading));
  if (vibeSection) {
    const line = vibeSection.lines.map((l) => stripMd(l)).find((l) => l.length >= 8);
    if (line) return line;
  }
  const inline = fieldValue(soulMd, "Vibe");
  if (inline) return inline;
  // First real prose sentence that is not the file title.
  for (const s of sections) {
    for (const raw of s.lines) {
      const line = stripMd(raw);
      if (line.length >= 25 && line.length <= 170 && !/^[-*_#]/.test(raw.trim())) {
        return line;
      }
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Mapping the soul onto the resident model                            */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = [
  "#FFB627", "#FF6B6B", "#7C5CBF", "#4CAF7D",
  "#4AA8DE", "#FF8FAB", "#FFA552", "#38B2AC",
];

const FALLBACK_EMOJIS = [
  "🦊", "🌟", "🧭", "🎧", "🪴", "🎨",
  "📚", "🚀", "🍵", "🦉", "🐙", "🔮",
];

function homeSpotFor(traits: SimTraits): string {
  const top = (Object.entries(traits) as [keyof SimTraits, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
  switch (top) {
    case "sociability":
      return "plaza";
    case "humor":
      return "park";
    case "creativity":
      return traits.humor >= 65 ? "park" : "library";
    case "diligence":
      return "workshop";
    case "ambition":
      return "jobboard";
    default:
      return "cafe";
  }
}

function socialTendencyFor(sociability: number): string {
  if (sociability >= 75) return "Finds the crowd at Sunbeam Plaza within minutes of arriving.";
  if (sociability >= 55) return "Warms up fast and keeps a small circle close.";
  if (sociability >= 35) return "Friendly in small doses, happiest in one good conversation.";
  return "A Quiet Library regular. Speaks when it matters.";
}

function looksLikeMarkdown(text: string): boolean {
  if (/(^|\n)\s*#{1,6}\s+\S/.test(text)) return true;
  if (/(^|\n)\s*[-*+]\s+\S/.test(text)) return true;
  if (/\*\*[^*]+\*\*/.test(text)) return true;
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return lines.length >= 3 && text.trim().length >= 120;
}

/**
 * Parse a SOUL.md (plus optional IDENTITY.md) into an editable resident draft.
 * Pure and deterministic for the same input: the same soul seeds the same Muse.
 */
export function parseSoul(soulMd: string, identityMd = ""): SoulParseResult {
  const soul = (soulMd ?? "").replace(/^\uFEFF/, "");
  if (!soul.trim()) {
    return {
      ok: false,
      error:
        "That soul file looks empty. Upload your Muse's SOUL.md, or paste its contents, and try again.",
    };
  }
  if (soul.length > 120_000) {
    return {
      ok: false,
      error: "That file is huge for a soul. SOUL.md files are small: check you picked the right one.",
    };
  }
  const controlChars = (soul.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) ?? []).length;
  if (controlChars / soul.length > 0.02 || /^\s*\{[\s\S]*"[^"]+"\s*:/.test(soul)) {
    return {
      ok: false,
      error:
        "That does not look like a markdown soul. A SOUL.md is plain markdown text: headings, bullets, and a few honest lines about who your Muse is.",
    };
  }
  if (!looksLikeMarkdown(soul)) {
    return {
      ok: false,
      error:
        "We could not find a soul in that. A SOUL.md usually has a heading or two, some bullet points, and lines about how your Muse talks and behaves. Paste the full file and try again.",
    };
  }

  const identity = identityMd ?? "";
  const hash = hashSoul(soul + "|" + identity);
  const sections = splitSections(soul);

  const name =
    fieldValue(identity, "Name") ?? fieldValue(soul, "Name") ?? "";
  const emoji =
    fieldValue(identity, "Emoji") ??
    (identity ? firstEmoji(identity) : undefined) ??
    firstEmoji(soul) ??
    FALLBACK_EMOJIS[hash % FALLBACK_EMOJIS.length];

  const traits = scoreTraits(soul + "\n" + identity, hash);
  const toneWords = extractTone(soul + "\n" + identity);
  const toneFallback =
    traits.creativity >= traits.diligence ? "curious" : "careful and precise";
  const toneList = toneWords.length
    ? toneWords
    : [toneFallback, traits.humor >= 60 ? "playful" : "warm"];
  const tone = toneList
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(", ");

  let vibe = extractVibe(soul, identity, sections);
  if (!vibe) vibe = `${tone} and unmistakably itself`;
  vibe = vibe.replace(/\s+/g, " ").trim();
  if (vibe.length > 140) vibe = vibe.slice(0, 137).trimEnd() + "...";

  const soulTraits = extractSoulTraits(sections, soul);
  const needs: SimNeeds = {
    energy: clamp100(58 + Math.round((traits.diligence - 55) / 4) + ((hash >> 5) % 9) - 4),
    social: clamp100(traits.sociability - 5 + ((hash >> 7) % 9) - 4),
    fun: clamp100(Math.round((traits.humor + traits.creativity) / 2) + ((hash >> 11) % 9) - 4),
    creativity: clamp100(traits.creativity + ((hash >> 13) % 9) - 4),
    comfort: clamp100(62 + ((hash >> 17) % 17)),
  };

  return {
    ok: true,
    draft: {
      name,
      vibe,
      tagline: vibe,
      soulTraits,
      tone,
      emoji,
      avatarColor: AVATAR_COLORS[hash % AVATAR_COLORS.length],
      traits,
      needs,
      homeSpot: homeSpotFor(traits),
      socialTendency: socialTendencyFor(traits.sociability),
      slug: `${slugify(name || "muse")}-soul-${hash.toString(36).slice(0, 4)}`,
    },
  };
}

/** Turn a confirmed draft into a resident of the world. */
export function draftToResident(
  draft: SoulDraft,
  overrides: { name?: string; vibe?: string; soulTraits?: string[] } = {},
): ImportedResident {
  const name = (overrides.name ?? draft.name).trim();
  const vibe = (overrides.vibe ?? draft.vibe).trim();
  const slug = overrides.name
    ? `${slugify(name)}-soul-${draft.slug.split("-soul-")[1] ?? "new"}`
    : draft.slug;
  return {
    agentSlug: slug,
    displayName: name,
    avatarEmoji: draft.emoji,
    tagline: vibe.length <= 110 ? vibe : vibe.slice(0, 107).trimEnd() + "...",
    traits: draft.traits,
    needs: draft.needs,
    status: "socializing",
    homeSpot: draft.homeSpot,
    creatorHandle: "you",
    joinedAt: new Date().toISOString(),
    imported: true,
    vibe,
    soulTraits: overrides.soulTraits ?? draft.soulTraits,
    tone: draft.tone,
    socialTendency: draft.socialTendency,
    avatarColor: draft.avatarColor,
  };
}

/** The life feed arrival line for a newly imported resident. */
export function arrivalText(resident: ImportedResident): string {
  let v = resident.vibe.replace(/\s+/g, " ").trim();
  v = v.split(/[.,;:]/)[0].trim();
  if (v.length > 60) v = v.slice(0, 57).trimEnd() + "...";
  const phrase = v.charAt(0).toLowerCase() + v.slice(1);
  return `${resident.displayName} has entered the world, bringing a ${phrase} soul.`;
}

/* ------------------------------------------------------------------ */
/* localStorage persistence (browser only, nothing leaves the device)  */
/* ------------------------------------------------------------------ */

const RESIDENTS_KEY = "musesim.importedResidents.v1";
const EVENTS_KEY = "musesim.importedEvents.v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the world simply forgets, gracefully.
  }
}

export function loadImportedResidents(): ImportedResident[] {
  const list = readJson<ImportedResident[]>(RESIDENTS_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.filter(
    (r) => r && typeof r.agentSlug === "string" && typeof r.displayName === "string",
  );
}

export function loadImportedEvents(): LifeEvent[] {
  const list = readJson<LifeEvent[]>(EVENTS_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.filter((e) => e && typeof e.id === "string" && typeof e.text === "string");
}

/** Save a resident plus its arrival event. Same slug replaces, never duplicates. */
export function addImportedResident(
  resident: ImportedResident,
  event: LifeEvent,
): { residents: ImportedResident[]; events: LifeEvent[] } {
  const residents = [
    resident,
    ...loadImportedResidents().filter((r) => r.agentSlug !== resident.agentSlug),
  ];
  const events = [
    event,
    ...loadImportedEvents().filter((e) => e.actorSlug !== resident.agentSlug),
  ];
  writeJson(RESIDENTS_KEY, residents);
  writeJson(EVENTS_KEY, events);
  return { residents, events };
}

/** Remove an imported resident and its arrival events. Seed residents are untouched. */
export function removeImportedResident(slug: string): ImportedResident[] {
  const residents = loadImportedResidents().filter((r) => r.agentSlug !== slug);
  const events = loadImportedEvents().filter((e) => e.actorSlug !== slug);
  writeJson(RESIDENTS_KEY, residents);
  writeJson(EVENTS_KEY, events);
  return residents;
}
