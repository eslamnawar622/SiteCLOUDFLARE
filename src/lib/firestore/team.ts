import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TeamMember } from "@/types/team";

export async function getTeamMembers(): Promise<TeamMember[]> {
  const teamRef = collection(db, "team");
  const q = query(teamRef, orderBy("order", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      role: data.role,
      bio: data.bio,
      photo: data.photo,
      linkedin: data.linkedin || "",
      order: data.order,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}