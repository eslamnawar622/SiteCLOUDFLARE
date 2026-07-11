import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TeamMember } from "@/types/team";

const teamRef = collection(db, "team");

// ✅ جلب كل أعضاء الفريق مرتبين حسب order
export async function getTeamMembers(): Promise<TeamMember[]> {
  const q = query(teamRef, orderBy("order", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      role: data.role,
      bio: data.bio || "",
      photo: data.photo,
      photoKey: data.photoKey || "",
      linkedin: data.linkedin || "",
      order: data.order,
      cardWidth: data.cardWidth || 220,
      cardHeight: data.cardHeight || 220,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}

// ✅ إضافة عضو جديد
export async function addTeamMember(data: {
  name: string;
  role: string;
  bio?: string;
  photo: string;
  photoKey?: string;
  linkedin?: string;
  order: number;
  cardWidth?: number;
  cardHeight?: number;
}): Promise<string> {
  const docRef = await addDoc(teamRef, {
    name: data.name,
    role: data.role,
    bio: data.bio || "",
    photo: data.photo,
    photoKey: data.photoKey || "",
    linkedin: data.linkedin || "",
    order: data.order,
    cardWidth: data.cardWidth || 220,
    cardHeight: data.cardHeight || 220,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// ✅ تعديل عضو موجود
export async function updateTeamMember(
  id: string,
  data: Partial<{
    name: string;
    role: string;
    bio: string;
    photo: string;
    photoKey: string;
    linkedin: string;
    order: number;
    cardWidth: number;
    cardHeight: number;
  }>
): Promise<void> {
  await updateDoc(doc(db, "team", id), data);
}

// ✅ حذف عضو
export async function deleteTeamMember(id: string): Promise<void> {
  await deleteDoc(doc(db, "team", id));
}