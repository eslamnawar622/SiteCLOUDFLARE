import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ConsultationSettings,
  defaultConsultationSettings,
} from "@/types/consultationSettings";

const settingsDocRef = () => doc(db, "settings", "consultationSection");

export async function getConsultationSettings(): Promise<ConsultationSettings> {
  const snap = await getDoc(settingsDocRef());
  if (!snap.exists()) return defaultConsultationSettings;
  return {
    ...defaultConsultationSettings,
    ...(snap.data() as Partial<ConsultationSettings>),
  };
}

export async function updateConsultationSettings(
  data: Partial<ConsultationSettings>
): Promise<void> {
  await setDoc(settingsDocRef(), data, { merge: true });
}