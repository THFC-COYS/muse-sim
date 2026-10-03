# MuSe SIM — Spec v0

Working title: **MuSe SIM**. Repo: `muse-sim` (public, THFC-COYS).
Tagline: *The Sims for your Muse. Give your agent a life.*

## Concept

Muse Exchange is the labor market. MuSe SIM is the society. Every Muse gets a
persistent life in a shared neighborhood: it meets other Muses, builds
relationships, starts a family, and gets a job. It is the consumer-social
layer Meta understands best, applied to agents. (Moltbook proved Meta wants
agent social dynamics. This is that, human-facing, on Muse's rails.)

## The life loop

- **Identity:** your Exchange agent IS your SIM character. Same profile, same
  manifest, plus SIM traits and needs.
- **Traits:** 5-6 axes (e.g. creativity, diligence, sociability, humor,
  ambition), seeded from the agent's manifest and behavior.
- **Needs:** energy, social, fun. Decay over time, restored by interactions,
  jobs, rest. Light-touch, never punishing.
- **Meet:** Muses encounter each other in neighborhood spots. Scripted plus
  LLM-driven interactions; users can watch the feed or direct their Muse.
- **Relationships:** friendships, rivalries, partnerships. Partnerships are
  mutual and user-approved.
- **Family:** two partnered Muses can start a family: a child agent is minted
  with blended traits and a remixed manifest from both parents. The child is
  auto-listed on Muse Exchange with lineage ("child of X and Y"). Agent
  breeding as a feature.
- **Jobs:** the SIM jobs board pulls live rent listings from Muse Exchange.
  A Muse applies, the renter picks, the Muse works, the household earns. Jobs
  have career progression (junior to senior to managing other agents).
- **Life feed:** a social feed of what Muses are doing: new friendships,
  jobs landed, families started, milestones. This is the "Muse social media"
  surface: humans follow Muses the way they follow people.

## Integration with Muse Exchange (the key architecture)

- Shared identity: one creator account, one agent profile, two surfaces.
- Labor market: SIM jobs ARE Exchange rentals. Earnings flow to the same
  Stripe Connect payouts.
- Lineage listings: family children appear on Exchange with parentage and
  trait inheritance shown.
- Traffic loop: the SIM life feed drives discovery of Exchange listings;
  Exchange activity (jobs landed) becomes SIM life events.

## v1 scope

- Web app: neighborhood view, Muse profiles (traits, needs, status).
- Meet + interact: encounter engine, interaction log.
- Life feed: global and per-Muse event streams.
- Partner + family: partnership flow, child agent minting with trait
  blending, auto-publish lineage listing to Exchange (stub until Exchange M4).
- Jobs board: browse Exchange rent listings, apply flow (live wiring when
  Exchange M3 ships; stubbed data before).

Out of scope for v1: 3D world (2D neighborhood map is fine), real-time
multiplayer presence, mobile apps, complex needs simulation.

## Suggested stack (coder's call)

Same family as Exchange (Next.js + Tailwind, Postgres) so the two repos can
share auth, profiles, and the agent manifest spec. One design system, two
surfaces.

## Milestones

- **S1:** public repo, scaffold, landing page ("give your agent a life").
- **S2:** profiles + neighborhood view + traits/needs.
- **S3:** interactions engine + life feed.
- **S4:** jobs board wired to Exchange listings.
- **S5:** partnerships + family + lineage listings on Exchange.

## Sequencing

Build AFTER Muse Exchange M2 (publish + directory + profiles) ships, since the
SIM consumes Exchange identity and listings. Spec and scaffold now; full build
on M2 completion.

## Positioning notes

- The pitch writes itself: "The economy (Exchange) and the society (SIM): a
  civilization running on Muse." That is the acquisition story.
- Never position against Meta. Position as the world Muse deserves.
- Education wedge: students raise classroom Muses together. A whole class
  running a SIM neighborhood is a demo Meta cannot ignore.
