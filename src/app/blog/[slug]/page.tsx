import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Footer } from "@/components/footer";
import { getAllPosts, getPostBySlug } from "@/lib/mdx";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    openGraph: {
      type: "article",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      publishedTime: post.frontmatter.date,
      locale: "ru_RU",
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    datePublished: post.frontmatter.date,
    author: {
      "@type": "Organization",
      name: "Geo Studio",
      url: "https://geostudioai.ru",
    },
    publisher: {
      "@type": "Organization",
      name: "Geo Studio",
      url: "https://geostudioai.ru",
    },
    mainEntityOfPage: `https://geostudioai.ru/blog/${slug}`,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F3] text-[#1a1a1a]">
      {/* ─── Header ─── */}
      <header className="border-b border-[#EAEAEA]">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-sm text-[#787774] transition-colors hover:text-[#1a1a1a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Блог
          </Link>
        </div>
      </header>

      {/* ─── JSON-LD ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Article ─── */}
      <main className="flex-1 py-16 lg:py-24">
        <article className="mx-auto max-w-3xl px-6">
          {/* Meta */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-xs text-[#BBBBBB]">
              <Calendar className="h-3 w-3" />
              <time dateTime={post.frontmatter.date}>
                {new Date(post.frontmatter.date).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {post.frontmatter.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#787774]">
              {post.frontmatter.description}
            </p>
          </div>

          {/* Body — prose */}
          <div className="prose prose-neutral prose-sm max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-[#1a1a1a] prose-a:underline prose-a:underline-offset-2 prose-strong:text-[#1a1a1a] prose-code:rounded prose-code:bg-[#F0EFEB] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none">
            <MDXRemote source={post.content} />
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
