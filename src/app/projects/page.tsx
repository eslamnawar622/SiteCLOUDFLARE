import { getAllProjects } from "@/lib/firestore/projects";
import ProjectsGrid from "@/components/home/ProjectsGrid";

export const dynamic = "force-dynamic";

export default async function AllProjectsPage() {
  const projects = await getAllProjects();

  return (
    <main className="bg-surface min-h-screen py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-primary">
            كل المشاريع
          </h1>
          <p className="text-text-secondary mt-2">
            تصفح كل أعمالنا في التصميم المعماري والداخلي
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            لا توجد مشاريع لعرضها حالياً
          </div>
        ) : (
          <ProjectsGrid projects={projects} />
        )}
      </div>
    </main>
  );
}