import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface HeroButton {
  id: string;
  text: string;
  link: string;
  linkType: string;
  style: "primary" | "secondary";
}

export interface SettingsData {
  // 📱 واتساب
  whatsappNumber: string;
  whatsappMessage?: string;
  // 🔍 عدسة التكبير
  magnifierSize?: number;
  magnifierZoom?: number;
  // 🖼️ اللوجو
  logoUrl?: string;
  logoKey?: string;
  logoHeight?: number;
  // 📝 نص الهيرو
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroOfferBadgeText?: string;
  heroButtons?: HeroButton[];
  // 🎬 فيديو الهيرو - لابتوب
  heroDesktopVideoUrl?: string;
  heroDesktopVideoKey?: string;
  heroDesktopPosterUrl?: string;
  heroDesktopPosterKey?: string;
  heroDesktopAccount?: string;
  // 🎬 فيديو الهيرو - موبايل
  heroMobileVideoUrl?: string;
  heroMobileVideoKey?: string;
  heroMobilePosterUrl?: string;
  heroMobilePosterKey?: string;
  heroMobileAccount?: string;
  updatedAt?: number;
}

const SETTINGS_DOC_REF = doc(db, "settings", "appSettings");

export async function getSettings(): Promise<SettingsData | null> {
  const snap = await getDoc(SETTINGS_DOC_REF);
  if (!snap.exists()) return null;
  return snap.data() as SettingsData;
}

export async function updateSettings(data: Partial<SettingsData>): Promise<void> {
  await setDoc(
    SETTINGS_DOC_REF,
    { ...data, updatedAt: Date.now() },
    { merge: true }
  );
}

export function subscribeToSettings(
  callback: (data: SettingsData | null) => void
) {
  return onSnapshot(SETTINGS_DOC_REF, (snap) => {
    callback(snap.exists() ? (snap.data() as SettingsData) : null);
  });
}