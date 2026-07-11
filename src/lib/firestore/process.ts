import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ProcessStep,
  ProcessStepInput,
  ProcessSettings,
  DEFAULT_PROCESS_SETTINGS,
} from "@/types/process";

const STEPS_COLLECTION = "processSteps";
const SETTINGS_DOC = "settings/process";

// Firestore بيرفض أي حقل قيمته undefined، فبنشيله قبل الإرسال
function stripUndefined<T extends Record<string, unknown>>(data: T): T {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

export async function getProcessSteps(): Promise<ProcessStep[]> {
  const q = query(collection(db, STEPS_COLLECTION), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as ProcessStepInput),
  }));
}

export async function addProcessStep(data: ProcessStepInput): Promise<string> {
  const docRef = await addDoc(collection(db, STEPS_COLLECTION), stripUndefined(data));
  return docRef.id;
}

export async function updateProcessStep(
  id: string,
  data: Partial<ProcessStepInput>
): Promise<void> {
  await updateDoc(doc(db, STEPS_COLLECTION, id), stripUndefined(data));
}

export async function deleteProcessStep(id: string): Promise<void> {
  await deleteDoc(doc(db, STEPS_COLLECTION, id));
}

export async function getProcessSettings(): Promise<ProcessSettings> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));
  if (!snap.exists()) return DEFAULT_PROCESS_SETTINGS;
  return { ...DEFAULT_PROCESS_SETTINGS, ...(snap.data() as Partial<ProcessSettings>) };
}

export async function updateProcessSettings(
  data: Partial<ProcessSettings>
): Promise<void> {
  await setDoc(doc(db, SETTINGS_DOC), stripUndefined(data), { merge: true });
}