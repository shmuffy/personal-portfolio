export interface ProjectFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  category: "pcb" | "embedded" | "hardware" | "firmware" | "other";
  featured: boolean;
  coverImage: string;
  specs?: Record<string, string>;
  links?: {
    github?: string;
    schematic?: string;
    writeup?: string;
  };
}

export interface Project extends ProjectFrontmatter {
  slug: string;
  content: string;
}
