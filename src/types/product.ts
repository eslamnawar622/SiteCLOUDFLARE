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
  featured: boolean;
  createdAt: Date;
}