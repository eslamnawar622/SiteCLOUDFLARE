import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";

export async function getFeaturedProducts(): Promise<Product[]> {
  const productsRef = collection(db, "products");
  const q = query(
    productsRef,
    where("featured", "==", true),
    orderBy("createdAt", "desc"),
    limit(8)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      slug: data.slug,
      name: data.name,
      category: data.category,
      price: data.price,
      description: data.description,
      shortDescription: data.shortDescription,
      mainImage: data.mainImage,
      gallery: data.gallery || [],
      featured: data.featured,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const productsRef = collection(db, "products");
  const q = query(productsRef, where("slug", "==", slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    slug: data.slug,
    name: data.name,
    category: data.category,
    price: data.price,
    description: data.description,
    shortDescription: data.shortDescription,
    mainImage: data.mainImage,
    gallery: data.gallery || [],
    featured: data.featured,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const productsRef = collection(db, "products");
  const q = query(productsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      slug: data.slug,
      name: data.name,
      category: data.category,
      price: data.price,
      description: data.description,
      shortDescription: data.shortDescription,
      mainImage: data.mainImage,
      gallery: data.gallery || [],
      featured: data.featured,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}