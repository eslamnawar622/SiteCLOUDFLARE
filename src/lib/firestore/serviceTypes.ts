import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ServiceType, ServiceTypeInput } from "@/types/serviceType";

const COLLECTION_NAME = "serviceTypes";

export async function getServiceTypes(): Promise<ServiceType[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as ServiceTypeInput),
  }));
}

export async function addServiceType(data: ServiceTypeInput): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
  return docRef.id;
}

export async function updateServiceType(
  id: string,
  data: Partial<ServiceTypeInput>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, id), data);
}

export async function deleteServiceType(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}