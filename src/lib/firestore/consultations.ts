import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function addConsultation(data: {
  name: string;
  phone: string;
  serviceType: string;
  details: string;
}) {
  const consultationsRef = collection(db, "consultations");
  await addDoc(consultationsRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
}