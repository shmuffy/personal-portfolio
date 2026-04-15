import { Hero } from "@/components/sections/Hero";
import { WorkGrid } from "@/components/sections/WorkGrid";
import { BlogRoll } from "@/components/sections/BlogRoll";
import { getAllProjects } from "@/lib/projects";
import { getAllPosts } from "@/lib/posts";

export default function HomePage() {
  const featuredProjects = getAllProjects({ featured: true, limit: 4 });
  const recentPosts = getAllPosts({ limit: 5 });

  return (
    <>
      <Hero />
      <WorkGrid projects={featuredProjects} isPreview />
      <BlogRoll posts={recentPosts} isPreview />
    </>
  );
}
