import { getFeaturedProjects } from "@/lib/firestore/projects";
import Link from "next/link";
import ProjectsGrid from "@/components/home/ProjectsGrid";

export default async function ProjectsPreview() {
  const projects = await getFeaturedProjects();

  if (!projects || projects.length === 0) {
    return (
      <section className="bg-background py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">
              أحدث المشاريع
            </h2>
            <Link
              href="/projects"
              className="text-primary font-medium hover:text-primary-dark transition-colors"
            >
              عرض الكل ←
            </Link>
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
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">
            أحدث المشاريع
          </h2>
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