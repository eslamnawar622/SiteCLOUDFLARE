"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings, HeroButton } from "@/lib/firestore/settings";

const LINK_OPTIONS = [
  { label: "الرئيسية", value: "/" },
  { label: "المشاريع", value: "/projects" },
  { label: "المنتجات", value: "/products" },
  { label: "قسم الاستشارة", value: "/#consultation" },
  { label: "قسم العروض", value: "/#offers" },
  { label: "شركاء النجاح", value: "/#clients" },
  { label: "رابط مخصص", value: "custom" },
];

const STYLE_OPTIONS = [
  { label: "أساسي (معبّى بالأزرق)", value: "primary" },
  { label: "ثانوي (شفاف بحدود)", value: "secondary" },
];

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function AdminHeroTextPage() {
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroOfferBadgeText, setHeroOfferBadgeText] = useState("عرض حالي");
  const [heroButtons, setHeroButtons] = useState<HeroButton[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getSettings();
      if (data) {
        setHeroTitle(data.heroTitle || "");
        setHeroSubtitle(data.heroSubtitle || "");
        setHeroDescription(data.heroDescription || "");
        setHeroOfferBadgeText(data.heroOfferBadgeText || "عرض حالي");
        setHeroButtons(data.heroButtons || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  // ─── Buttons Helpers ───
  function addButton() {
    setHeroButtons([
      ...heroButtons,
      {
        id: `btn-${Date.now()}`,
        text: "زرار جديد",
        link: "/",
        linkType: "/",
        style: "primary",
      },
    ]);
  }

  function updateButton(index: number, field: keyof HeroButton, value: string) {
    const newButtons = [...heroButtons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    if (field === "linkType") {
      newButtons[index].link = value === "custom" ? "" : value;
    }
    setHeroButtons(newButtons);
  }

  function removeButton(index: number) {
    const confirmed = confirm("متأكد إنك عايز تمسح الزرار ده؟");
    if (!confirmed) return;
    setHeroButtons(heroButtons.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings({
        heroTitle: heroTitle.trim(),
        heroSubtitle: heroSubtitle.trim(),
        heroDescription: heroDescription.trim(),
        heroOfferBadgeText: heroOfferBadgeText.trim() || "عرض حالي",
        heroButtons,
      });
      alert("✅ تم الحفظ بنجاح");
    } catch (error) {
      console.error(error);
      alert("❌ فشل الحفظ");
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
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          📝 إدارة نصوص الهيرو
        </h1>
        <p className="text-text-muted text-sm">
          عدّل العنوان والوصف وزراير القسم الرئيسي في أول الموقع
        </p>
      </div>

      {/* العنوان والوصف */}
      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-text-secondary text-sm mb-2">
            العنوان الرئيسي
          </label>
          <input
            type="text"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="Axis Design Studio"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary"
          />
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-2">
            الجملة اللي تحت العنوان
          </label>
          <input
            type="text"
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="نحول رؤيتك إلى واقع"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary"
          />
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-2">
            الوصف
          </label>
          <textarea
            value={heroDescription}
            onChange={(e) => setHeroDescription(e.target.value)}
            rows={2}
            placeholder="تصميم داخلي · معماري · ديكور · في مصر والسعودية والإمارات"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary resize-none"
          />
        </div>
      </div>

      {/* نص الشريط الجانبي (Badge) */}
      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          🏷️ نص الشريط الجانبي (Badge)
        </h2>
        <p className="text-text-muted text-xs">
          الجملة اللي بتظهر على اليمين في الهيرو (الشريط الأزرق العمودي). سيبه فاضي لو مش عايز الشريط يظهر.
        </p>
        <input
          type="text"
          value={heroOfferBadgeText}
          onChange={(e) => setHeroOfferBadgeText(e.target.value)}
          placeholder="عرض حالي"
          className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary text-sm"
        />
      </div>

      {/* الأزرار */}
      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            🔘 الأزرار
          </h2>
          <button
            onClick={addButton}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            + إضافة زرار
          </button>
        </div>

        {heroButtons.length === 0 && (
          <p className="text-text-muted text-sm">
            مفيش أزرار دلوقتي. دوس &quot;+ إضافة زرار&quot; عشان تضيف واحد.
          </p>
        )}

        {heroButtons.map((btn, index) => (
          <div
            key={btn.id}
            className="border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-xs">
                زرار {index + 1}
              </span>
              <button
                onClick={() => removeButton(index)}
                className="text-error text-xs hover:underline"
              >
                🗑️ حذف
              </button>
            </div>

            {/* النص */}
            <div>
              <label className="block text-text-secondary text-xs mb-1">
                النص
              </label>
              <input
                type="text"
                value={btn.text}
                onChange={(e) => updateButton(index, "text", e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm"
              />
            </div>

            {/* الرابط */}
            <div>
              <label className="block text-text-secondary text-xs mb-1">
                الرابط
              </label>
              <div className="relative">
                <select
                  value={btn.linkType}
                  onChange={(e) => updateButton(index, "linkType", e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm appearance-none cursor-pointer pr-9 mb-2"
                >
                  {LINK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-2.5 top-[38%] -translate-y-1/2 pointer-events-none text-text-muted">
                  <ChevronDownIcon />
                </div>
              </div>

              {btn.linkType === "custom" && (
                <input
                  type="text"
                  value={btn.link}
                  onChange={(e) => updateButton(index, "link", e.target.value)}
                  placeholder="اكتب الرابط المخصص هنا (مثال: /projects)"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm"
                  dir="ltr"
                />
              )}
            </div>

            {/* الشكل */}
            <div>
              <label className="block text-text-secondary text-xs mb-1">
                الشكل
              </label>
              <div className="relative">
                <select
                  value={btn.style}
                  onChange={(e) => updateButton(index, "style", e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm appearance-none cursor-pointer pr-9"
                >
                  {STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-3 rounded-full font-medium transition-colors"
      >
        {saving ? "جاري الحفظ..." : "💾 حفظ كل التعديلات"}
      </button>
    </div>
  );
}