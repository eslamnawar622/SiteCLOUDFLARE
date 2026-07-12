import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";

function mapDoc(id: string, data: DocumentData): Product {
  return {
    id,
    slug: data.slug,
    name: data.name,
    category: data.category,
    price: data.price,
    description: data.description,
    shortDescription: data.shortDescription,
    mainImage: data.mainImage,
    gallery: data.gallery || [],
    galleryKeys: data.galleryKeys || [],
    featured: data.featured,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const productsRef = collection(db, "products");
  const q = query(
    productsRef,
    where("featured", "==", true),
    orderBy("createdAt", "desc"),
    limit(8)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc(d.id, d.data()));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const productsRef = collection(db, "products");
  const q = query(productsRef, where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return mapDoc(d.id, d.data());
}

export async function getAllProducts(): Promise<Product[]> {
  const productsRef = collection(db, "products");
  const q = query(productsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc(d.id, d.data()));
}

// ✅ إضافة منتج جديد
export async function addProduct(
  data: Omit<Product, "id" | "createdAt">
): Promise<string> {
  const productsRef = collection(db, "products");
  const docRef = await addDoc(productsRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// ✅ تعديل منتج موجود
export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  const productRef = doc(db, "products", id);
  await updateDoc(productRef, data);
}

// ✅ حذف منتج
export async function deleteProduct(id: string): Promise<void> {
  const productRef = doc(db, "products", id);
  await deleteDoc(productRef);
}