import { SpecLabel } from "@/components/ui/SpecLabel";
import { CircuitDivider } from "@/components/ui/CircuitDivider";

const sidebarData = [
  { label: "Location", value: "Riverside, CA" },
  { label: "Degree", value: "B.S. Electrical Engineering — Control & Robotics" },
  { label: "Institution", value: "UC Riverside, Expected June 2026" },
  { label: "GPA", value: "3.46 / 4.00" },
  { label: "Focus", value: "Power Electronics · Embedded Systems · RF / SDR" },
];

const toolStack = [
  { label: "EDA / CAD", value: "Altium Designer, LTSpice, OnShape" },
  { label: "RF / FPGA", value: "GNU Radio, Vivado / Vitis" },
  { label: "Programming", value: "Python, MATLAB, C++" },
  { label: "Protocols", value: "CAN, SPI, I²C, UART, USB" },
  { label: "Manufacturing", value: "PCB assembly, soldering, 3D printing" },
];

export function About() {
  return (
    <section className="px-6 md:px-12 max-w-7xl mx-auto py-24">
      <div className="mb-4">
        <SpecLabel label="About" />
      </div>
      <CircuitDivider className="mb-10" />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16">
        {/* Bio — left 3 cols */}
        <div className="md:col-span-3 space-y-5">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
            About
          </h2>
          <p className="font-body text-base text-static leading-relaxed">
            Electrical engineering student at UC Riverside specializing in
            Control and Robotics. Building hardware at the intersection of
            high-voltage power electronics, embedded firmware, and RF systems.
          </p>
          <p className="font-body text-base text-static leading-relaxed">
            Payload Lead at the Highlander Space Program, Co-Founder of
            Aviat&apos;R UAV club, and former electrical systems engineer on
            Formula SAE Electric. Projects range from CubeSat battery management
            cards to FPGA-based software-defined radios.
          </p>
          <p className="font-body text-base text-static leading-relaxed">
            Driven by signal integrity, deterministic fault behavior, and the
            discipline of getting it right before it flies — or crashes.
          </p>

          {/* Tool stack */}
          <div className="pt-4 space-y-4 border-t border-border-dim">
            {toolStack.map(({ label, value }) => (
              <div key={label} className="flex gap-6">
                <SpecLabel label={label} className="shrink-0 w-28" />
                <p className="font-body text-sm text-signal">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Metadata — right 2 cols */}
        <div className="md:col-span-2 space-y-6">
          {sidebarData.map(({ label, value }) => (
            <div key={label}>
              <SpecLabel label={label} className="block mb-1" />
              <p className="font-body text-sm text-signal leading-snug">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
