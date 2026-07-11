// types/map.ts

export interface MapImage {
  url: string;
  key: string; // مفتاح R2 (للحذف)
}

export interface Office {
  id: string;
  number: number; // رقم يدوي، عام على كل الفروع (مش بيتصفر لكل منطقة)
  name: string; // اسم المكتب، قابل للتعديل، وده اللي بيظهر في الـ tooltip على الخريطة
  region: string; // اسم المنطقة (نص حر)، بيظهر بس في تفاصيل المكتب مش على الخريطة
  city: string;
  lat: number;
  lng: number;
  phone: string; // يُستخدم فقط لو phoneSameAsMain = false
  phoneSameAsMain: boolean; // true = ياخد رقم المقر الرئيسي تلقائيًا
  whatsapp: string; // يُستخدم فقط لو whatsappSameAsMain = false
  whatsappSameAsMain: boolean; // true = ياخد واتساب المقر الرئيسي تلقائيًا
  hours: string;
  services: string[];
  address: string;
  images: MapImage[];
}

export interface MainOffice {
  name: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  whatsapp: string; // رقم واتساب خاص بالمقر الرئيسي
  hours: string;
  services: string[];
  address: string;
  images: MapImage[];
}

// المفاتيح الثابتة اللي بتتحكم في أماكن ظاهرة فعليًا جوه كارت المكتب/المقر الرئيسي.
// كل مفتاح له مكان محدد في الواجهة، والقيمة بتاعته قابلة للتخصيص من الأدمن.
export type MapLabelKey =
  | "addressLabel"
  | "phoneLabel"
  | "hoursLabel"
  | "regionLabel"
  | "servicesTitle"
  | "callButtonText"
  | "shareButtonText"
  | "whatsappButtonText"
  | "whatsappMessage"
  | "mainOfficeBadge"
  | "branchBadge"
  | "mainOfficeTooltipText"
  | "officeTooltipText";

// صف واحد في جدول التخصيص بالأدمن: أنا اخترت أخصص المفتاح ده، وده النص اللي حطيته
export interface MapLabelOverride {
  id: string;
  key: MapLabelKey;
  value: string;
}

// النصوص بعد ما تتحل (merge بين الافتراضي والمخصص) — ده اللي بيستخدمه الموقع فعليًا
export type MapLabelText = Record<MapLabelKey, string>;

export interface MapData {
  mainOffice: MainOffice;
  offices: Office[]; // قائمة مسطحة لكل المكاتب، مفيش تجميع تحت مناطق
  labelOverrides: MapLabelOverride[];
}