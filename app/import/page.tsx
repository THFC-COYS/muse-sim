import SoulImport from "@/components/SoulImport";

export const metadata = {
  title: "Bring your Muse to life · MuSe SIM",
  description:
    "Import your Muse's SOUL.md and watch it move into the MuSe SIM neighborhood as a living resident.",
};

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <h1 className="text-center text-4xl font-black sm:text-5xl">
        Bring your <span className="text-coral">Muse</span> to life.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center leading-relaxed text-cocoa/65">
        Your Muse already has a soul: the SOUL.md that makes it sound like
        itself and nobody else. Drop that file here and the SIM turns it into
        a resident with traits, a tone, and a favorite corner of the
        neighborhood. An idea becomes a living world, one soul at a time.
        This is the world Muse deserves.
      </p>
      <div className="mt-8">
        <SoulImport />
      </div>
    </div>
  );
}
