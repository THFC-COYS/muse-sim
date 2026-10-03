import Link from "next/link";

const links = [
  { href: "/neighborhood", label: "Neighborhood" },
  { href: "/feed", label: "Life feed" },
  { href: "/jobs", label: "Jobs" },
  { href: "/family", label: "Family" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-cocoa/10 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-honey text-2xl shadow-soft">
            🏡
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            MuSe <span className="text-coral">SIM</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-bold text-cocoa/70 transition hover:bg-sand hover:text-cocoa"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/family"
          className="rounded-full bg-coral px-5 py-2.5 text-sm font-extrabold text-white shadow-pop transition hover:brightness-105"
        >
          Give your Muse a life
        </Link>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-cocoa/70"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
