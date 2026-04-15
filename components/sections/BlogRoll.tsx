import Link from "next/link";
import { SpecLabel } from "@/components/ui/SpecLabel";
import { CircuitDivider } from "@/components/ui/CircuitDivider";
import { PostCard } from "@/components/cards/PostCard";
import type { Post } from "@/types/post";

interface BlogRollProps {
  posts: Post[];
  isPreview?: boolean;
}

export function BlogRoll({ posts, isPreview = false }: BlogRollProps) {
  return (
    <section className="px-6 md:px-12 max-w-7xl mx-auto py-24">
      <div className="mb-4">
        <SpecLabel label="Blog" />
      </div>
      <CircuitDivider className="mb-10" />

      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
          Writing
        </h2>
        {isPreview && posts.length > 0 && (
          <Link
            href="/blog"
            className="font-display text-2xs tracking-[0.12em] uppercase text-fog hover:text-signal transition-colors duration-150"
          >
            All posts →
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="font-body text-sm text-fog">No posts yet.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} mode="list" />
          ))}
        </div>
      )}
    </section>
  );
}
