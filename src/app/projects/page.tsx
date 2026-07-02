import { getAllProjects } from "@/lib/firestore/projects";
import Image from "next/image";
import Link from "next/link";

export default async function AllProjectsPage() {
  const projects = await getAllProjects();

  return (
    <main className="bg-white min-h-screen py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-stone-900">
            كل المشاريع
          </h1>
          <p className="text-stone-500 mt-2">
            تصفح كل أعمالنا في التصميم المعماري والداخلي
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            لا توجد مشاريع لعرضها حالياً
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group block bg-stone-50 rounded-2xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={project.mainImage}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-stone-700">
                    {project.type}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-amber-700 transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-stone-500 mb-3">
                    <span>{project.location}</span>
                    <span className="w-1 h-1 rounded-full bg-stone-300" />
                    <span>{project.year}</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed line-clamp-2">
                    {project.shortDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}