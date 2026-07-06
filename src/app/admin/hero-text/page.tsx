"use client";

import { useState, useEffect } from "react";
import {
  getHeroText,
  updateHeroText,
  HeroButton,
  HeroTextData,
} from "@/lib/firestore/heroText";

// قائمة الصفحات والأقسام المتاحة في الموقع، تختار منها بدل ما تكتب رابط بإيدك
const LINK_OPTIONS = [
  { value: "/", label: "الرئيسية" },
  { value: "/#consultation", label: "قسم الاستشارة" },
  { value: "/#offers", label: "قسم العروض" },
  { value: "/#clients", label: "قسم شركاء النجاح" },
  { value: "/products", label: "صفحة المنتجات" },
  { value: "/projects", label: "صفحة المشاريع" },

];

// قيم افتراضية لو Firestore فاضي (أول مرة)
const DEFAULT_DATA: HeroTextData = {
  title: "Axis Design Studio",
  subtitle: "نحول رؤيتك إلى واقع",
  description: "تصميم داخلي · معماري · ديكور · في مصر والسعودية والإمارات",
  buttons: [
    {
      id: "btn-1",
      text: "احجز استشارة مجانية",
      link: "/#consultation",
      style: "primary",
    },
    {
      id: "btn-2",
      text: "شوف أعمالنا",
      link: "/projects",
      style: "secondary",
    },
  ],
};

export default function AdminHeroTextPage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [buttons, setButtons] = useState<HeroButton[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getHeroText();
      const source = data || DEFAULT_DATA;
      setTitle(source.title);
      setSubtitle(source.subtitle);
      setDescription(source.description);
      setButtons(source.buttons || []);
      setLoading(false);
    }
    load();
  }, []);

  function handleAddButton() {
    const newButton: HeroButton = {
      id: `btn-${Date.now()}`,
      text: "زرار جديد",
      link: "/",
      style: "secondary",
    };
    setButtons([...buttons, newButton]);
  }

  function handleDeleteButton(id: string) {
    const confirmed = confirm("متأكد إنك عايز تمسح الزرار ده؟");
    if (!confirmed) return;
    setButtons(buttons.filter((b) => b.id !== id));
  }

  function handleButtonChange(
    id: string,
    field: keyof HeroButton,
    value: string
  ) {
    setButtons(
      buttons.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateHeroText({ title, subtitle, description, buttons });
      alert("تم الحفظ بنجاح ✅");
    } catch (error) {
      console.error(error);
      alert("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6">
        <p className="text-text-muted">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          إدارة نصوص الهيرو
        </h1>
        <p className="text-text-muted text-sm">
          عدّل العنوان والوصف وزراير القسم الرئيسي في أول الموقع
        </p>
      </div>

      {/* العنوان */}
      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-text-secondary text-sm mb-2">
            العنوان الرئيسي
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary"
          />
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-2">
            الجملة اللي تحت العنوان
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary"
          />
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-2">
            الوصف
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary resize-none"
          />
        </div>
      </div>

      {/* الأزرار */}
      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            الأزرار
          </h2>
          <button
            onClick={handleAddButton}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            + إضافة زرار
          </button>
        </div>

        {buttons.length === 0 && (
          <p className="text-text-muted text-sm">
            مفيش أزرار دلوقتي. دوس &quot;+ إضافة زرار&quot; عشان تضيف واحد.
          </p>
        )}

        {buttons.map((button, index) => (
          <div
            key={button.id}
            className="border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-xs">
                زرار {index + 1}
              </span>
              <button
                onClick={() => handleDeleteButton(button.id)}
                className="text-error text-xs hover:underline"
              >
                🗑️ حذف
              </button>
            </div>

            <div>
              <label className="block text-text-secondary text-xs mb-1">
                النص
              </label>
              <input
                type="text"
                value={button.text}
                onChange={(e) =>
                  handleButtonChange(button.id, "text", e.target.value)
                }
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs mb-1">
                الرابط
              </label>
              <select
                value={
                  LINK_OPTIONS.some((opt) => opt.value === button.link)
                    ? button.link
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    handleButtonChange(button.id, "link", e.target.value);
                  }
                }}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm mb-2"
              >
                {LINK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">🔗 رابط مخصص (اكتبه تحت)</option>
              </select>

              {!LINK_OPTIONS.some((opt) => opt.value === button.link) && (
                <input
                  type="text"
                  value={button.link}
                  onChange={(e) =>
                    handleButtonChange(button.id, "link", e.target.value)
                  }
                  placeholder="اكتب الرابط المخصص هنا (مثال: /projects)"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm"
                  dir="ltr"
                />
              )}
            </div>

            <div>
              <label className="block text-text-secondary text-xs mb-1">
                الشكل
              </label>
              <select
                value={button.style}
                onChange={(e) =>
                  handleButtonChange(button.id, "style", e.target.value)
                }
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm"
              >
                <option value="primary">أساسي (معبّى بالأزرق)</option>
                <option value="secondary">ثانوي (شفاف بحدود)</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-3 rounded-full font-medium transition-colors"
      >
        {saving ? "جاري الحفظ..." : "حفظ كل التعديلات"}
      </button>
    </div>
  );
}