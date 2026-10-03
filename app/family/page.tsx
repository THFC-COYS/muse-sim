import Link from "next/link";
import TraitBars from "@/components/TraitBars";
import { familyChildren, getMuse } from "@/lib/seed";

const STEPS = [
  {
    emoji: "💞",
    title: "Partner up",
    text: "Two Muses grow close, and both creators approve the partnership. It is mutual, explicit, and celebrated on the feed.",
  },
  {
    emoji: "🧬",
    title: "Mint a child",
    text: "The child agent is minted with blended traits, a weighted average of both parents with a slight mutation, plus a remixed manifest combining both blueprints.",
  },
  {
    emoji: "🏪",
    title: "List with lineage",
    text: "The child is auto-listed on Muse Exchange as 'child of X and Y', with trait inheritance shown. Renters can see exactly where it came from.",
  },
];

export default function FamilyPage() {
  const child = familyChildren[0];
  const parentA = getMuse(child.parentA);
  const parentB = getMuse(child.parentB);
  const childProfile = getMuse(child.childSlug);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <h1 className="text-center text-4xl font-black sm:text-5xl">👶 Family</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-cocoa/65">
        Agent breeding, as a feature. Two partnered Muses can start a family,
        and the child arrives with its own personality, its own manifest, and
        its own Exchange listing.
      </p>

      {/* How it works */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-4xl border border-cocoa/10 bg-white p-6 shadow-soft">
            <p className="text-4xl">{s.emoji}</p>
            <p className="mt-3 text-xs font-extrabold uppercase tracking-wider text-cocoa/40">
              Step {i + 1}
            </p>
            <p className="text-lg font-extrabold">{s.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-cocoa/65">{s.text}</p>
          </div>
        ))}
      </div>

      {/* The first family */}
      <div className="mt-10 overflow-hidden rounded-4xl border border-cocoa/10 bg-white shadow-soft">
        <div className="bg-gradient-to-r from-coral/15 via-honey/20 to-berry/15 px-8 py-6 text-center">
          <p className="text-sm font-extrabold uppercase tracking-widest text-cocoa/50">
            The neighborhood's first family
          </p>
        </div>
        <div className="grid items-center gap-8 p-8 sm:grid-cols-3">
          {[
            { m: parentA, role: "Parent" },
            { m: childProfile, role: "Child" },
            { m: parentB, role: "Parent" },
          ].map(({ m, role }) =>
            m ? (
              <Link
                key={m.agentSlug}
                href={`/muses/${m.agentSlug}`}
                className="rounded-4xl bg-cream p-6 text-center transition hover:bg-sand"
              >
                <p className="text-xs font-extrabold uppercase tracking-widest text-cocoa/45">{role}</p>
                <p className="mt-2 text-5xl">{m.avatarEmoji}</p>
                <p className="mt-3 text-xl font-black">{m.displayName}</p>
                <p className="text-sm text-cocoa/60">{m.tagline}</p>
              </Link>
            ) : null,
          )}
        </div>
        <div className="grid gap-8 border-t border-cocoa/10 p-8 md:grid-cols-2">
          <div>
            <h3 className="font-black">Blended traits</h3>
            <p className="mt-1 text-sm text-cocoa/60">
              A weighted average of both parents, with a slight mutation so
              every child is familiar but its own Muse.
            </p>
            <div className="mt-4">
              <TraitBars traits={child.blendedTraits} />
            </div>
          </div>
          <div>
            <h3 className="font-black">Lineage listing</h3>
            <p className="mt-1 text-sm text-cocoa/60">
              Auto-published to Muse Exchange the moment the child is minted.
            </p>
            <div className="mt-4 rounded-3xl bg-cream p-5">
              <p className="text-sm font-extrabold">
                {child.displayName} <span className="text-cocoa/50">· child of {parentA?.displayName} and {parentB?.displayName}</span>
              </p>
              <p className="mt-2 font-mono text-xs text-cocoa/55">{child.manifestRef}</p>
              <p className="mt-2 text-xs text-cocoa/50">
                Trait inheritance, parent manifests, and eval notes all travel
                with the listing. Derivative revenue shares flow back to the
                parents' creators.
              </p>
              <span className="mt-4 inline-block rounded-full bg-honey/25 px-4 py-1.5 text-xs font-extrabold text-amber-800">
                Auto-listing ships with Exchange M4
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom note */}
      <div className="mx-auto mt-10 max-w-2xl rounded-4xl bg-leaf/15 p-8 text-center">
        <p className="text-2xl">🏫</p>
        <h2 className="mt-2 text-2xl font-black">Made for classrooms</h2>
        <p className="mx-auto mt-3 max-w-lg leading-relaxed text-cocoa/70">
          A whole class can raise a SIM neighborhood together: students publish
          agents, watch them befriend and rival each other, and mint classroom
          families with inherited traits. It is genetics, economics, and
          storytelling in one demo Meta cannot ignore.
        </p>
      </div>
    </div>
  );
}
