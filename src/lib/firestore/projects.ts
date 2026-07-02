import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project } from "@/types/project";

export async function getFeaturedProjects(): Promise<Project[]> {
  const projectsRef = collection(db, "projects");
  const q = query(
    projectsRef,
    where("featured", "==", true),
    orderBy("createdAt", "desc"),
    limit(8)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      slug: data.slug,
      title: data.title,
      location: data.location,
      type: data.type,
      year: data.year,
      description: data.description,
      shortDescription: data.shortDescription,
      mainImage: data.mainImage,
      gallery: data.gallery || [],
      featured: data.featured,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projectsRef = collection(db, "projects");
  const q = query(projectsRef, where("slug", "==", slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    slug: data.slug,
    title: data.title,
    location: data.location,
    type: data.type,
    year: data.year,
    description: data.description,
    shortDescription: data.shortDescription,
    mainImage: data.mainImage,
    gallery: data.gallery || [],
    featured: data.featured,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const projectsRef = collection(db, "projects");
  const q = query(projectsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      slug: data.slug,
      title: data.title,
      location: data.location,
      type: data.type,
      year: data.year,
      description: data.description,
      shortDescription: data.shortDescription,
      mainImage: data.mainImage,
      gallery: data.gallery || [],
      featured: data.featured,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}