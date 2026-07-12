import { getFeaturedProjects } from "@/lib/firestore/projects";
import { getSettings } from "@/lib/firestore/settings";
import Link from "next/link";
import ProjectsGrid from "@/components/home/ProjectsGrid";

export default async function ProjectsPreview() {
  const [projects, settings] = await Promise.all([
    getFeaturedProjects(),
    getSettings(),
  ]);

  const label = settings?.projectsSectionLabel || "أعمالنا";
  const title = settings?.projectsSectionTitle || "أحدث المشاريع";
  const labelSize = settings?.projectsSectionLabelSize || 14;
  const titleSize = settings?.projectsSectionTitleSize || 32;

  if (!projects || projects.length === 0) {
    return (
      <section className="bg-background py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p
              className="text-primary font-semibold mb-3 tracking-wide"
              style={{ fontSize: labelSize }}
            >
              {label}
            </p>
            <span
              className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full"
              style={{ fontSize: titleSize }}
            >
              {title}
            </span>
          </div>
          <div className="text-center py-12 text-text-muted">
            لا توجد مشاريع لعرضها حالياً
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <p
            className="text-primary font-semibold mb-3 tracking-wide"
            style={{ fontSize: labelSize }}
          >
            {label}
          </p>
          <span
            className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full"
            style={{ fontSize: titleSize }}
          >
            {title}
          </span>
        </div>

        <div className="flex justify-end mb-10">
          <Link
            href="/projects"
            className="text-primary font-medium hover:text-primary-dark transition-colors"
          >
            عرض الكل ←
          </Link>
        </div>

        <ProjectsGrid projects={projects} />
      </div>
    </section>
  );
}