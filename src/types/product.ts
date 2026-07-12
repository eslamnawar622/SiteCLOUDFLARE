export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  shortDescription: string;
  mainImage: string;
  gallery: string[];
  galleryKeys?: string[];
  featured: boolean;
  cardWidth?: number;
  cardHeight?: number;
  imageFit?: "cover" | "contain"; // طريقة عرض الصورة جوه الكارت
  imagePositionX?: number; // 0-100: موضع الصورة أفقياً (Pan)
  imagePositionY?: number; // 0-100: موضع الصورة رأسياً (Pan)
  imageZoom?: number; // 1-3: نسبة تكبير الصورة جوه الكارت (Zoom)
  createdAt: Date;
}