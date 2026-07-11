export interface OfferStats {
  totalViews: number;
  totalClicks: number;
  mobileViews: number;
  desktopViews: number;
  history: {
    date: string;
    views: number;
    clicks: number;
  }[];
}

export type BadgePosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

// عمودي = شكله الحالي (نص واقف)، أفقي = شريط عريض عادي
export type BadgeOrientation = "vertical" | "horizontal";

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
  badgeText?: string;
  badgePositionMobile?: BadgePosition;
  badgePositionDesktop?: BadgePosition;
  badgeOrientationMobile?: BadgeOrientation;
  badgeOrientationDesktop?: BadgeOrientation;
  // نسبة الحجم % — 100 = الحجم الطبيعي
  badgeSizeMobile?: number;
  badgeSizeDesktop?: number;
  displayDate?: string;
  showDate?: boolean;
  currentMobileHeight?: number;
  currentDesktopHeight?: number;
  currentDesktopWidth?: number;
  cardHeight?: number;
  cardCols?: number;
  stats?: OfferStats;
}