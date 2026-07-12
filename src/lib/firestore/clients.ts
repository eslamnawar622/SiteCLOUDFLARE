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
  label?: string;        // 👈 جديد: النص الصغير فوق العنوان
  labelSize?: number;    // 👈 جديد: حجم خط النص الصغير
  titleSize?: number;    // 👈 جديد: حجم خط العنوان (الشريط الأزرق)
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

// ✅ قراءة إعدادات قسم العملاء
export async function getClientsSectionSettings(): Promise<ClientsSectionSettings> {
  const docRef = doc(db, "settings", "clientsSection");
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const data = snapshot.data() as ClientsSectionSettings;
    return {
      title: data.title || "عملاؤنا",
      subtitle:
        data.subtitle ||
        "نفتخر بثقة كبرى الشركات والعلامات التجارية في مصر والوطن العربي",
      label: data.label || "شركاؤنا",
      labelSize: data.labelSize || 14,
      titleSize: data.titleSize || 32,
    };
  }

  // القيم الافتراضية لو مفيش حاجة محفوظة
  return {
    title: "عملاؤنا",
    subtitle: "نفتخر بثقة كبرى الشركات والعلامات التجارية في مصر والوطن العربي",
    label: "شركاؤنا",
    labelSize: 14,
    titleSize: 32,
  };
}

// ✅ حفظ إعدادات قسم العملاء
export async function updateClientsSectionSettings(
  settings: ClientsSectionSettings
): Promise<void> {
  const docRef = doc(db, "settings", "clientsSection");
  await setDoc(docRef, settings, { merge: true });
}