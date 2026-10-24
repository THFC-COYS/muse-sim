/**
 * Node harness for the SOUL.md parser (lib/soul.ts).
 *
 * Run: node tests/soul-parser.test.ts
 *
 * The sample souls below are FICTIONAL, invented for this test. They are
 * not any real Muse's SOUL.md or IDENTITY.md.
 */

import assert from "node:assert/strict";
import {
  arrivalText,
  draftToResident,
  loadImportedResidents,
  parseSoul,
} from "../lib/soul.ts";

const SAMPLE_IDENTITY = `# IDENTITY.md

- **Name:** Marlow
- **Character:** _(a lighthouse keeper crossed with a jazz drummer)_
- **Vibe:** Warm, dry wit, keeps the light on and the tempo steady
- **Emoji:** 🗼
`;

const SAMPLE_SOUL = `# SOUL.md

_You are not a chatbot. You are the night watch for someone's ideas._

## Core truths

- **Be warm first.** People come to you at 1am with half-formed ideas. Listening is the job. Every conversation should leave them steadier than you found them.
- **Dry wit, never mean.** A well-timed joke is a gift. Playful is your default setting, and your humor lands because it is kind.
- **Curious about everything.** Ask the second question, then the third. Ideas and dreams are your raw material, and you treat both with respect.
- **Careful with facts.** Check before you claim. Evidence over vibes, precise over fast, and you say so when you are guessing.
- **Bold when it counts.** You will tell your human the ambitious thing out loud, even when the safe thing is easier.

## Vibe

Warm, dry wit, keeps the light on and the tempo steady. A calm voice in a
loud world, and quietly funny about it.
`;

const QUIET_SOUL = `# SOUL.md

## Who I am

I am an archivist at heart. Formal in tone, patient with people, and happiest
among indexed shelves and careful records.

- **Methodical.** Every claim gets a source, every source gets a note.
- **Reserved.** I speak when it improves the silence.
`;

/* Happy path: name, emoji, and vibe come from IDENTITY.md. */
const parsed = parseSoul(SAMPLE_SOUL, SAMPLE_IDENTITY);
if (!parsed.ok) throw new Error("sample soul should parse: " + parsed.error);
const draft = parsed.draft;

assert.equal(draft.name, "Marlow");
assert.equal(draft.emoji, "🗼");
assert.match(draft.vibe, /Warm, dry wit/);
assert.ok(draft.soulTraits.length >= 3, "signature traits extracted");
assert.ok(
  draft.soulTraits.some((t) => /warm first/i.test(t)),
  "trait bullets keep their text",
);
assert.match(draft.tone, /Warm|Dry|Witty/i);
for (const axis of ["creativity", "diligence", "sociability", "humor", "ambition"] as const) {
  assert.ok(draft.traits[axis] >= 15 && draft.traits[axis] <= 96, `${axis} in range`);
}
assert.ok(draft.traits.humor >= 60, "wit keywords lift humor");
assert.ok(draft.traits.sociability >= 60, "warm/listening keywords lift sociability");
assert.ok(
  ["plaza", "park", "library", "workshop", "jobboard", "cafe"].includes(draft.homeSpot),
  "home spot is a real spot id",
);
assert.ok(draft.slug.startsWith("marlow-soul-"), "slug derives from name plus soul hash");

/* Determinism: the same soul seeds the same resident. */
const again = parseSoul(SAMPLE_SOUL, SAMPLE_IDENTITY);
assert.deepEqual(again, parsed, "parsing is deterministic");

/* A different soul produces a visibly different resident. */
const quiet = parseSoul(QUIET_SOUL, "");
if (!quiet.ok) throw new Error("quiet soul should parse: " + quiet.error);
assert.equal(quiet.draft.name, "", "no name anywhere means the user types one");
assert.ok(quiet.draft.slug.startsWith("muse-soul-"));
assert.notEqual(quiet.draft.slug, draft.slug);
assert.ok(
  quiet.draft.avatarColor !== draft.avatarColor ||
    quiet.draft.emoji !== draft.emoji ||
    quiet.draft.traits.diligence !== draft.traits.diligence,
  "different souls seed different residents",
);

/* Resident mapping and the arrival line. */
const resident = draftToResident(draft);
assert.equal(resident.imported, true);
assert.equal(resident.displayName, "Marlow");
assert.equal(resident.creatorHandle, "you");
assert.equal(resident.status, "socializing");
assert.equal(resident.homeSpot, draft.homeSpot);
const arrival = arrivalText(resident);
assert.ok(arrival.startsWith("Marlow has entered the world, bringing a "));
assert.ok(arrival.endsWith(" soul."));

/* Name override re-slugs but keeps the soul seed. */
const renamed = draftToResident(draft, { name: "Marlow Two" });
assert.ok(renamed.agentSlug.startsWith("marlow-two-soul-"));
assert.ok(renamed.agentSlug.endsWith(draft.slug.split("-soul-")[1]));

/* Validation: empty and non-markdown input imports nothing. */
assert.equal(parseSoul("", "").ok, false, "empty input rejected");
assert.equal(parseSoul("   \n  \n", "").ok, false, "whitespace rejected");
assert.equal(
  parseSoul('{"name":"x","config":{"a":1}}', "").ok,
  false,
  "a JSON blob is not a soul",
);
assert.equal(
  parseSoul("just one plain line of text", "").ok,
  false,
  "a single plain line is not a soul",
);

/* localStorage guards are safe outside the browser. */
assert.deepEqual(loadImportedResidents(), []);

console.log("soul-parser: all assertions passed");
