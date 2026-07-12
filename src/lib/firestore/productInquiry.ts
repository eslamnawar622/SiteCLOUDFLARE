import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ProductInquirySettings,
  DEFAULT_PRODUCT_INQUIRY_SETTINGS,
} from "@/types/productInquiry";

const SETTINGS_DOC = "settings/productInquiry";

function stripUndefined<T extends Record<string, unknown>>(data: T): T {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

export async function getProductInquirySettings(): Promise<ProductInquirySettings> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));
  if (!snap.exists()) return DEFAULT_PRODUCT_INQUIRY_SETTINGS;
  return {
    ...DEFAULT_PRODUCT_INQUIRY_SETTINGS,
    ...(snap.data() as Partial<ProductInquirySettings>),
  };
}

export async function updateProductInquirySettings(
  data: Partial<ProductInquirySettings>
): Promise<void> {
  await setDoc(doc(db, SETTINGS_DOC), stripUndefined(data), { merge: true });
}