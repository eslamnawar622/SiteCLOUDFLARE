"use client";

import { useEffect, useState } from "react";
import {
  getProductInquirySettings,
  updateProductInquirySettings,
} from "@/lib/firestore/productInquiry";
import {
  ProductInquirySettings,
  DEFAULT_PRODUCT_INQUIRY_SETTINGS,
} from "@/types/productInquiry";

export default function ProductInquiryAdminPage() {
  const [settings, setSettings] = useState<ProductInquirySettings>(
    DEFAULT_PRODUCT_INQUIRY_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProductInquirySettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateProductInquirySettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6" dir="rtl">
        <p className="text-text-secondary">جاري التحميل...</p>
      </div>
    );
  }

  const previewMessage = settings.messageTemplate.replace(
    "{productName}",
    "كنبة مودرن ثلاثية"
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-6" dir="rtl">
      <h1 className="text-2xl font-semibold mb-2">طلب المنتج عبر واتساب</h1>
      <p className="text-text-secondary mb-8">
        الزرار اللي بيظهر تحت كل منتج، وبيفتح واتساب برسالة جاهزة فيها اسم
        المنتج تلقائيًا.
      </p>

      <div className="border border-border rounded-xl p-4 space-y-4">
        <div>
          <label className="block text-text-secondary text-sm mb-1">
            رقم الواتساب
          </label>
          <input
            type="text"
            value={settings.whatsappNumber}
            onChange={(e) =>
              setSettings({ ...settings, whatsappNumber: e.target.value })
            }
            placeholder="201012840793"
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
            dir="ltr"
          />
          <p className="text-xs text-text-muted mt-1">
            اكتب الرقم بصيغة دولية من غير + أو صفر في الأول (مصر مثلاً:
            20 بدل 0، السعودية: 966 بدل 0)
          </p>
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1">
            نص الرسالة
          </label>
          <textarea
            value={settings.messageTemplate}
            onChange={(e) =>
              setSettings({ ...settings, messageTemplate: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-text-muted mt-1">
            استخدم <code className="bg-surface-raised px-1 rounded">{"{productName}"}</code> في
            أي مكان في الجملة وهيتحط مكانه اسم المنتج تلقائي
          </p>
        </div>

        <div className="bg-surface-raised border border-border rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">معاينة الرسالة:</p>
          <p className="text-sm text-text-primary">{previewMessage}</p>
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1">
            نص الزرار
          </label>
          <input
            type="text"
            value={settings.buttonText}
            onChange={(e) =>
              setSettings({ ...settings, buttonText: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium"
        >
          {saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}