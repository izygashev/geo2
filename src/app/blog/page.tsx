import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { Footer } from "@/components/footer";
import { getAllPosts } from "@/lib/mdx";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Блог — Geo Studio",
  description:
    "Статьи о Generative Engine Optimization, AI-видимости бренда и оптимизации для нейросетей. " +
    "Практические руководства по GEO от команды Geo Studio.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F3] text-[#1a1a1a]">
      {/* ─── Header ─── */}
      <header className="border-b border-[#EAEAEA]">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[#787774] transition-colors hover:text-[#1a1a1a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Главная
          </Link>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Блог
          </h1>
          <p className="mt-2 text-sm text-[#787774]">
            Статьи о GEO, AI-видимости и оптимизации для нейросетей
          </p>

          {posts.length === 0 ? (
            <p className="mt-16 text-center text-sm text-[#BBBBBB]">
              Статьи скоро появятся.
            </p>
          ) : (
            <div className="mt-12 space-y-1">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group -mx-4 flex flex-col gap-1 rounded-xl px-4 py-5 transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-2 text-xs text-[#BBBBBB]">
                    <Calendar className="h-3 w-3" />
                    <time dateTime={post.frontmatter.date}>
                      {new Date(post.frontmatter.date).toLocaleDateString(
                        "ru-RU",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </time>
                  </div>
                  <h2 className="text-base font-semibold tracking-tight text-[#1a1a1a] group-hover:text-[#333]">
                    {post.frontmatter.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#787774]">
                    {post.frontmatter.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
