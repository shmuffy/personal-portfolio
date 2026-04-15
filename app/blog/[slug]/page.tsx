import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { SpecLabel } from "@/components/ui/SpecLabel";
import { CircuitDivider } from "@/components/ui/CircuitDivider";
import { Tag } from "@/components/ui/Tag";
import Link from "next/link";

export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="px-6 md:px-12 max-w-3xl mx-auto py-16">
      {/* Back link */}
      <div className="mb-10">
        <Link
          href="/blog"
          className="font-display text-2xs tracking-[0.12em] uppercase text-fog hover:text-signal transition-colors duration-150"
        >
          ← Blog
        </Link>
      </div>

      {/* Header */}
      <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
        {post.title}
      </h1>
      <p className="font-body text-base text-static mb-6">{post.excerpt}</p>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <span className="font-body text-xs text-fog">{formattedDate}</span>
        <span className="font-body text-xs text-fog">{post.readingTime}</span>
      </div>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          {post.tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
      )}

      <CircuitDivider className="mb-10" />

      {/* MDX content */}
      <div className="mdx-content">
        <MDXRemote
          source={post.content}
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
