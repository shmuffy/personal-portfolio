import Link from "next/link";
import Image from "next/image";
import { Tag } from "@/components/ui/Tag";
import { SpecLabel } from "@/components/ui/SpecLabel";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const projectNumber = String(index + 1).padStart(3, "0");

  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block bg-surface border border-border transition-colors duration-150 hover:border-border-active hover:bg-surface-raised"
    >
      {/* Image area */}
      <div className="relative aspect-video overflow-hidden bg-void">
        <Image
          src={project.coverImage}
          alt={project.title}
          fill
          className="object-cover project-card-image"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-2">
          <SpecLabel label={`PRJ_${projectNumber}`} variant="slash" />
        </div>
        <h3 className="font-display text-base font-medium text-white leading-tight mb-2 truncate">
          {project.title}
        </h3>
        <p className="font-body text-sm text-signal leading-snug mb-4 line-clamp-2">
          {project.excerpt}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
      </div>
    </Link>
  );
}
