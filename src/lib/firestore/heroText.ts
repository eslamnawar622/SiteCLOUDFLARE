import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ كل زرار فيه: نص، رابط، وشكل (primary = أزرق معبّى / secondary = شفاف بحدود)
export interface HeroButton {
  id: string;
  text: string;
  link: string;
  style: "primary" | "secondary";
}

export interface HeroTextData {
  title: string;
  subtitle: string;
  description: string;
  buttons: HeroButton[];
  updatedAt?: number;
}

const HERO_TEXT_DOC_REF = doc(db, "settings", "heroText");

export async function getHeroText(): Promise<HeroTextData | null> {
  const snap = await getDoc(HERO_TEXT_DOC_REF);
  if (!snap.exists()) return null;
  return snap.data() as HeroTextData;
}

export async function updateHeroText(
  data: Partial<HeroTextData>
): Promise<void> {
  await setDoc(
    HERO_TEXT_DOC_REF,
    { ...data, updatedAt: Date.now() },
    { merge: true }
  );
}

export function subscribeToHeroText(
  callback: (data: HeroTextData | null) => void
) {
  return onSnapshot(HERO_TEXT_DOC_REF, (snap) => {
    callback(snap.exists() ? (snap.data() as HeroTextData) : null);
  });
}