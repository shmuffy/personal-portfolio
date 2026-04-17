import Link from "next/link";
import Image from "next/image";
import { Tag } from "@/components/ui/Tag";
import { SpecLabel } from "@/components/ui/SpecLabel";
import { InteractiveModelViewer } from "@/components/ui/InteractiveModelViewer";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const projectNumber = String(index + 1).padStart(3, "0");
  const shouldRender3DPreview = project.slug === "custom-bms-electronic-load";
  const href = `/work/${project.slug}`;

  const content = (
    <>
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
    </>
  );

  return (
    <div className="group block bg-surface border border-border transition-colors duration-150 hover:border-border-active hover:bg-surface-raised">
      {/* Media: keep 3D preview outside <a> so drag/rotate is not a link gesture */}
      <div className="relative aspect-video overflow-hidden bg-void">
        {shouldRender3DPreview ? (
          <InteractiveModelViewer
            src="/models/E-Load.glb"
            alt={`${project.title} 3D preview`}
            className="h-full w-full project-card-3d"
            visibleNodeNames={["PCB"]}
          />
        ) : (
          <Link href={href} className="relative block h-full w-full">
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              className="object-cover project-card-image"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          </Link>
        )}
      </div>

      <Link href={href} className="block p-5">
        {content}
      </Link>
    </div>
  );
}
