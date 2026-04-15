import Link from "next/link";
import type { Post } from "@/types/post";

interface PostCardProps {
  post: Post;
  mode?: "list" | "grid";
}

export function PostCard({ post, mode = "list" }: PostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (mode === "list") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group flex items-baseline justify-between gap-4 py-4 border-b border-border-dim transition-colors duration-150 hover:border-border"
      >
        <span className="font-body text-xs text-fog tracking-wide shrink-0 w-24">
          {formattedDate}
        </span>
        <span className="font-display text-sm text-signal flex-1 transition-colors duration-150 group-hover:text-white truncate">
          <span className="text-ghost mr-2 transition-colors duration-150 group-hover:text-fog">
            ▸
          </span>
          {post.title}
        </span>
        <span className="font-body text-xs text-fog shrink-0 hidden sm:block">
          {post.readingTime}
        </span>
      </Link>
    );
  }

  // Grid mode
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-surface border border-border p-5 transition-colors duration-150 hover:border-border-active hover:bg-surface-raised"
    >
      <div className="mb-3">
        <span className="font-body text-xs text-fog tracking-wide">
          {formattedDate}
        </span>
      </div>
      <h3 className="font-display text-base font-medium text-white leading-tight mb-2">
        {post.title}
      </h3>
      <p className="font-body text-sm text-signal leading-relaxed line-clamp-3 mb-4">
        {post.excerpt}
      </p>
      <span className="font-body text-xs text-fog">{post.readingTime}</span>
    </Link>
  );
}
