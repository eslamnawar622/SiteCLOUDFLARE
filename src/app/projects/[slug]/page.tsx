import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/firestore/projects";
import { getSettings } from "@/lib/firestore/settings";
import ProjectGalleryLightbox from "@/components/projects/ProjectGalleryLightbox";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([
    getProjectBySlug(slug),
    getSettings(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary-dark transition-colors mb-8"
        >
          ← الرجوع لكل المشاريع
        </Link>

        <ProjectGalleryLightbox
          mainImage={project.mainImage}
          gallery={project.gallery || []}
          title={project.title}
          badgeText={project.badgeText}
          magnifierSize={settings?.magnifierSize}
          magnifierZoom={settings?.magnifierZoom}
        />

        <div className="mb-8 mt-6">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {project.title}
          </h1>
          <div className="flex items-center gap-4 text-text-muted mb-4">
            <span>{project.location}</span>
            <span className="w-1 h-1 rounded-full bg-border-custom" />
            <span>{project.year}</span>
            {project.type && (
              <>
                <span className="w-1 h-1 rounded-full bg-border-custom" />
                <span>{project.type}</span>
              </>
            )}
          </div>
          <p className="text-text-secondary leading-relaxed text-lg whitespace-pre-line">
            {project.description || project.shortDescription}
          </p>
        </div>
      </div>
    </div>
  );
}