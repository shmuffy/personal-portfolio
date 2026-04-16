import { GlitchText } from "@/components/ui/GlitchText";
import { SpecLabel } from "@/components/ui/SpecLabel";
import { CoffeeChatButton } from "@/components/ui/CoffeeChatButton";
import { AphexField } from "@/components/ui/AphexField";

export function Hero() {
  return (
    <section className="relative min-h-[calc(100svh-3rem)] flex flex-col justify-center overflow-hidden">
      {/* Decorative coordinate — top left */}
      <div className="absolute top-6 left-6 md:left-12">
        <SpecLabel label="CK_001" variant="slash" className="text-ghost" />
      </div>

      {/* Main content */}
      <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <AphexField />

        <div className="mb-3">
          <SpecLabel label="Electrical Design Engineer" variant="plain" />
        </div>

        <GlitchText
          as="h1"
          className="font-display font-bold text-white leading-none tracking-tight text-[clamp(2.5rem,8vw,6rem)] mb-6"
        >
          CHRISTIAN KIM
        </GlitchText>

        <p className="font-body text-base md:text-lg text-static max-w-lg mb-4 leading-relaxed mt-8">
          I live in California and design electronics. I build things that
          matter and interface with the physical world.
        </p>

        <div className="mb-10">
          <SpecLabel label="California, USA" variant="plain" />
        </div>

        <CoffeeChatButton />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <span className="scroll-indicator font-body text-sm text-fog select-none">
          ↓
        </span>
      </div>
    </section>
  );
}
