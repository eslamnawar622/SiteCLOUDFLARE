import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface HeroVideoData {
  desktopVideoUrl: string;
  mobileVideoUrl: string;
  desktopPosterFrame?: number; // ✅ فريم غلاف اللاب (بالثواني)
  mobilePosterFrame?: number;  // ✅ فريم غلاف الموبايل (بالثواني)
  updatedAt?: number;
}

const HERO_DOC_REF = doc(db, "settings", "heroVideo");

export async function getHeroVideo(): Promise<HeroVideoData | null> {
  const snap = await getDoc(HERO_DOC_REF);
  if (!snap.exists()) return null;
  return snap.data() as HeroVideoData;
}

export async function updateHeroVideo(data: Partial<HeroVideoData>): Promise<void> {
  await setDoc(
    HERO_DOC_REF,
    { ...data, updatedAt: Date.now() },
    { merge: true }
  );
}

export function subscribeToHeroVideo(
  callback: (data: HeroVideoData | null) => void
) {
  return onSnapshot(HERO_DOC_REF, (snap) => {
    callback(snap.exists() ? (snap.data() as HeroVideoData) : null);
  });
}

// ✅ حذف حقل من Firestore
export async function clearHeroVideoField(
  field:
    | "desktopVideoUrl"
    | "mobileVideoUrl"
    | "desktopPosterFrame"
    | "mobilePosterFrame"
): Promise<void> {
  await setDoc(
    HERO_DOC_REF,
    { [field]: "", updatedAt: Date.now() },
    { merge: true }
  );
}