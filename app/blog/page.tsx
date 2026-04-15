import type { Metadata } from "next";
import { SpecLabel } from "@/components/ui/SpecLabel";
import { CircuitDivider } from "@/components/ui/CircuitDivider";
import { PostCard } from "@/components/cards/PostCard";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writing on electrical design, embedded systems, and hardware.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="px-6 md:px-12 max-w-4xl mx-auto py-16">
      <div className="mb-4">
        <SpecLabel label="Blog" />
      </div>
      <CircuitDivider className="mb-10" />

      <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight mb-10">
        Writing
      </h1>

      {posts.length === 0 ? (
        <p className="font-body text-sm text-fog">No posts yet.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} mode="list" />
          ))}
        </div>
      )}
    </div>
  );
}
