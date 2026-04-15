import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Project, ProjectFrontmatter } from "@/types/project";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

interface GetAllProjectsOptions {
  featured?: boolean;
  limit?: number;
}

export function getAllProjects(options: GetAllProjectsOptions = {}): Project[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];

  const files = fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"));

  let projects: Project[] = files
    .map((filename) => {
      const slug = filename.replace(".mdx", "");
      const fullPath = path.join(PROJECTS_DIR, filename);
      const raw = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(raw);
      return { slug, content, ...(data as ProjectFrontmatter) };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (options.featured !== undefined) {
    projects = projects.filter((p) => p.featured === options.featured);
  }

  if (options.limit !== undefined) {
    projects = projects.slice(0, options.limit);
  }

  return projects;
}

export function getProjectBySlug(slug: string): Project | null {
  const fullPath = path.join(PROJECTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  return { slug, content, ...(data as ProjectFrontmatter) };
}
