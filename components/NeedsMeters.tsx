import type { SimNeeds } from "@/lib/sim";

const NEEDS: { key: keyof SimNeeds; label: string; emoji: string }[] = [
  { key: "energy", label: "Energy", emoji: "⚡" },
  { key: "social", label: "Social", emoji: "👥" },
  { key: "fun", label: "Fun", emoji: "🎮" },
  { key: "creativity", label: "Creativity", emoji: "🎨" },
  { key: "comfort", label: "Comfort", emoji: "🛋️" },
];

function meterColor(v: number) {
  if (v >= 60) return "bg-leaf";
  if (v >= 30) return "bg-honey";
  return "bg-coral";
}

export default function NeedsMeters({ needs }: { needs: SimNeeds }) {
  return (
    <div className="space-y-3">
      {NEEDS.map((n) => (
        <div key={n.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-bold">
              {n.emoji} {n.label}
            </span>
            <span className="font-extrabold text-cocoa/60">{needs[n.key]}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-cocoa/10">
            <div
              className={`h-full rounded-full ${meterColor(needs[n.key])} transition-all`}
              style={{ width: `${needs[n.key]}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-cocoa/50">
        Needs drift down over time and refill with rest, hangouts, and good work. Gentle by design.
      </p>
    </div>
  );
}
