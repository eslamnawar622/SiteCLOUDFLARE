export interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  status: "current" | "archived";
  startDate: Date;
  endDate?: Date;
}