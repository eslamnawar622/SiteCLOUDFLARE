"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getServiceTypes,
  addServiceType,
  updateServiceType,
  deleteServiceType,
} from "@/lib/firestore/serviceTypes";
import {
  getConsultationSettings,
  updateConsultationSettings,
} from "@/lib/firestore/consultationSettings";
import { ServiceType } from "@/types/serviceType";
import { defaultConsultationSettings } from "@/types/consultationSettings";
import BeforeAfterSlider from "@/components/shared/BeforeAfterSlider";

// ============================================
// 🔧 دوال R2
// ============================================

async function uploadFileToR2(
  file: File,
  folder: string
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/r2/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("فشل رفع الملف");
  return response.json();
}

async function deleteFileFromR2(key: string): Promise<boolean> {
  try {
    const response = await fetch("/api/r2/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export default function ServiceTypesAdminPage() {
  // ------- أنواع الخدمات -------
  const [items, setItems] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

  // ------- إعدادات سكشن الاستشارة -------
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionSubtitle, setSectionSubtitle] = useState("");

  const [beforeImage, setBeforeImage] = useState("");
  const [beforeImageKey, setBeforeImageKey] = useState("");
  const [afterImage, setAfterImage] = useState("");
  const [afterImageKey, setAfterImageKey] = useState("");

  const [beforeLabel, setBeforeLabel] = useState("");
  const [afterLabel, setAfterLabel] = useState("");
  const [labelFontSize, setLabelFontSize] = useState(14);
  const [sliderOpacity, setSliderOpacity] = useState(80);

  // الأيام والأوقات — نخزنهم كنص واحد مفصول بفواصل عشان يبقوا سهلين التعديل
  const [daysText, setDaysText] = useState("");
  const [timeSlotsText, setTimeSlotsText] = useState("");

  const [bgLoading, setBgLoading] = useState(true);
  const [bgSaving, setBgSaving] = useState(false);
  const [bgSaved, setBgSaved] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getServiceTypes();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBgSettings = useCallback(async () => {
    try {
      const settings = await getConsultationSettings();
      setSectionTitle(settings.sectionTitle);
      setSectionSubtitle(settings.sectionSubtitle);
      setBeforeImage(settings.beforeImage);
      setBeforeImageKey(settings.beforeImageKey || "");
      setAfterImage(settings.afterImage);
      setAfterImageKey(settings.afterImageKey || "");
      setBeforeLabel(settings.beforeLabel);
      setAfterLabel(settings.afterLabel);
      setLabelFontSize(settings.labelFontSize);
      setSliderOpacity(settings.backgroundOpacity);

      const days = settings.availableDays?.length
        ? settings.availableDays
        : defaultConsultationSettings.availableDays;
      const slots = settings.availableTimeSlots?.length
        ? settings.availableTimeSlots
        : defaultConsultationSettings.availableTimeSlots;

      setDaysText(days.join("، "));
      setTimeSlotsText(slots.join("، "));
    } finally {
      setBgLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadBgSettings();
  }, [load, loadBgSettings]);

  async function handleBeforeFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBefore(true);
    try {
      const uploaded = await uploadFileToR2(file, "consultation-section");
      if (beforeImageKey) await deleteFileFromR2(beforeImageKey);
      setBeforeImage(uploaded.url);
      setBeforeImageKey(uploaded.key);
    } catch (error) {
      console.error(error);
      alert("فشل رفع صورة (قبل)، حاول تاني");
    } finally {
      setUploadingBefore(false);
      e.target.value = "";
    }
  }

  async function handleAfterFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAfter(true);
    try {
      const uploaded = await uploadFileToR2(file, "consultation-section");
      if (afterImageKey) await deleteFileFromR2(afterImageKey);
      setAfterImage(uploaded.url);
      setAfterImageKey(uploaded.key);
    } catch (error) {
      console.error(error);
      alert("فشل رفع صورة (بعد)، حاول تاني");
    } finally {
      setUploadingAfter(false);
      e.target.value = "";
    }
  }

  async function handleRemoveBefore() {
    if (!confirm("متأكد إنك عايز تشيل صورة (قبل)؟")) return;
    if (beforeImageKey) await deleteFileFromR2(beforeImageKey);
    setBeforeImage("");
    setBeforeImageKey("");
  }

  async function handleRemoveAfter() {
    if (!confirm("متأكد إنك عايز تشيل صورة (بعد)؟")) return;
    if (afterImageKey) await deleteFileFromR2(afterImageKey);
    setAfterImage("");
    setAfterImageKey("");
  }

  const handleSaveBg = async () => {
    setBgSaving(true);
    setBgSaved(false);

    const parsedDays = daysText
      .split(/[،,]/)
      .map((d) => d.trim())
      .filter(Boolean);
    const parsedSlots = timeSlotsText
      .split(/[،,]/)
      .map((t) => t.trim())
      .filter(Boolean);

    await updateConsultationSettings({
      sectionTitle: sectionTitle.trim() || "احجز استشارة مجانية",
      sectionSubtitle: sectionSubtitle.trim(),
      beforeImage,
      beforeImageKey,
      afterImage,
      afterImageKey,
      beforeLabel: beforeLabel.trim(),
      afterLabel: afterLabel.trim(),
      labelFontSize,
      backgroundOpacity: sliderOpacity,
      availableDays: parsedDays.length ? parsedDays : defaultConsultationSettings.availableDays,
      availableTimeSlots: parsedSlots.length
        ? parsedSlots
        : defaultConsultationSettings.availableTimeSlots,
    });
    setBgSaving(false);
    setBgSaved(true);
    setTimeout(() => setBgSaved(false), 2500);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 0;
    await addServiceType({
      name: newName.trim(),
      icon: newIcon.trim() || "sparkles",
      order: nextOrder,
    });
    setNewName("");
    setNewIcon("");
    setSaving(false);
    await load();
  };

  const startEdit = (item: ServiceType) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditIcon(item.icon);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    await updateServiceType(id, { name: editName.trim(), icon: editIcon.trim() || "sparkles" });
    setSaving(false);
    cancelEdit();
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("متأكد إنك عايز تمسح نوع الخدمة ده؟")) return;
    setSaving(true);
    await deleteServiceType(id);
    setSaving(false);
    await load();
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const a = items[index];
    const b = items[targetIndex];
    setSaving(true);
    await updateServiceType(a.id, { order: b.order });
    await updateServiceType(b.id, { order: a.order });
    setSaving(false);
    await load();
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-6" dir="rtl">
      {/* ============ إعدادات سكشن الاستشارة ============ */}
      <div className="border border-border rounded-xl p-5 mb-10 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">سكشن «احجز استشارة مجانية»</h2>
          <p className="text-text-secondary text-sm">
            تحكم في النصوص، وسلايدر «قبل / بعد»، وأيام وأوقات التواصل اللي تظهر للعميل.
          </p>
        </div>

        {bgLoading ? (
          <p className="text-text-secondary text-sm">جاري التحميل...</p>
        ) : (
          <>
            {/* النصوص */}
            <div className="space-y-3">
              <div>
                <label className="block text-text-secondary text-sm mb-1">العنوان الرئيسي</label>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">الوصف الفرعي</label>
                <input
                  type="text"
                  value={sectionSubtitle}
                  onChange={(e) => setSectionSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* الأيام والأوقات المتاحة */}
            <div className="space-y-3 border-t border-border pt-5">
              <p className="font-medium text-sm">أيام وأوقات التواصل المتاحة للعميل</p>
              <p className="text-text-secondary text-xs">
                اكتب القيم مفصولة بفاصلة (،) بنفس الترتيب اللي عايز تظهر بيه في القائمة.
              </p>
              <div>
                <label className="block text-text-secondary text-sm mb-1">الأيام</label>
                <textarea
                  value={daysText}
                  onChange={(e) => setDaysText(e.target.value)}
                  rows={2}
                  placeholder="السبت، الأحد، الاثنين..."
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">الأوقات</label>
                <textarea
                  value={timeSlotsText}
                  onChange={(e) => setTimeSlotsText(e.target.value)}
                  rows={2}
                  placeholder="9 ص - 11 ص، 11 ص - 1 م..."
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* الصور */}
            <div className="border-t border-border pt-5">
              <p className="text-text-secondary text-sm mb-3">
                المقاس المناسب لكل صورة:{" "}
                <strong className="text-text-primary">1920 × 1080 بكسل (عرضية)</strong>، وحجم
                الملف أقل من <strong className="text-text-primary">500 كيلوبايت</strong>.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* صورة قبل */}
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    صورة «قبل» (التصميم)
                  </label>
                  {beforeImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={beforeImage}
                      alt="قبل"
                      className="w-full rounded-lg border border-border aspect-video object-cover mb-2"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBeforeFileSelect}
                    disabled={uploadingBefore}
                    className="w-full text-text-secondary text-xs file:ml-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer cursor-pointer disabled:opacity-50"
                  />
                  {uploadingBefore && (
                    <p className="text-xs text-primary mt-1">⏳ جاري الرفع...</p>
                  )}
                  {beforeImage && (
                    <button
                      type="button"
                      onClick={handleRemoveBefore}
                      className="text-danger text-xs mt-1"
                    >
                      حذف الصورة
                    </button>
                  )}
                  <input
                    type="text"
                    value={beforeLabel}
                    onChange={(e) => setBeforeLabel(e.target.value)}
                    placeholder="نص اللابل (سيبه فاضي عشان ميظهرش)"
                    className="w-full mt-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                {/* صورة بعد */}
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    صورة «بعد» (التنفيذ)
                  </label>
                  {afterImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={afterImage}
                      alt="بعد"
                      className="w-full rounded-lg border border-border aspect-video object-cover mb-2"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAfterFileSelect}
                    disabled={uploadingAfter}
                    className="w-full text-text-secondary text-xs file:ml-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer cursor-pointer disabled:opacity-50"
                  />
                  {uploadingAfter && (
                    <p className="text-xs text-primary mt-1">⏳ جاري الرفع...</p>
                  )}
                  {afterImage && (
                    <button
                      type="button"
                      onClick={handleRemoveAfter}
                      className="text-danger text-xs mt-1"
                    >
                      حذف الصورة
                    </button>
                  )}
                  <input
                    type="text"
                    value={afterLabel}
                    onChange={(e) => setAfterLabel(e.target.value)}
                    placeholder="نص اللابل (سيبه فاضي عشان ميظهرش)"
                    className="w-full mt-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* حجم خط اللابل */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-text-secondary text-sm">حجم خط «قبل / بعد»</label>
                <span className="text-text-primary text-sm font-medium">{labelFontSize}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={28}
                value={labelFontSize}
                onChange={(e) => setLabelFontSize(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* شفافية السلايدر */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-text-secondary text-sm">وضوح السلايدر (الشفافية)</label>
                <span className="text-text-primary text-sm font-medium">{sliderOpacity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliderOpacity}
                onChange={(e) => setSliderOpacity(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveBg}
                disabled={bgSaving || uploadingBefore || uploadingAfter}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium text-sm"
              >
                {bgSaving ? "جاري الحفظ..." : "حفظ"}
              </button>
              {bgSaved && <span className="text-success text-sm">تم الحفظ ✓</span>}
            </div>

            {/* Preview */}
            {beforeImage && afterImage && (
              <div>
                <p className="text-text-secondary text-sm mb-2">معاينة (جرّب تسحب المقبض)</p>
                <div className="rounded-xl overflow-hidden border border-border h-64">
                  <BeforeAfterSlider
                    beforeImage={beforeImage}
                    afterImage={afterImage}
                    beforeLabel={beforeLabel}
                    afterLabel={afterLabel}
                    labelFontSize={labelFontSize}
                    opacity={sliderOpacity}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============ أنواع الخدمات ============ */}
      <h1 className="text-2xl font-semibold mb-2">أنواع الخدمات</h1>
      <p className="text-text-secondary mb-8">
        دي الاختيارات اللي هتظهر للعميل في فورم حجز الاستشارة. الاسم يظهر زي ما هو، والأيقونة
        اسمها من مكتبة{" "}
        <a href="https://tabler.io/icons" target="_blank" className="text-primary underline">
          Tabler Icons
        </a>{" "}
        بدون بادئة (مثال: armchair-2, building, brush).
      </p>

      <div className="border border-border rounded-xl p-4 mb-8 space-y-3">
        <p className="font-medium">إضافة نوع خدمة جديد</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="اسم الخدمة"
            className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="اسم الأيقونة (اختياري)"
            className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium"
          >
            إضافة
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-text-secondary">جاري التحميل...</p>
      ) : items.length === 0 ? (
        <p className="text-text-secondary">لسه مفيش أنواع خدمات مضافة.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border border-border rounded-lg p-3"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0 || saving}
                  className="text-xs text-text-secondary disabled:opacity-30"
                  aria-label="تحريك لأعلى"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1 || saving}
                  className="text-xs text-text-secondary disabled:opacity-30"
                  aria-label="تحريك لأسفل"
                >
                  ▼
                </button>
              </div>

              {editingId === item.id ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(item.id)}
                      disabled={saving}
                      className="px-3 py-2 rounded-lg bg-primary text-white text-sm"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-2 rounded-lg border border-border text-sm"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-text-secondary">أيقونة: {item.icon}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="px-3 py-2 rounded-lg border border-border text-sm"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 rounded-lg border border-danger text-danger text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}