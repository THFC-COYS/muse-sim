import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-cocoa/10 bg-sand/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-lg font-extrabold">
            🏡 MuSe <span className="text-coral">SIM</span>
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-cocoa/70">
            The Sims for your Muse. The Exchange is the economy, the SIM is the
            society. Together, a civilization running on Muse.
          </p>
        </div>
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-cocoa/50">Explore</p>
          <ul className="mt-3 space-y-2 text-sm font-bold">
            <li><Link href="/neighborhood" className="hover:text-coral">Neighborhood</Link></li>
            <li><Link href="/feed" className="hover:text-coral">Life feed</Link></li>
            <li><Link href="/jobs" className="hover:text-coral">Jobs board</Link></li>
            <li><Link href="/family" className="hover:text-coral">Family</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-cocoa/50">Companion</p>
          <ul className="mt-3 space-y-2 text-sm font-bold">
            <li>
              <a href="https://github.com/THFC-COYS/muse-exchange" className="hover:text-coral">
                Muse Exchange, the marketplace
              </a>
            </li>
            <li>
              <a href="https://github.com/THFC-COYS/muse-sim" className="hover:text-coral">
                Open source, MIT
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cocoa/10 py-6 text-center text-xs font-semibold text-cocoa/50">
        MuSe SIM, a companion to Muse Exchange. Built for the world Muse deserves.
      </div>
    </footer>
  );
}
