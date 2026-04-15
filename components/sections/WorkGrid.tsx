import Link from "next/link";
import { SpecLabel } from "@/components/ui/SpecLabel";
import { CircuitDivider } from "@/components/ui/CircuitDivider";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { ExperienceList } from "@/components/sections/ExperienceList";
import type { Project } from "@/types/project";

interface WorkGridProps {
  projects: Project[];
  isPreview?: boolean;
}

export function WorkGrid({ projects, isPreview = false }: WorkGridProps) {
  return (
    <section className="px-6 md:px-12 max-w-7xl mx-auto py-24">
      <div className="mb-4">
        <SpecLabel label="Work" />
      </div>
      <CircuitDivider className="mb-10" />

      <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight mb-14">
        Work
      </h2>

      {/* Experience */}
      <ExperienceList />

      {/* Divider between experience and projects */}
      <CircuitDivider className="my-14" />

      {/* Projects */}
      <div className="flex items-end justify-between mb-8">
        <SpecLabel label="Projects" />
        {isPreview && projects.length > 0 && (
          <Link
            href="/work"
            className="font-display text-2xs tracking-[0.12em] uppercase text-fog hover:text-signal transition-colors duration-150"
          >
            All work →
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <p className="font-body text-sm text-fog">No projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {projects.map((project, i) => (
            <div key={project.slug} className="bg-void">
              <ProjectCard project={project} index={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
