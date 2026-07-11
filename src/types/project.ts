export interface Project {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  year: number;
  description: string;
  shortDescription: string;
  mainImage: string;      // صورة الغلاف (مختارة من الجاليري)
  gallery: string[];      // كل صور المشروع
  galleryKeys: string[];  // مفاتيح R2 لكل صورة (عشان نقدر نحذفهم)
  featured: boolean;
  badgeText: string;      // نص الشريط الأزرق (تصميم داخلي / خارجي / شقة كاملة ...)
  cardWidth?: number;     // عرض الكارت بالبكسل (اختياري)
  cardHeight?: number;    // طول الكارت بالبكسل (اختياري)
  createdAt: Date;
}