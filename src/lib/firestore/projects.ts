import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project } from "@/types/project";

function mapDoc(id: string, data: DocumentData): Project {
  return {
    id,
    slug: data.slug,
    title: data.title,
    location: data.location,
    type: data.type,
    year: data.year,
    description: data.description,
    shortDescription: data.shortDescription,
    mainImage: data.mainImage,
    gallery: data.gallery || [],
    galleryKeys: data.galleryKeys || [],
    featured: data.featured,
    badgeText: data.badgeText || "",
    cardWidth: data.cardWidth ?? undefined,
    cardHeight: data.cardHeight ?? undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const projectsRef = collection(db, "projects");
  const q = query(
    projectsRef,
    where("featured", "==", true),
    orderBy("createdAt", "desc"),
    limit(8)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc(d.id, d.data()));
}

export async function getAllProjects(): Promise<Project[]> {
  const projectsRef = collection(db, "projects");
  const q = query(projectsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc(d.id, d.data()));
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projectsRef = collection(db, "projects");
  const q = query(projectsRef, where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return mapDoc(d.id, d.data());
}

// ✅ إضافة مشروع جديد
export async function addProject(
  data: Omit<Project, "id" | "createdAt">
): Promise<string> {
  const projectsRef = collection(db, "projects");
  const docRef = await addDoc(projectsRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// ✅ تعديل مشروع موجود
export async function updateProject(
  id: string,
  data: Partial<Omit<Project, "id" | "createdAt">>
): Promise<void> {
  const projectRef = doc(db, "projects", id);
  await updateDoc(projectRef, data);
}

// ✅ حذف مشروع
export async function deleteProject(id: string): Promise<void> {
  const projectRef = doc(db, "projects", id);
  await deleteDoc(projectRef);
}