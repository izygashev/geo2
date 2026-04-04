import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProjectSettingsForm } from "@/components/project-settings-form";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      url: true,
      competitorUrls: true,
      brandLogoUrl: true,
      brandAccentColor: true,
      userId: true,
    },
  });

  if (!project || project.userId !== session.user.id) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const competitorUrls = Array.isArray(project.competitorUrls)
    ? (project.competitorUrls as string[])
    : [];

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#787774] transition-colors hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Все проекты
      </Link>

      <div className="mb-8">
        <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">
          {project.name}
        </h1>
        <p className="mt-1 text-sm text-[#787774]">
          Настройки проекта · {project.url}
        </p>
      </div>

      <div className="max-w-2xl">
        <ProjectSettingsForm
          projectId={project.id}
          projectName={project.name}
          competitorUrls={competitorUrls}
          brandLogoUrl={project.brandLogoUrl}
          brandAccentColor={project.brandAccentColor}
          userPlan={user?.plan ?? "FREE"}
        />
      </div>
    </div>
  );
}
