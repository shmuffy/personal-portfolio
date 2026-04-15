import { SpecLabel } from "@/components/ui/SpecLabel";
import { Tag } from "@/components/ui/Tag";

const experiences = [
  {
    org: "Highlander Space Program",
    subtitle: "Liquid Propulsion Rocketry Club",
    role: "Payload Lead Engineer / PCB Librarian",
    period: "May 2025 – Present",
    tags: ["CubeSat", "BMS", "Altium", "Ethernet PCB"],
  },
  {
    org: "Aviat'R",
    subtitle: "Unmanned Autonomous Drone Club",
    role: "Avionics Lead / Co-Founder",
    period: "Mar 2024 – Oct 2025",
    tags: ["Power Distribution", "RF", "RFD900x"],
  },
  {
    org: "Trustworthy Autonomous Systems Lab",
    subtitle: "UC Riverside",
    role: "Undergraduate Research Assistant",
    period: "Oct 2024 – Jan 2025",
    tags: ["Gaussian Splatting", "ROS", "RTX 4090"],
  },
  {
    org: "Highlander Racing",
    subtitle: "Formula SAE Electric",
    role: "Associate / Electrical Systems Engineer",
    period: "Aug 2023 – Dec 2024",
    tags: ["BMS", "CAN Bus", "Sensor Hub", "400V"],
  },
];

export function ExperienceList() {
  return (
    <div>
      <div className="mb-6">
        <SpecLabel label="Experience" />
      </div>
      <div>
        {experiences.map((exp, i) => (
          <div
            key={exp.org}
            className={`py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${
              i < experiences.length - 1 ? "border-b border-border-dim" : ""
            }`}
          >
            <div className="flex-1">
              <h3 className="font-display text-sm font-medium text-white mb-0.5">
                {exp.org}
              </h3>
              <p className="font-body text-sm text-signal mb-0.5">{exp.role}</p>
              <p className="font-body text-xs text-fog mb-3">{exp.subtitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {exp.tags.map((tag) => (
                  <Tag key={tag} label={tag} />
                ))}
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="font-body text-xs text-fog tracking-wide">
                {exp.period}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
