export interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageKey?: string;
  videoUrl?: string;
  videoKey?: string;
  status: "current" | "archived";
  startDate: Date;
  endDate?: Date;
  badgeText?: string;      // ✅ نص الشريط الجانبي
  displayDate?: string;    // ✅ التاريخ اللي هيتعرض
  showDate?: boolean;      // ✅ إظهار/إخفاء التاريخ

    
  // ✅ أبعاد البطاقة (اختياري — لو مش موجود يبقى default)
  cardHeight?: number;   // ارتفاع الصورة بالبكسل (default: 224 = h-56)
  cardCols?: number;     // عدد الأعمدة في الشبكة (1-3, default: 3)
}