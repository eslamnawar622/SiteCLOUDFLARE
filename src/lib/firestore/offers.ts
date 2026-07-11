import {
  collection,
  getDocs,
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
    displayDate: data.displayDate || undefined,
    showDate: data.showDate !== false,
    // ✅ أبعاد البطاقة
    cardHeight: data.cardHeight || undefined,
    cardCols: data.cardCols || undefined,
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

export async function addCurrentOffer(data: {
  title: string;
  description: string;
  badgeText?: string;
  imageUrl?: string;
  imageKey?: string;
  videoUrl?: string;
  videoKey?: string;
  displayDate?: string;
  showDate?: boolean;
  cardHeight?: number;
  cardCols?: number;
}): Promise<string> {
  const docRef = await addDoc(OFFERS_COLLECTION, {
    ...removeUndefined(data),
    status: "current",
    startDate: serverTimestamp(),
  });
  return docRef.id;
}

export async function addArchivedOffer(data: {
  title: string;
  description: string;
  badgeText?: string;
  imageUrl?: string;
  imageKey?: string;
  videoUrl?: string;
  videoKey?: string;
  displayDate?: string;
  showDate?: boolean;
  cardHeight?: number;
  cardCols?: number;
}): Promise<string> {
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
  data: Partial<{
    title: string;
    description: string;
    badgeText?: string;
    imageUrl: string;
    imageKey: string;
    videoUrl: string;
    videoKey: string;
    displayDate?: string;
    showDate?: boolean;
    cardHeight?: number;
    cardCols?: number;
  }>
): Promise<void> {
  await updateDoc(doc(db, "offers", offerId), removeUndefined(data));
}

export async function deleteOffer(offerId: string): Promise<void> {
  await deleteDoc(doc(db, "offers", offerId));
}