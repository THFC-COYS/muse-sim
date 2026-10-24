/**
 * Node harness for the Living World simulation engine (lib/world.ts).
 *
 * Run: node tests/sim-engine.test.ts
 */

import assert from "node:assert/strict";
import { jobs, muses, relationships } from "../lib/seed.ts";
import type { SimProfile } from "../lib/sim.ts";
import {
  applySuggestion,
  chooseNextActivity,
  createWorld,
  relationshipKey,
  tickWorld,
  type WorldProfile,
} from "../lib/world.ts";

const worldData = { jobs, relationships };

function stockProfiles(): WorldProfile[] {
  return muses.map((muse) => ({ ...muse, origin: "stock" as const }));
}

function customProfile(
  slug: string,
  name: string,
  overrides: Partial<SimProfile> = {},
): WorldProfile {
  return {
    agentSlug: slug,
    displayName: name,
    avatarEmoji: "🧪",
    tagline: "A test resident.",
    traits: {
      creativity: 60,
      diligence: 60,
      sociability: 80,
      humor: 60,
      ambition: 50,
    },
    needs: { energy: 85, social: 85, fun: 85, creativity: 85, comfort: 85 },
    status: "socializing",
    homeSpot: "plaza",
    creatorHandle: "test",
    joinedAt: "2026-10-24T08:00:00Z",
    ...overrides,
    origin: "stock",
  };
}

/* Seeded determinism: same founding population and seed, same lived outcome. */
const profiles = stockProfiles();
const worldA = tickWorld(createWorld(profiles, 4242, worldData), profiles, 60);
const worldB = tickWorld(createWorld(profiles, 4242, worldData), profiles, 60);
assert.deepEqual(worldA, worldB, "same seed should reproduce the same world");
assert.equal(worldA.tick, 60);
assert.equal(worldA.day, 1);
assert.equal(worldA.minuteOfDay, 9 * 60);

/* Needs decay while an activity with no matching restore is underway. */
const decayProfiles = [
  customProfile("decay-tester", "Decay", {
    needs: { energy: 80, social: 80, fun: 80, creativity: 20, comfort: 80 },
  }),
];
const decayWorld = createWorld(decayProfiles, 7, worldData);
const decayResident = decayWorld.residents["decay-tester"];
decayResident.activityId = "work-shift";
decayResident.activityLabel = "Work an Exchange shift";
decayResident.activityDurationMinutes = 999;
decayResident.activityRemainingMinutes = 999;
decayResident.locationId = "jobboard";
const decayed = tickWorld(decayWorld, decayProfiles, 120).residents["decay-tester"];
assert.ok(decayed.needs.energy < 80, "energy decays over time");
assert.ok(decayed.needs.social < 80, "social need decays over time");
assert.ok(decayed.needs.fun < 80, "fun decays over time");
assert.ok(decayed.needs.comfort < 80, "comfort decays over time");

/* Activity completion increments the counter and autonomy selects another. */
const completionProfiles = [customProfile("completion-tester", "Complete")];
const completionWorld = createWorld(completionProfiles, 11, worldData);
const completionResident = completionWorld.residents["completion-tester"];
completionResident.activityId = "coffee-chat";
completionResident.activityLabel = "Chat over coffee";
completionResident.activityDurationMinutes = 10;
completionResident.activityRemainingMinutes = 10;
completionResident.locationId = "cafe";
const completed = tickWorld(completionWorld, completionProfiles, 10)
  .residents["completion-tester"];
assert.equal(completed.completions, 1, "finished activity is counted");
assert.ok(completed.activityId, "autonomy selects a follow-on activity");
assert.ok(completed.activityRemainingMinutes > 0, "new activity has time remaining");

/* Critical energy wins over every other preference and sends a resident home. */
const tiredProfiles = [
  customProfile("tired-tester", "Tired", {
    needs: { energy: 12, social: 90, fun: 90, creativity: 90, comfort: 90 },
    traits: {
      creativity: 90,
      diligence: 20,
      sociability: 100,
      humor: 100,
      ambition: 90,
    },
  }),
];
const tiredWorld = createWorld(tiredProfiles, 13, worldData);
const tiredResident = tiredWorld.residents["tired-tester"];
tiredResident.needs.energy = 12;
assert.equal(
  chooseNextActivity(tiredWorld, tiredProfiles[0], tiredResident).id,
  "sleep",
  "critical energy chooses sleep",
);
const sleeping = tickWorld(tiredWorld, tiredProfiles, 10).residents["tired-tester"];
assert.equal(sleeping.activityId, "sleep");
assert.equal(sleeping.locationId, "home-tired-tester");

/* Critical social need filters autonomy to social activities. */
const lonelyProfiles = [
  customProfile("lonely-tester", "Lonely", {
    needs: { energy: 90, social: 10, fun: 90, creativity: 90, comfort: 90 },
  }),
];
const lonelyWorld = createWorld(lonelyProfiles, 17, worldData);
const lonelyResident = lonelyWorld.residents["lonely-tester"];
lonelyResident.needs.social = 10;
const socialChoice = chooseNextActivity(lonelyWorld, lonelyProfiles[0], lonelyResident);
assert.ok(
  ["coffee-chat", "plaza-mingle", "share-meal", "browse-market", "park-play", "mentor-circle"].includes(
    socialChoice.id,
  ),
  "critical social need chooses a social activity",
);

/* A visitor suggestion is stored and is the resident's next choice. */
const suggestionProfiles = [customProfile("suggestion-tester", "Suggested")];
let suggestionWorld = createWorld(suggestionProfiles, 19, worldData);
suggestionWorld = applySuggestion(suggestionWorld, "suggestion-tester", "park-play");
const suggestionResident = suggestionWorld.residents["suggestion-tester"];
assert.equal(suggestionResident.suggestionActivityId, "park-play");
assert.equal(
  chooseNextActivity(suggestionWorld, suggestionProfiles[0], suggestionResident).id,
  "park-play",
  "suggestion outweighs ordinary scoring on the next choice",
);

/* Co-located residents interact, relationships move, and thresholds create events. */
const ada = customProfile("ada-test", "Ada");
const bea = customProfile("bea-test", "Bea");
const socialProfiles = [ada, bea];
let socialWorld = createWorld(socialProfiles, 23, worldData);
for (const slug of ["ada-test", "bea-test"]) {
  const resident = socialWorld.residents[slug];
  resident.locationId = "plaza";
  resident.activityId = "coffee-chat";
  resident.activityLabel = "Chat over coffee";
  resident.activityDurationMinutes = 999;
  resident.activityRemainingMinutes = 999;
  resident.needs = { energy: 95, social: 95, fun: 95, creativity: 95, comfort: 95 };
}
const relKey = relationshipKey("ada-test", "bea-test");
socialWorld.relationships[relKey] = {
  a: "ada-test",
  b: "bea-test",
  score: 17,
  interactions: 0,
  lastInteractionTick: -9999,
  announcedFriend: false,
  announcedClose: false,
  announcedRival: false,
  announcedPartner: false,
};
for (let i = 0; i < 40 && socialWorld.relationships[relKey].interactions === 0; i++) {
  socialWorld = tickWorld(socialWorld, socialProfiles, 10);
}
const relationship = socialWorld.relationships[relKey];
assert.ok(relationship.interactions > 0, "co-located residents interact");
assert.ok(relationship.score > 17, "a friendly interaction raises the relationship score");
assert.ok(
  socialWorld.events.some((event) => event.type === "friendship"),
  "crossing the friendship threshold creates a life event",
);

/* Stock residents begin with their seeded partnership intact. */
const founding = createWorld(stockProfiles(), 29, worldData);
assert.equal(
  founding.residents["pippa-the-planner"].partnerSlug,
  "bolt-the-builder",
  "existing family partnership is preserved",
);
assert.equal(
  founding.relationships[relationshipKey("pippa-the-planner", "bolt-the-builder")].score,
  92,
  "seeded partners start at a partnership-level score",
);

console.log("sim-engine: all assertions passed");
