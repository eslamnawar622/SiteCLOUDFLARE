import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

export interface Client {
  id: string;
  name: string;
  logoUrl: string;
  order: number;
}

export interface ClientsSectionSettings {
  title: string;
  subtitle: string;
}

export async function getClients(): Promise<Client[]> {
  const q = query(collection(db, "clients"), orderBy("order", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name || "",
    logoUrl: doc.data().logoUrl || "",
    order: doc.data().order || 0,
  }));
}

// إضافة عميل جديد
export async function addClient(data: {
  name: string;
  logoUrl: string;
  order: number;
}): Promise<string> {
  const docRef = await addDoc(collection(db, "clients"), data);
  return docRef.id;
}

// تعديل عميل موجود
export async function updateClient(
  id: string,
  data: Partial<{ name: string; logoUrl: string; order: number }>
): Promise<void> {
  const clientRef = doc(db, "clients", id);
  await updateDoc(clientRef, data);
}

// حذف عميل
export async function deleteClient(id: string): Promise<void> {
  const clientRef = doc(db, "clients", id);
  await deleteDoc(clientRef);
}

// ✅ الجديد: قراءة إعدادات قسم العملاء
export async function getClientsSectionSettings(): Promise<ClientsSectionSettings> {
  const docRef = doc(db, "settings", "clientsSection");
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    return snapshot.data() as ClientsSectionSettings;
  }

  // القيم الافتراضية لو مفيش حاجة محفوظة
  return {
    title: "عملاؤنا",
    subtitle: "نفتخر بثقة كبرى الشركات والعلامات التجارية في مصر والوطن العربي",
  };
}

// ✅ الجديد: حفظ إعدادات قسم العملاء
export async function updateClientsSectionSettings(
  settings: ClientsSectionSettings
): Promise<void> {
  const docRef = doc(db, "settings", "clientsSection");
  await setDoc(docRef, settings);
}