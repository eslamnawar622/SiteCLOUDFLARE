export interface Project {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  year: number;
  description: string;
  shortDescription: string;
  mainImage: string;      // صورة البطاقة + صفحة التفاصيل
  gallery: string[];
  featured: boolean;
  createdAt: Date;
}