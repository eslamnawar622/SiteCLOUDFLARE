"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getProcessSteps,
  addProcessStep,
  updateProcessStep,
  deleteProcessStep,
  getProcessSettings,
  updateProcessSettings,
} from "@/lib/firestore/process";
import { ProcessStep, ProcessSettings, DEFAULT_PROCESS_SETTINGS } from "@/types/process";
import { PROCESS_ICON_OPTIONS } from "@/lib/processIcons";

export default function ProcessAdminPage() {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [settings, setSettings] = useState<ProcessSettings>(DEFAULT_PROCESS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newIcon, setNewIcon] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const load = useCallback(async () => {
    try {
      const [stepsData, settingsData] = await Promise.all([
        getProcessSteps(),
        getProcessSettings(),
      ]);
      setSteps(stepsData);
      setSettings(settingsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = async () => {
    setSaving(true);
    await updateProcessSettings(settings);
    setSaving(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleAddStep = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    const nextOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.order)) + 1 : 0;
    await addProcessStep({
      title: newTitle.trim(),
      description: newDescription.trim(),
      details: newDetails.trim() || undefined,
      icon: newIcon || undefined,
      order: nextOrder,
    });
    setNewTitle("");
    setNewDescription("");
    setNewDetails("");
    setNewIcon("");
    setSaving(false);
    await load();
  };

  const startEdit = (step: ProcessStep) => {
    setEditingId(step.id);
    setEditTitle(step.title);
    setEditDescription(step.description);
    setEditDetails(step.details || "");
    setEditIcon(step.icon || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDetails("");
    setEditIcon("");
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    setSaving(true);
    await updateProcessStep(id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      details: editDetails.trim() || undefined,
      icon: editIcon || undefined,
    });
    setSaving(false);
    cancelEdit();
    await load();
  };

  const handleDeleteStep = async (id: string) => {
    if (!confirm("متأكد إنك عايز تمسح الخطوة دي؟")) return;
    setSaving(true);
    await deleteProcessStep(id);
    setSaving(false);
    await load();
  };

  const moveStep = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const a = steps[index];
    const b = steps[targetIndex];
    setSaving(true);
    await updateProcessStep(a.id, { order: b.order });
    await updateProcessStep(b.id, { order: a.order });
    setSaving(false);
    await load();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6" dir="rtl">
        <p className="text-text-secondary">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6" dir="rtl">
      <h1 className="text-2xl font-semibold mb-2">سكشن مراحل العمل</h1>
      <p className="text-text-secondary mb-8">
        السكشن اللي بيوضح للعميل رحلته معاك من الاستشارة للتسليم.
      </p>

      {/* إعدادات عامة */}
      <div className="border border-border rounded-xl p-4 mb-8 space-y-4">
        <p className="font-medium">النصوص العامة</p>

        <div>
          <label className="block text-text-secondary text-sm mb-1">
            الجملة الصغيرة فوق العنوان
          </label>
          <input
            type="text"
            value={settings.sectionLabel}
            onChange={(e) => setSettings({ ...settings, sectionLabel: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1">العنوان الرئيسي</label>
          <input
            type="text"
            value={settings.sectionTitle}
            onChange={(e) => setSettings({ ...settings, sectionTitle: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
          />
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-medium mb-1">خلفية السكشن (اختياري)</p>
          <p className="text-xs text-text-secondary mb-3">
            لو عايز تحط صورة خلفية، أنسب أبعاد ليها <strong>1920×600 بكسل</strong> (عرضية،
            landscape)، وحجم الملف أقل من 500 كيلوبايت عشان الموقع يفضل سريع. ابعت المواصفة دي
            للعميل لو هيديك صورة جاهزة. الصورة بتظهر باهتة خلف الخطوات مش واضحة بالكامل، فمش
            لازم تكون عالية الجودة جدًا.
          </p>
          <label className="block text-text-secondary text-sm mb-1">رابط الصورة</label>
          <input
            type="text"
            value={settings.backgroundImageUrl}
            onChange={(e) => setSettings({ ...settings, backgroundImageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary mb-3"
          />

          <label className="block text-text-secondary text-sm mb-1">
            شفافية الصورة (Opacity): {settings.backgroundOpacity}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.backgroundOpacity}
            onChange={(e) =>
              setSettings({ ...settings, backgroundOpacity: Number(e.target.value) })
            }
            className="w-full"
          />
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium"
        >
          {settingsSaved ? "تم الحفظ ✓" : "حفظ النصوص والخلفية"}
        </button>
      </div>

      {/* إضافة خطوة */}
      <div className="border border-border rounded-xl p-4 mb-8 space-y-3">
        <p className="font-medium">إضافة خطوة جديدة</p>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="عنوان الخطوة (مثال: استشارة مجانية)"
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="وصف مختصر (سطر واحد)"
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
        />
        <textarea
          value={newDetails}
          onChange={(e) => setNewDetails(e.target.value)}
          placeholder="تفاصيل إضافية تظهر لما العميل يدوس على الخطوة (اختياري)"
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
        />
        <div>
          <label className="block text-text-secondary text-sm mb-1">أيقونة الخطوة</label>
          <select
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
          >
            {PROCESS_ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAddStep}
          disabled={saving || !newTitle.trim()}
          className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium"
        >
          إضافة الخطوة
        </button>
      </div>

      {/* قائمة الخطوات */}
      {steps.length === 0 ? (
        <p className="text-text-secondary">لسه مفيش خطوات مضافة.</p>
      ) : (
        <ul className="space-y-2">
          {steps.map((step, index) => (
            <li key={step.id} className="border border-border rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => moveStep(index, -1)}
                    disabled={index === 0 || saving}
                    className="text-xs text-text-secondary disabled:opacity-30"
                    aria-label="تحريك لأعلى"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveStep(index, 1)}
                    disabled={index === steps.length - 1 || saving}
                    className="text-xs text-text-secondary disabled:opacity-30"
                    aria-label="تحريك لأسفل"
                  >
                    ▼
                  </button>
                </div>

                {editingId === step.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
                    />
                    <textarea
                      value={editDetails}
                      onChange={(e) => setEditDetails(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
                    />
                    <select
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
                    >
                      {PROCESS_ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(step.id)}
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
                  <div className="flex-1 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{step.title}</p>
                      <p className="text-sm text-text-secondary">{step.description}</p>
                      {step.details && (
                        <p className="text-xs text-text-muted mt-1">تفاصيل: {step.details}</p>
                      )}
                      {step.icon && (
                        <p className="text-xs text-text-muted mt-1">
                          الأيقونة: {PROCESS_ICON_OPTIONS.find((o) => o.value === step.icon)?.label}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(step)}
                        className="px-3 py-2 rounded-lg border border-border text-sm"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="px-3 py-2 rounded-lg border border-danger text-danger text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}