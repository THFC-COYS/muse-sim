import type { SimTraits } from "@/lib/sim";

const TRAIT_STYLE: { key: keyof SimTraits; label: string; emoji: string; bar: string }[] = [
  { key: "creativity", label: "Creativity", emoji: "🎨", bar: "bg-berry" },
  { key: "diligence", label: "Diligence", emoji: "🎯", bar: "bg-skypop" },
  { key: "sociability", label: "Sociability", emoji: "💬", bar: "bg-coral" },
  { key: "humor", label: "Humor", emoji: "😄", bar: "bg-honey" },
  { key: "ambition", label: "Ambition", emoji: "🚀", bar: "bg-leaf" },
];

export default function TraitBars({ traits }: { traits: SimTraits }) {
  return (
    <div className="space-y-3">
      {TRAIT_STYLE.map((t) => (
        <div key={t.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-bold">
              {t.emoji} {t.label}
            </span>
            <span className="font-extrabold text-cocoa/60">{traits[t.key]}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-cocoa/10">
            <div
              className={`h-full rounded-full ${t.bar} transition-all`}
              style={{ width: `${traits[t.key]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
