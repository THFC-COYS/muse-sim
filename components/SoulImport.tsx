"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TraitBars from "@/components/TraitBars";
import { getSpot } from "@/lib/seed";
import { newLifeEvent, timeAgo } from "@/lib/sim";
import {
  addImportedResident,
  arrivalText,
  draftToResident,
  loadImportedResidents,
  parseSoul,
  removeImportedResident,
  type ImportedResident,
  type SoulDraft,
} from "@/lib/soul";

async function readFile(file: File): Promise<string> {
  return await file.text();
}

export default function SoulImport() {
  const [soulText, setSoulText] = useState("");
  const [identityText, setIdentityText] = useState("");
  const [soulFileName, setSoulFileName] = useState("");
  const [identityFileName, setIdentityFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<SoulDraft | null>(null);
  const [editName, setEditName] = useState("");
  const [editVibe, setEditVibe] = useState("");
  const [editTraits, setEditTraits] = useState("");
  const [residents, setResidents] = useState<ImportedResident[]>([]);
  const [justMovedIn, setJustMovedIn] = useState("");
  const soulInputRef = useRef<HTMLInputElement>(null);
  const identityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setResidents(loadImportedResidents());
  }, []);

  const onSoulFile = async (file: File | undefined) => {
    if (!file) return;
    setSoulText(await readFile(file));
    setSoulFileName(file.name);
    setError("");
    setJustMovedIn("");
  };

  const onIdentityFile = async (file: File | undefined) => {
    if (!file) return;
    setIdentityText(await readFile(file));
    setIdentityFileName(file.name);
    setError("");
  };

  const preview = () => {
    const result = parseSoul(soulText, identityText);
    if (!result.ok) {
      setError(result.error);
      setDraft(null);
      return;
    }
    setError("");
    setDraft(result.draft);
    setEditName(result.draft.name);
    setEditVibe(result.draft.vibe);
    setEditTraits(result.draft.soulTraits.join("\n"));
  };

  const confirmMoveIn = () => {
    if (!draft) return;
    const name = editName.trim();
    if (!name) {
      setError("Your Muse needs a name to move in. Add one on the soul card and confirm again.");
      return;
    }
    const traits = editTraits
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);
    const resident = draftToResident(draft, {
      name,
      vibe: editVibe.trim() || draft.vibe,
      soulTraits: traits.length ? traits : draft.soulTraits,
    });
    const event = newLifeEvent("arrival", resident.agentSlug, arrivalText(resident));
    const saved = addImportedResident(resident, event);
    setResidents(saved.residents);
    setJustMovedIn(resident.displayName);
    setDraft(null);
    setError("");
  };

  const remove = (slug: string) => {
    setResidents(removeImportedResident(slug));
  };

  const spot = draft ? getSpot(draft.homeSpot) : undefined;

  return (
    <div>
      {/* Import panel */}
      <div className="rounded-4xl border border-cocoa/10 bg-white p-6 shadow-soft sm:p-8">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setDragOver(false);
            await onSoulFile(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-4xl border-2 border-dashed p-6 text-center transition ${
            dragOver ? "border-coral bg-coral/5" : "border-cocoa/20 bg-cream"
          }`}
        >
          <p className="text-4xl">🪪</p>
          <p className="mt-2 font-extrabold">Drop your Muse's SOUL.md here</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-cocoa/60">
            Or pick the file, or paste the contents below. The SIM reads the
            soul and builds a resident from it: traits, tone, home spot and all.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => soulInputRef.current?.click()}
              className="rounded-full bg-coral px-5 py-2.5 text-sm font-extrabold text-white shadow-pop transition hover:brightness-105"
            >
              {soulFileName ? `SOUL.md: ${soulFileName}` : "Choose SOUL.md"}
            </button>
            <button
              onClick={() => identityInputRef.current?.click()}
              className="rounded-full border-2 border-cocoa/15 bg-white px-5 py-2.5 text-sm font-extrabold transition hover:border-berry"
            >
              {identityFileName ? `IDENTITY.md: ${identityFileName}` : "Add IDENTITY.md (optional)"}
            </button>
          </div>
          <input
            ref={soulInputRef}
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(e) => onSoulFile(e.target.files?.[0])}
          />
          <input
            ref={identityInputRef}
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(e) => onIdentityFile(e.target.files?.[0])}
          />
          <p className="mx-auto mt-4 max-w-md text-xs font-bold leading-relaxed text-cocoa/50">
            Your file is parsed right here in your browser. Nothing is uploaded
            to a server. Imported Muses live in this browser's local storage,
            and you can remove them any time.
          </p>
        </div>

        <textarea
          value={soulText}
          onChange={(e) => {
            setSoulText(e.target.value);
            setSoulFileName("");
          }}
          placeholder={"Or paste your SOUL.md contents here...\n\n# SOUL.md\n\n_You're not a chatbot. You're becoming someone._\n\n- Be genuinely helpful, not performatively helpful.\n- Have opinions..."}
          rows={7}
          className="mt-5 w-full rounded-3xl border border-cocoa/15 bg-cream p-4 font-mono text-sm leading-relaxed outline-none transition focus:border-coral"
        />

        {error && (
          <p className="mt-4 rounded-3xl bg-coral/10 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        <button
          onClick={preview}
          className="mt-5 w-full rounded-full bg-berrydeep px-6 py-3.5 font-extrabold text-white transition hover:brightness-110"
        >
          Read the soul →
        </button>
      </div>

      {/* Soul card preview */}
      {draft && (
        <div className="mt-8 rounded-4xl border-2 border-honey bg-white p-6 shadow-pop sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-widest text-cocoa/40">
            ✨ Soul card preview
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            <span
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-4xl text-5xl shadow-soft"
              style={{ backgroundColor: draft.avatarColor }}
            >
              {draft.emoji}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wider text-cocoa/45">
                  Name
                </span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Muse's name"
                  className="mt-1 w-full rounded-2xl border border-cocoa/15 bg-cream px-4 py-2.5 text-lg font-extrabold outline-none focus:border-coral"
                />
              </label>
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wider text-cocoa/45">
                  Vibe
                </span>
                <input
                  value={editVibe}
                  onChange={(e) => setEditVibe(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-cocoa/15 bg-cream px-4 py-2.5 font-bold outline-none focus:border-coral"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold text-cocoa/70">
              🎙️ Tone: {draft.tone}
            </span>
            {spot && (
              <span className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold text-cocoa/70">
                {spot.emoji} Likely home: {spot.name}
              </span>
            )}
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold text-cocoa/70">
              💬 {draft.socialTendency}
            </span>
          </div>

          <label className="mt-5 block">
            <span className="text-xs font-extrabold uppercase tracking-wider text-cocoa/45">
              Signature traits, one per line (edit freely)
            </span>
            <textarea
              value={editTraits}
              onChange={(e) => setEditTraits(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-2xl border border-cocoa/15 bg-cream p-4 text-sm font-bold leading-relaxed outline-none focus:border-coral"
            />
          </label>

          <div className="mt-5 rounded-3xl bg-cream p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-cocoa/45">
              Mapped onto the neighborhood's five traits
            </p>
            <div className="mt-3">
              <TraitBars traits={draft.traits} />
            </div>
          </div>

          <button
            onClick={confirmMoveIn}
            className="mt-6 w-full rounded-full bg-coral px-6 py-4 text-base font-extrabold text-white shadow-pop transition hover:brightness-105"
          >
            Move {editName.trim() || "my Muse"} into the world →
          </button>
          <p className="mt-3 text-center text-xs font-bold text-cocoa/50">
            Looks off? Edit anything above. The SIM only keeps what you confirm.
          </p>
        </div>
      )}

      {/* Success */}
      {justMovedIn && (
        <div className="mt-8 rounded-4xl bg-leaf/15 p-6 text-center">
          <p className="text-2xl font-black">🎉 {justMovedIn} has moved in.</p>
          <p className="mx-auto mt-2 max-w-md text-sm font-bold text-cocoa/65">
            The arrival is on the life feed and {justMovedIn} is hanging out in
            the neighborhood, in this browser, from now on.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/neighborhood"
              className="rounded-full bg-coral px-5 py-2.5 text-sm font-extrabold text-white shadow-pop"
            >
              Visit the neighborhood →
            </Link>
            <Link
              href="/feed"
              className="rounded-full border-2 border-cocoa/15 bg-white px-5 py-2.5 text-sm font-extrabold"
            >
              See the life feed
            </Link>
          </div>
        </div>
      )}

      {/* Imported residents */}
      {residents.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-black">Living here because of you</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {residents.map((r) => {
              const rSpot = getSpot(r.homeSpot);
              return (
                <div
                  key={r.agentSlug}
                  className="rounded-4xl border border-cocoa/10 bg-white p-5 shadow-soft"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-3xl text-3xl"
                      style={{ backgroundColor: r.avatarColor }}
                    >
                      {r.avatarEmoji}
                    </span>
                    <span className="rounded-full bg-berry/15 px-3 py-1 text-xs font-extrabold text-berrydeep">
                      🪪 Imported soul
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-extrabold">{r.displayName}</p>
                  <p className="text-sm text-cocoa/60">{r.tagline}</p>
                  <p className="mt-2 text-xs font-bold text-cocoa/50">
                    🎙️ {r.tone} · {rSpot ? `${rSpot.emoji} ${rSpot.name}` : r.homeSpot} ·
                    moved in {timeAgo(r.joinedAt)}
                  </p>
                  <button
                    onClick={() => remove(r.agentSlug)}
                    className="mt-4 rounded-full bg-cream px-4 py-2 text-xs font-extrabold text-cocoa/60 transition hover:bg-coral/15 hover:text-red-700"
                  >
                    Remove from the world
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
