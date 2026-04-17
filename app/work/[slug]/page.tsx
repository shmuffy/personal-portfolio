import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import { SpecLabel } from "@/components/ui/SpecLabel";
import { CircuitDivider } from "@/components/ui/CircuitDivider";
import { Tag } from "@/components/ui/Tag";
import { ExplodedModelViewer } from "@/components/ui/ExplodedModelViewer";
import { StudioModelViewer } from "@/components/ui/StudioModelViewer";
import Link from "next/link";

export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.excerpt,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const formattedDate = new Date(project.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="px-6 md:px-12 max-w-4xl mx-auto py-16">
      {/* Back link */}
      <div className="mb-10">
        <Link
          href="/work"
          className="font-display text-2xs tracking-[0.12em] uppercase text-fog hover:text-signal transition-colors duration-150"
        >
          ← Work
        </Link>
      </div>

      {/* Header */}
      <div className="mb-4">
        <SpecLabel label={project.category.toUpperCase()} />
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
        {project.title}
      </h1>
      <p className="font-body text-base text-static mb-6">{project.excerpt}</p>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <span className="font-body text-xs text-fog">{formattedDate}</span>
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
      </div>

      {slug === "custom-bms-electronic-load" && (
        <div className="relative mb-10 w-full aspect-video min-h-[280px] border border-border bg-void overflow-hidden">
          <ExplodedModelViewer
            className="absolute inset-0 h-full min-h-0 w-full"
            src="/models/E-Load.glb"
            alt="Electronic Load — exploded PCB view"
            focusNodeName="PCB"
          />
        </div>
      )}
      {slug === "cubesat-battery-card" && (
        <div className="relative isolate z-[60] mb-10 w-full aspect-[4/3] min-h-[340px] overflow-hidden rounded-2xl border border-[#d6d3d1] bg-gradient-to-b from-[#f5f5f4] to-[#e7e5e4]">
          <StudioModelViewer
            className="absolute inset-0 h-full w-full"
            src="/models/Ejection_Module.glb"
            alt="CubeSat Battery Card 3D render"
          />
        </div>
      )}

      <CircuitDivider className="mb-8" />

      {/* Specs table */}
      {project.specs && Object.keys(project.specs).length > 0 && (
        <div className="mb-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(project.specs).map(([key, val]) => (
            <div key={key}>
              <SpecLabel label={key} className="block mb-0.5" />
              <p className="font-body text-sm text-signal">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      {project.links && (
        <div className="flex flex-wrap gap-4 mb-10">
          {project.links.github && (
            <Link
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-2xs tracking-[0.12em] uppercase text-fog hover:text-signal border border-border hover:border-border-active px-4 py-2 transition-all duration-150"
            >
              GitHub ↗
            </Link>
          )}
          {project.links.schematic && (
            <Link
              href={project.links.schematic}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-2xs tracking-[0.12em] uppercase text-fog hover:text-signal border border-border hover:border-border-active px-4 py-2 transition-all duration-150"
            >
              Schematic ↗
            </Link>
          )}
        </div>
      )}

      <CircuitDivider className="mb-10" />

      {/* MDX content */}
      <div className="mdx-content">
        <MDXRemote
          source={project.content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
            },
          }}
        />
      </div>
    </article>
  );
}
