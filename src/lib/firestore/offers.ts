import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Offer } from "@/types/offer";

export async function getCurrentOffer(): Promise<Offer | null> {
  const offersRef = collection(db, "offers");
  const q = query(offersRef, where("status", "==", "current"));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl,
    videoUrl: data.videoUrl,
    status: data.status,
    startDate: (data.startDate as Timestamp).toDate(),
    endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
  };
}

export async function getArchivedOffers(): Promise<Offer[]> {
  const offersRef = collection(db, "offers");
  const q = query(
    offersRef,
    where("status", "==", "archived"),
    orderBy("startDate", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
      status: data.status,
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
    };
  });
}