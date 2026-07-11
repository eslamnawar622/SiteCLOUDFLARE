// lib/firestore/map.ts
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  MapData,
  MainOffice,
  Office,
  MapLabelKey,
  MapLabelOverride,
  MapLabelText,
} from "@/types/map";

const MAP_DOC_REF = doc(db, "content", "map");

// ─── قايمة المفاتيح المتاحة للتخصيص ───
export const LABEL_KEY_OPTIONS: { key: MapLabelKey; label: string; defaultValue: string }[] = [
  { key: "addressLabel", label: "عنوان حقل «العنوان»", defaultValue: "العنوان" },
  { key: "phoneLabel", label: "عنوان حقل «رقم التواصل»", defaultValue: "رقم التواصل" },
  { key: "hoursLabel", label: "عنوان حقل «ساعات العمل»", defaultValue: "ساعات العمل" },
  { key: "regionLabel", label: "عنوان حقل «المنطقة»", defaultValue: "المنطقة" },
  { key: "servicesTitle", label: "عنوان قسم «الخدمات المتاحة»", defaultValue: "✨ الخدمات المتاحة" },
  { key: "callButtonText", label: "نص زرار «اتصل الآن»", defaultValue: "📞 اتصل الآن" },
  { key: "shareButtonText", label: "نص زرار «مشاركة الموقع»", defaultValue: "↗️ مشاركة الموقع" },
  { key: "whatsappButtonText", label: "نص زرار «واتساب»", defaultValue: "💬 واتساب" },
  { key: "whatsappMessage", label: "رسالة الواتساب الجاهزة", defaultValue: "مرحبًا، كنت عايز أعرف تفاصيل أكتر عنكم" },
  { key: "mainOfficeBadge", label: "بادچ المقر الرئيسي", defaultValue: "🏢 المقر الرئيسي" },
  { key: "branchBadge", label: "بادچ الفرع", defaultValue: "🏪 فرع" },
  { key: "mainOfficeTooltipText", label: "نص تلميح المقر الرئيسي على الخريطة", defaultValue: "اضغط للتفاصيل" },
  { key: "officeTooltipText", label: "نص تلميح الفرع على الخريطة", defaultValue: "اضغط للتفاصيل" },
];

const DEFAULT_LABEL_TEXT: MapLabelText = LABEL_KEY_OPTIONS.reduce((acc, opt) => {
  acc[opt.key] = opt.defaultValue;
  return acc;
}, {} as MapLabelText);

export function resolveLabels(overrides: MapLabelOverride[]): MapLabelText {
  const resolved: MapLabelText = { ...DEFAULT_LABEL_TEXT };
  for (const o of overrides) {
    resolved[o.key] = o.value;
  }
  return resolved;
}

// ─── حل رقم تواصل الفرع الفعلي: رقمه الخاص أو رقم المقر الرئيسي ───
export function resolveOfficeContact(
  office: Pick<Office, "phone" | "phoneSameAsMain" | "whatsapp" | "whatsappSameAsMain">,
  mainOffice: Pick<MainOffice, "phone" | "whatsapp">
): { phone: string; whatsapp: string } {
  return {
    phone: office.phoneSameAsMain ? mainOffice.phone : office.phone,
    whatsapp: office.whatsappSameAsMain ? mainOffice.whatsapp : office.whatsapp,
  };
}

const DEFAULT_MAP_DATA: MapData = {
  mainOffice: {
    name: "المكتب الرئيسي",
    city: "",
    lat: 31.2001,
    lng: 29.9187,
    phone: "",
    whatsapp: "",
    hours: "",
    services: [],
    address: "",
    images: [],
  },
  offices: [],
  labelOverrides: [],
};

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getMapData(): Promise<MapData> {
  const snap = await getDoc(MAP_DOC_REF);
  if (!snap.exists()) {
    return DEFAULT_MAP_DATA;
  }
  const data = snap.data() as Partial<MapData>;
  return {
    mainOffice: { ...DEFAULT_MAP_DATA.mainOffice, ...(data.mainOffice || {}) },
    offices: data.offices || [],
    labelOverrides: data.labelOverrides || [],
  };
}

async function saveMapData(data: MapData): Promise<void> {
  await setDoc(MAP_DOC_REF, data);
}

export async function updateMainOffice(mainOffice: MainOffice): Promise<void> {
  const data = await getMapData();
  data.mainOffice = mainOffice;
  await saveMapData(data);
}

export async function updateLabelOverrides(labelOverrides: MapLabelOverride[]): Promise<void> {
  const data = await getMapData();
  data.labelOverrides = labelOverrides;
  await saveMapData(data);
}

// ─── إدارة المكاتب: قائمة مسطحة، مفيش تجميع تحت مناطق ───

export async function addOffice(office: Omit<Office, "id">): Promise<Office> {
  const data = await getMapData();
  const newOffice: Office = { ...office, id: genId("office") };
  data.offices.push(newOffice);
  await saveMapData(data);
  return newOffice;
}

export async function updateOffice(
  officeId: string,
  updates: Partial<Omit<Office, "id">>
): Promise<void> {
  const data = await getMapData();
  const office = data.offices.find((o) => o.id === officeId);
  if (!office) throw new Error("المكتب غير موجود");
  Object.assign(office, updates);
  await saveMapData(data);
}

export async function deleteOffice(officeId: string): Promise<Office | undefined> {
  const data = await getMapData();
  const idx = data.offices.findIndex((o) => o.id === officeId);
  if (idx === -1) return undefined;
  const [removed] = data.offices.splice(idx, 1);
  await saveMapData(data);
  return removed;
}