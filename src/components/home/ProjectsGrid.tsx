"use client";

import Image from "next/image";
import Link from "next/link";
import FadeInWhenVisible from "@/components/shared/FadeInWhenVisible";
import type { Project } from "@/types/project";

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project, index) => (
        <FadeInWhenVisible key={project.id} delay={index * 0.08}>
          <Link
            href={`/projects/${project.slug}`}
            className="group block bg-surface rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 mx-auto"
            style={
              project.cardWidth
                ? { maxWidth: project.cardWidth, width: "100%" }
                : undefined
            }
          >
            <div
              className={`relative w-full overflow-hidden ${
                project.cardHeight ? "" : "aspect-[4/3]"
              }`}
              style={project.cardHeight ? { height: project.cardHeight } : undefined}
            >
              <Image
                src={project.mainImage}
                alt={project.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute top-3 right-3 bg-surface-raised/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-text-secondary">
                {project.type}
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-text-muted mb-3">
                <span>{project.location}</span>
                <span className="w-1 h-1 rounded-full bg-border-custom" />
                <span>{project.year}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                {project.shortDescription}
              </p>
            </div>
          </Link>
        </FadeInWhenVisible>
      ))}
    </div>
  );
}