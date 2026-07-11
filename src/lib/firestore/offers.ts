import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Offer } from "@/types/offer";

const OFFERS_COLLECTION = collection(db, "offers");

function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

function mapDocToOffer(docSnap: QueryDocumentSnapshot<DocumentData>): Offer {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl || undefined,
    imageKey: data.imageKey || undefined,
    videoUrl: data.videoUrl || undefined,
    videoKey: data.videoKey || undefined,
    status: data.status,
    startDate: (data.startDate as Timestamp)?.toDate?.() || new Date(),
    endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
    badgeText: data.badgeText || undefined,
    badgePositionMobile: data.badgePositionMobile || undefined,
    badgePositionDesktop: data.badgePositionDesktop || undefined,
    badgeOrientationMobile: data.badgeOrientationMobile || undefined,
    badgeOrientationDesktop: data.badgeOrientationDesktop || undefined,
    badgeSizeMobile: data.badgeSizeMobile || undefined,
    badgeSizeDesktop: data.badgeSizeDesktop || undefined,
    displayDate: data.displayDate || undefined,
    showDate: data.showDate !== false,
    currentMobileHeight: data.currentMobileHeight || undefined,
    currentDesktopHeight: data.currentDesktopHeight || undefined,
    currentDesktopWidth: data.currentDesktopWidth || undefined,
    cardHeight: data.cardHeight || undefined,
    cardCols: data.cardCols || undefined,
    stats: data.stats
      ? {
          totalViews: data.stats.totalViews || 0,
          totalClicks: data.stats.totalClicks || 0,
          mobileViews: data.stats.mobileViews || 0,
          desktopViews: data.stats.desktopViews || 0,
          history: Array.isArray(data.stats.history) ? data.stats.history : [],
        }
      : undefined,
  };
}

// ============================================
// 📌 قراءة لمرة واحدة
// ============================================

export async function getCurrentOffer(): Promise<Offer | null> {
  const q = query(OFFERS_COLLECTION, where("status", "==", "current"));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapDocToOffer(snapshot.docs[0]);
}

export async function getArchivedOffers(): Promise<Offer[]> {
  const q = query(
    OFFERS_COLLECTION,
    where("status", "==", "archived"),
    orderBy("startDate", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToOffer);
}

// ============================================
// 📡 اشتراك لحظي (للأدمن)
// ============================================

export function subscribeToCurrentOffer(
  callback: (offer: Offer | null) => void
) {
  const q = query(OFFERS_COLLECTION, where("status", "==", "current"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.empty ? null : mapDocToOffer(snapshot.docs[0]));
  });
}

export function subscribeToArchivedOffers(
  callback: (offers: Offer[]) => void
) {
  const q = query(
    OFFERS_COLLECTION,
    where("status", "==", "archived"),
    orderBy("startDate", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(mapDocToOffer));
  });
}

// ============================================
// ✏️ إضافة / تعديل / حذف / أرشفة / استرجاع
// ============================================

export interface OfferInput {
  [key: string]: string | number | boolean | undefined | null;
  title: string;
  description: string;
  badgeText?: string;
  badgePositionMobile?: string;
  badgePositionDesktop?: string;
  badgeOrientationMobile?: string;
  badgeOrientationDesktop?: string;
  badgeSizeMobile?: number;
  badgeSizeDesktop?: number;
  imageUrl?: string;
  imageKey?: string;
  videoUrl?: string;
  videoKey?: string;
  displayDate?: string;
  showDate?: boolean;
  cardHeight?: number;
  cardCols?: number;
  currentMobileHeight?: number;
  currentDesktopHeight?: number;
  currentDesktopWidth?: number;
}

export async function addCurrentOffer(data: OfferInput): Promise<string> {
  const docRef = await addDoc(OFFERS_COLLECTION, {
    ...removeUndefined(data),
    status: "current",
    startDate: serverTimestamp(),
  });
  return docRef.id;
}

export async function addArchivedOffer(data: OfferInput): Promise<string> {
  const docRef = await addDoc(OFFERS_COLLECTION, {
    ...removeUndefined(data),
    status: "archived",
    startDate: serverTimestamp(),
  });
  return docRef.id;
}

export async function archiveOffer(offerId: string): Promise<void> {
  await updateDoc(doc(db, "offers", offerId), {
    status: "archived",
    endDate: serverTimestamp(),
  });
}

export async function setOfferAsCurrent(offerId: string): Promise<void> {
  await updateDoc(doc(db, "offers", offerId), {
    status: "current",
    endDate: deleteField(),
  });
}

export async function updateOffer(
  offerId: string,
  data: Partial<OfferInput>
): Promise<void> {
  await updateDoc(doc(db, "offers", offerId), removeUndefined(data));
}

export async function deleteOffer(offerId: string): Promise<void> {
  await deleteDoc(doc(db, "offers", offerId));
}

// ============================================
// 📊 إحصائيات
// ============================================

interface StatsData {
  totalViews: number;
  totalClicks: number;
  mobileViews: number;
  desktopViews: number;
  history: HistoryEntry[];
}

interface HistoryEntry {
  date: string;
  views: number;
  clicks: number;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function createEmptyStats(): StatsData {
  return {
    totalViews: 0,
    totalClicks: 0,
    mobileViews: 0,
    desktopViews: 0,
    history: [],
  };
}

function trimHistory(history: HistoryEntry[]): HistoryEntry[] {
  if (history.length <= 30) return history;
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(-30);
}

export async function trackOfferView(
  offerId: string,
  isDesktop: boolean
): Promise<void> {
  const ref = doc(db, "offers", offerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const today = getToday();

  const stats: StatsData = data.stats ? { ...createEmptyStats(), ...data.stats } : createEmptyStats();

  const existingDay = stats.history.find((h: HistoryEntry) => h.date === today);
  if (existingDay) {
    existingDay.views += 1;
  } else {
    stats.history.push({ date: today, views: 1, clicks: 0 });
    stats.history = trimHistory(stats.history);
  }

  stats.totalViews += 1;
  if (isDesktop) {
    stats.desktopViews += 1;
  } else {
    stats.mobileViews += 1;
  }

  await updateDoc(ref, { stats: stats as unknown as Record<string, unknown> });
}

export async function trackOfferClick(
  offerId: string,
  isDesktop: boolean
): Promise<void> {
  const ref = doc(db, "offers", offerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const today = getToday();

  const stats: StatsData = data.stats ? { ...createEmptyStats(), ...data.stats } : createEmptyStats();

  const existingDay = stats.history.find((h: HistoryEntry) => h.date === today);
  if (existingDay) {
    existingDay.clicks += 1;
  } else {
    stats.history.push({ date: today, views: 0, clicks: 1 });
    stats.history = trimHistory(stats.history);
  }

  stats.totalClicks += 1;
  if (isDesktop) {
    stats.desktopViews += 1;
  } else {
    stats.mobileViews += 1;
  }

  await updateDoc(ref, { stats: stats as unknown as Record<string, unknown> });
}