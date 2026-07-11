export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  photoKey?: string; // مفتاح R2 عشان نقدر نمسح الصورة القديمة
  linkedin?: string;
  order: number;
  cardWidth?: number; // عرض صورة الكارد بالبكسل (افتراضي 220)
  cardHeight?: number; // طول صورة الكارد بالبكسل (افتراضي 220)
  createdAt: Date;
}