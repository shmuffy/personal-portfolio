import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { Post, PostFrontmatter } from "@/types/post";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

interface GetAllPostsOptions {
  limit?: number;
}

export function getAllPosts(options: GetAllPostsOptions = {}): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"));

  let posts: Post[] = files
    .map((filename) => {
      const slug = filename.replace(".mdx", "");
      const fullPath = path.join(POSTS_DIR, filename);
      const raw = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(raw);
      const frontmatter = data as PostFrontmatter;
      const stats = readingTime(content);
      return { slug, content, readingTime: stats.text, ...frontmatter };
    })
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (options.limit !== undefined) {
    posts = posts.slice(0, options.limit);
  }

  return posts;
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as PostFrontmatter;
  const stats = readingTime(content);
  return { slug, content, readingTime: stats.text, ...frontmatter };
}
