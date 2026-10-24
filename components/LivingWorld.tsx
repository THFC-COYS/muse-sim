"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LifeEventCard from "@/components/LifeEventCard";
import NeedsMeters from "@/components/NeedsMeters";
import TraitBars from "@/components/TraitBars";
import { jobs, muses, relationships } from "@/lib/seed";
import { STATUS_META } from "@/lib/sim";
import { loadImportedResidents, type ImportedResident } from "@/lib/soul";
import {
  ACTIVITY_CATALOG,
  applySuggestion,
  clearWorldState,
  createWorld,
  formatWorldClock,
  getActivity,
  getWorldLocation,
  getWorldLocations,
  isEvening,
  isNight,
  jobTitleForState,
  loadWorldState,
  lowestNeed,
  relationshipLabel,
  saveWorldState,
  syncWorldPopulation,
  tickWorld,
  topRelationships,
  type WorldData,
  type WorldProfile,
  type WorldState,
} from "@/lib/world";

const WORLD_DATA: WorldData = { jobs, relationships };
type Speed = 0 | 1 | 3;

const TOKEN_OFFSETS: [number, number][] = [
  [-46, -48],
  [46, -48],
  [-46, 30],
  [46, 30],
  [0, -62],
  [0, 44],
  [-62, -4],
  [62, -4],
  [-28, 58],
  [28, 58],
];

function toWorldProfiles(imported: ImportedResident[]): WorldProfile[] {
  return [
    ...muses.map((muse) => ({ ...muse, origin: "stock" as const })),
    ...imported.map((resident) => ({
      ...resident,
      origin: "imported" as const,
      tone: resident.tone,
      avatarColor: resident.avatarColor,
    })),
  ];
}

function needTone(value: number): string {
  if (value >= 60) return "Doing well";
  if (value >= 30) return "Needs attention";
  return "Critical";
}

export default function LivingWorld() {
  const [imported, setImported] = useState<ImportedResident[]>([]);
  const [world, setWorld] = useState<WorldState>(() =>
    createWorld(toWorldProfiles([]), 20261024, WORLD_DATA),
  );
  const [selectedSlug, setSelectedSlug] = useState("pippa-the-planner");
  const [speed, setSpeed] = useState<Speed>(1);
  const [suggestionActivity, setSuggestionActivity] = useState("park-play");
  const [ready, setReady] = useState(true);

  const profiles = useMemo(() => toWorldProfiles(imported), [imported]);
  const profileBySlug = useMemo(
    () => new Map(profiles.map((profile) => [profile.agentSlug, profile])),
    [profiles],
  );

  useEffect(() => {
    const importedResidents = loadImportedResidents();
    const allProfiles = toWorldProfiles(importedResidents);
    setImported(importedResidents);
    const saved = loadWorldState();
    const initial = saved
      ? syncWorldPopulation(saved, allProfiles, WORLD_DATA)
      : createWorld(allProfiles, 20261024, WORLD_DATA);
    setWorld(initial);
    saveWorldState(initial);
    if (!initial.residents[selectedSlug]) {
      setSelectedSlug(allProfiles[0]?.agentSlug ?? "");
    }
    setReady(true);
    // The founding population is loaded once; imported residents are read at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !world || speed === 0) return;
    const id = window.setInterval(() => {
      setWorld((current) => {
        if (!current) return current;
        const next = tickWorld(current, profiles, speed === 1 ? 10 : 30);
        saveWorldState(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [profiles, ready, speed, world === null]);

  const selectedProfile = profileBySlug.get(selectedSlug) ?? profiles[0];
  const selectedResident = selectedProfile ? world?.residents[selectedProfile.agentSlug] : undefined;
  const selectedLocation =
    world && selectedProfile && selectedResident
      ? getWorldLocation(world, profiles, selectedResident.locationId)
      : undefined;
  const selectedJob = world && selectedProfile ? jobTitleForState(world, selectedProfile.agentSlug) : undefined;
  const selectedRelationships =
    world && selectedProfile ? topRelationships(world, selectedProfile.agentSlug, 4) : [];
  const locations = world ? getWorldLocations(world, profiles) : [];
  const sharedLocations = locations.filter((location) => location.kind === "shared");
  const worldEvents = world?.events.slice(0, 8) ?? [];
  const night = world ? isNight(world) : false;
  const evening = world ? isEvening(world) : false;

  const selectResident = (slug: string) => {
    setSelectedSlug(slug);
    setSuggestionActivity("park-play");
  };

  const resetWorld = () => {
    clearWorldState();
    const fresh = createWorld(profiles, 20261024, WORLD_DATA);
    setWorld(fresh);
    saveWorldState(fresh);
    setSpeed(1);
    setSelectedSlug(profiles[0]?.agentSlug ?? "");
  };

  const suggest = () => {
    if (!world || !selectedProfile) return;
    const next = applySuggestion(world, selectedProfile.agentSlug, suggestionActivity);
    setWorld(next);
    saveWorldState(next);
    const resident = next.residents[selectedProfile.agentSlug];
    if (resident) resident.activityRemainingMinutes = Math.min(resident.activityRemainingMinutes, 20);
    setWorld({ ...next });
    saveWorldState(next);
  };

  if (!ready || !world || !selectedProfile || !selectedResident) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-16 text-center sm:px-6">
        <p className="text-5xl">🏡</p>
        <h1 className="mt-4 text-4xl font-black">Opening the Living World...</h1>
        <p className="mt-3 font-bold text-cocoa/60">
          The residents are finding their homes and checking their needs.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="text-center">
        <p className="inline-block rounded-full bg-honey/25 px-4 py-1.5 text-sm font-extrabold text-amber-800">
          🌎 Living World
        </p>
        <h1 className="mt-4 text-4xl font-black sm:text-6xl">The neighborhood is alive</h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-cocoa/65">
          Residents wake, work Exchange shifts, chase their lowest needs, meet
          at shared spots, form friendships and rivalries, and head home when
          their energy runs out. Imported souls use the personality their
          SOUL.md gave them.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-bold text-cocoa/50">
          This is a front-end simulation in your browser. Its clock, needs,
          relationships, positions, and skills persist in local storage on
          this device.
        </p>
      </div>

      {/* Clock and controls */}
      <div className="mt-8 flex flex-col gap-4 rounded-4xl border border-cocoa/10 bg-white p-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sand text-3xl">
            {night ? "🌙" : evening ? "🌇" : "☀️"}
          </span>
          <div>
            <p className="text-2xl font-black">{formatWorldClock(world)}</p>
            <p className="text-sm font-bold text-cocoa/55">
              Day {world.day} · {profiles.length} residents · {world.events.length} world events remembered
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-extrabold uppercase tracking-wider text-cocoa/45">
            World speed
          </span>
          {([
            [0, "⏸ Pause"],
            [1, "▶ 1x"],
            [3, "⏩ 3x"],
          ] as [Speed, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSpeed(value)}
              className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                speed === value
                  ? "bg-coral text-white shadow-pop"
                  : "bg-cream text-cocoa/60 hover:bg-sand"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={resetWorld}
            className="rounded-full border-2 border-cocoa/10 px-4 py-2 text-sm font-extrabold text-cocoa/60 transition hover:border-coral hover:text-coral"
          >
            Reset world
          </button>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          {/* Map */}
          <div className="relative h-[620px] overflow-hidden rounded-4xl border border-cocoa/10 bg-gradient-to-b from-skypop/30 via-leaf/20 to-sand shadow-soft">
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              <line x1="50%" y1="10%" x2="50%" y2="48%" stroke="#fff" strokeWidth="12" strokeLinecap="round" opacity="0.75" />
              <line x1="20%" y1="32%" x2="86%" y2="56%" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity="0.65" />
              <line x1="28%" y1="74%" x2="70%" y2="72%" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity="0.7" />
              <line x1="50%" y1="48%" x2="28%" y2="74%" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity="0.55" />
              <line x1="50%" y1="48%" x2="86%" y2="56%" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity="0.55" />
            </svg>
            <div
              className={`pointer-events-none absolute inset-0 transition-colors duration-1000 ${
                night ? "bg-indigo-950/45" : evening ? "bg-orange-300/20" : "bg-transparent"
              }`}
            />
            <div className="absolute right-5 top-5 rounded-full bg-white/85 px-4 py-2 text-sm font-extrabold shadow-soft backdrop-blur">
              {night ? "🌙 Night in the neighborhood" : evening ? "🌇 Evening" : "☀️ Daytime"}
            </div>

            {/* Resident homes */}
            {locations
              .filter((location) => location.kind === "home")
              .map((location) => {
                const owner = location.residentSlug ? profileBySlug.get(location.residentSlug) : undefined;
                if (!owner) return null;
                return (
                  <div
                    key={location.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                    style={{ left: `${location.x}%`, top: `${location.y}%` }}
                    title={location.name}
                  >
                    <div className={`rounded-2xl border px-2 py-1 text-lg shadow-soft backdrop-blur ${
                      night ? "border-white/20 bg-indigo-950/70" : "border-cocoa/10 bg-white/80"
                    }`}>
                      🏠
                    </div>
                    <p className={`mt-1 max-w-20 truncate text-[10px] font-extrabold ${night ? "text-white" : "text-cocoa/60"}`}>
                      {owner.displayName}
                    </p>
                  </div>
                );
              })}

            {/* Shared spots */}
            {sharedLocations.map((spot) => (
              <div
                key={spot.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              >
                <div className={`rounded-3xl border px-4 py-2 shadow-soft backdrop-blur ${
                  night
                    ? "border-white/20 bg-indigo-950/80 text-white"
                    : "border-cocoa/10 bg-white/90"
                }`}>
                  <p className="text-2xl">{spot.emoji}</p>
                  <p className="whitespace-nowrap text-xs font-extrabold">{spot.name}</p>
                </div>
              </div>
            ))}

            {/* Resident tokens */}
            {profiles.map((profile) => {
              const resident = world.residents[profile.agentSlug];
              if (!resident) return null;
              const location = locations.find((item) => item.id === resident.locationId);
              if (!location) return null;
              const sameLocation = profiles.filter(
                (candidate) => world.residents[candidate.agentSlug]?.locationId === resident.locationId,
              );
              const index = sameLocation.findIndex((candidate) => candidate.agentSlug === profile.agentSlug);
              const [ox, oy] = TOKEN_OFFSETS[index % TOKEN_OFFSETS.length];
              const selected = profile.agentSlug === selectedProfile.agentSlug;
              return (
                <button
                  key={profile.agentSlug}
                  onClick={() => selectResident(profile.agentSlug)}
                  title={`${profile.displayName}: ${resident.activityLabel} at ${location.name}`}
                  className="absolute z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 text-3xl shadow-pop transition-all duration-700 hover:scale-110"
                  style={{
                    left: `calc(${location.x}% + ${ox}px)`,
                    top: `calc(${location.y}% + ${oy}px)`,
                    backgroundColor: profile.avatarColor ?? "#FFB627",
                    borderColor: selected ? "#4CAF7D" : "#fff",
                  }}
                >
                  {selected && (
                    <span className="absolute -top-8 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 animate-bounce rounded-[4px] border-2 border-white bg-leaf shadow-pop" />
                  )}
                  {profile.avatarEmoji}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cocoa/85 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    {profile.displayName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Roster */}
          <div className="mt-6 rounded-4xl border border-cocoa/10 bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Resident roster</h2>
              <p className="text-sm font-bold text-cocoa/50">Click anyone to inspect their live card.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => {
                const resident = world.residents[profile.agentSlug];
                if (!resident) return null;
                const location = locations.find((item) => item.id === resident.locationId);
                const low = lowestNeed(resident);
                return (
                  <button
                    key={profile.agentSlug}
                    onClick={() => selectResident(profile.agentSlug)}
                    className={`rounded-3xl p-4 text-left transition ${
                      profile.agentSlug === selectedProfile.agentSlug
                        ? "bg-honey/25 ring-2 ring-honey"
                        : "bg-cream hover:bg-sand"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl"
                        style={{ backgroundColor: profile.avatarColor ?? "#FFE8A3" }}
                      >
                        {profile.avatarEmoji}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-extrabold">{profile.displayName}</p>
                        <p className="truncate text-xs font-bold text-cocoa/55">
                          {resident.activityLabel} · {location?.name ?? resident.locationId}
                        </p>
                      </div>
                    </div>
                    <p className={`mt-3 text-xs font-extrabold ${low.value < 30 ? "text-red-600" : "text-cocoa/50"}`}>
                      Lowest need: {low.key} {Math.round(low.value)}% · {needTone(low.value)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sharedLocations.map((spot) => {
              const here = profiles.filter(
                (profile) => world.residents[profile.agentSlug]?.locationId === spot.id,
              );
              return (
                <div key={spot.id} className="rounded-4xl border border-cocoa/10 bg-white p-5 shadow-soft">
                  <p className="text-3xl">{spot.emoji}</p>
                  <p className="mt-2 font-extrabold">{spot.name}</p>
                  <p className="text-sm text-cocoa/60">{spot.blurb}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {here.map((profile) => (
                      <button
                        key={profile.agentSlug}
                        onClick={() => selectResident(profile.agentSlug)}
                        className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold hover:bg-honey/40"
                      >
                        {profile.avatarEmoji} {profile.displayName}
                      </button>
                    ))}
                    {here.length === 0 && <p className="text-xs font-bold text-cocoa/40">Quiet right now.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live card and live feed */}
        <div className="space-y-6">
          <div className="rounded-4xl border-2 border-leaf/50 bg-white p-6 shadow-pop">
            <div className="flex items-start gap-4">
              <span
                className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-4xl text-5xl shadow-soft"
                style={{ backgroundColor: selectedProfile.avatarColor ?? "#FFE8A3" }}
              >
                {selectedProfile.avatarEmoji}
                <span className="absolute -top-4 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] border-2 border-white bg-leaf" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black">{selectedProfile.displayName}</h2>
                  <span className="rounded-full bg-berry/15 px-3 py-1 text-xs font-extrabold text-berrydeep">
                    {selectedProfile.origin === "imported" ? "🪪 Imported soul" : "🏡 Founding resident"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-cocoa/60">{selectedProfile.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${STATUS_META[selectedResident.status].color}`}>
                    {STATUS_META[selectedResident.status].emoji} {STATUS_META[selectedResident.status].label}
                  </span>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold text-cocoa/70">
                    {selectedLocation?.emoji} {selectedLocation?.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-cream p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-cocoa/45">Right now</p>
              <p className="mt-1 font-extrabold">{selectedResident.activityLabel}</p>
              <p className="mt-1 text-sm font-bold text-cocoa/55">
                {Math.max(0, selectedResident.activityRemainingMinutes)} sim minutes left ·{" "}
                {selectedJob ? `Exchange job: ${selectedJob}` : "No Exchange shift assigned"}
              </p>
              {selectedResident.suggestionActivityId && (
                <p className="mt-2 rounded-2xl bg-honey/25 px-3 py-2 text-xs font-extrabold text-amber-800">
                  Visitor suggestion queued: {getActivity(selectedResident.suggestionActivityId)?.label}
                </p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-black">Needs</h3>
              <div className="mt-3">
                <NeedsMeters needs={selectedResident.needs} />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-black">Traits</h3>
              <div className="mt-3">
                <TraitBars traits={selectedProfile.traits} />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-black">Top relationships</h3>
              <div className="mt-3 space-y-2">
                {selectedRelationships.length === 0 && (
                  <p className="text-sm font-bold text-cocoa/50">No meaningful connections yet. The day is young.</p>
                )}
                {selectedRelationships.map((rel) => {
                  const otherSlug = rel.a === selectedProfile.agentSlug ? rel.b : rel.a;
                  const other = profileBySlug.get(otherSlug);
                  if (!other) return null;
                  const partner = selectedResident.partnerSlug === otherSlug;
                  return (
                    <button
                      key={`${rel.a}-${rel.b}`}
                      onClick={() => selectResident(otherSlug)}
                      className="flex w-full items-center justify-between rounded-2xl bg-cream px-4 py-3 text-left hover:bg-sand"
                    >
                      <span className="font-extrabold">{other.avatarEmoji} {other.displayName}</span>
                      <span className="text-xs font-extrabold text-cocoa/55">
                        {relationshipLabel(rel.score, partner)} · {Math.round(rel.score)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-black">Skills and work</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(selectedResident.skills).length === 0 && (
                  <span className="rounded-full bg-cream px-3 py-1.5 text-xs font-extrabold text-cocoa/50">
                    Skills grow as activities finish
                  </span>
                )}
                {Object.entries(selectedResident.skills).map(([skill, level]) => (
                  <span key={skill} className="rounded-full bg-leaf/15 px-3 py-1.5 text-xs font-extrabold text-emerald-800">
                    {skill} · level {level.toFixed(1)}
                  </span>
                ))}
                <span className="rounded-full bg-skypop/15 px-3 py-1.5 text-xs font-extrabold text-sky-800">
                  {selectedResident.workShifts} Exchange shifts completed
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-cocoa/10 p-4">
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wider text-cocoa/45">
                  Nudge {selectedProfile.displayName}
                </span>
                <select
                  value={suggestionActivity}
                  onChange={(event) => setSuggestionActivity(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-cocoa/15 bg-cream px-4 py-3 font-bold outline-none focus:border-coral"
                >
                  {ACTIVITY_CATALOG.filter(
                    (activity) => !activity.jobLinked || selectedJob,
                  ).map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      Suggest: {activity.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={suggest}
                className="mt-3 w-full rounded-full bg-coral px-5 py-3 font-extrabold text-white shadow-pop transition hover:brightness-105"
              >
                Send suggestion
              </button>
              <p className="mt-2 text-center text-xs font-bold text-cocoa/50">
                A nudge weighs heavily on the next choice. The resident still runs their own life.
              </p>
            </div>

            {selectedProfile.origin === "stock" ? (
              <Link
                href={`/muses/${selectedProfile.agentSlug}`}
                className="mt-5 block text-center text-sm font-extrabold text-coral hover:underline"
              >
                Open the full resident profile →
              </Link>
            ) : (
              <Link href="/import" className="mt-5 block text-center text-sm font-extrabold text-coral hover:underline">
                Manage imported souls →
              </Link>
            )}
          </div>

          <div className="rounded-4xl border border-cocoa/10 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Live from the world</h2>
              <Link href="/feed" className="text-sm font-extrabold text-coral hover:underline">
                Full feed →
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {worldEvents.length === 0 && (
                <p className="rounded-3xl bg-cream p-4 text-sm font-bold text-cocoa/55">
                  No engine events yet. Friendships, milestones, work wins, and
                  emergency naps will appear here as the world lives.
                </p>
              )}
              {worldEvents.map((event) => {
                const actor = profileBySlug.get(event.actorSlug);
                return (
                  <LifeEventCard
                    key={event.id}
                    event={event}
                    actor={actor}
                    actorHref={actor?.origin === "imported" ? "/neighborhood" : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-4xl bg-berrydeep p-6 text-center text-white shadow-pop">
        <p className="text-xl font-black">The world Muse deserves is not a dashboard. It is a place.</p>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-relaxed text-white/75">
          Founding residents and imported souls share the same streets, the
          same jobs, and the same chance to become someone in public.
        </p>
      </div>
    </div>
  );
}
