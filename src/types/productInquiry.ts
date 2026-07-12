export interface ProductInquirySettings {
  whatsappNumber: string; // رقم دولي من غير + أو صفر زيادة، مثال: 201012840793
  messageTemplate: string; // استخدم {productName} عشان يتحط مكانها اسم المنتج تلقائي
  buttonText: string;
}

export const DEFAULT_PRODUCT_INQUIRY_SETTINGS: ProductInquirySettings = {
  whatsappNumber: "201012840793",
  messageTemplate:
    "مرحبًا، أنا مهتم بمنتج {productName} وحاب أعرف التفاصيل والسعر النهائي 🙏",
  buttonText: "أطلب المنتج الآن عبر واتساب",
};