"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getSettings, updateSettings } from "@/lib/firestore/settings";

const DEFAULT_LOGO_URL =
  "https://res.cloudinary.com/yrltdsrw/image/upload/Gemini_Generated_Image_kkpgr8kkpgr8kkpg_lvwkws.png";

export default function AdminSettingsPage() {
  // ─── Logo ───
  const [logoUrl, setLogoUrl] = useState("");
  const [logoKey, setLogoKey] = useState("");
  const [logoHeight, setLogoHeight] = useState(56);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ─── WhatsApp ───
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState(
    "مرحباً Axis Design Studio 👋\n\nأنا مهتم بالعرض: *{title}*\n\nممكن التفاصيل؟"
  );

  // ─── Magnifier ───
  const [magnifierSize, setMagnifierSize] = useState(170);
  const [magnifierZoom, setMagnifierZoom] = useState(2);

  // ─── Loading / Saving ───
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getSettings();
      if (data) {
        setLogoUrl(data.logoUrl || "");
        setLogoKey(data.logoKey || "");
        setLogoHeight(data.logoHeight || 56);
        setWhatsappNumber(data.whatsappNumber || "");
        setWhatsappMessage(
          data.whatsappMessage ||
            "مرحباً Axis Design Studio 👋\n\nأنا مهتم بالعرض: *{title}*\n\nممكن التفاصيل؟"
        );
        setMagnifierSize(data.magnifierSize || 170);
        setMagnifierZoom(data.magnifierZoom || 2);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function uploadToR2(
    file: File,
    folder: string,
    setUploading: (v: boolean) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ): Promise<{ url: string; key: string } | null> {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await fetch("/api/r2/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("فشل الرفع");
      return await res.json();
    } catch (error) {
      console.error(error);
      alert("فشل رفع الملف، حاول تاني");
      return null;
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function deleteFromR2(key: string) {
    if (!key) return;
    try {
      await fetch("/api/r2/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadToR2(file, "logo", setUploadingLogo, logoInputRef);
    if (!result) return;
    if (logoKey) await deleteFromR2(logoKey);
    setLogoUrl(result.url);
    setLogoKey(result.key);
  }

  async function handleSave() {
    const cleaned = whatsappNumber.replace(/\s/g, "").replace(/^0/, "");
    if (!cleaned || cleaned.length < 10) {
      alert("رقم الواتساب غير صحيح");
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        whatsappNumber: cleaned,
        whatsappMessage: whatsappMessage.trim(),
        magnifierSize,
        magnifierZoom,
        logoUrl,
        logoKey,
        logoHeight,
      });
      alert("✅ تم حفظ الإعدادات");
    } catch (error) {
      console.error(error);
      alert("❌ فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-text-muted p-6">جاري التحميل...</p>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        ⚙️ الإعدادات العامة
      </h1>
      <p className="text-text-muted text-sm mb-8">
        إعدادات اللوجو والتواصل وعدسة التكبير
      </p>

      <div className="space-y-6">
        {/* ═══════════════════════════════════════
            🖼️ اللوجو
        ═══════════════════════════════════════ */}
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-text-primary">🖼️ لوجو المكتب</h2>

          <div className="flex items-center gap-6">
            <div
              className="relative bg-surface border border-border rounded-lg flex items-center justify-center p-3 shrink-0"
              style={{ width: 160, height: 100 }}
            >
              <Image
                src={logoUrl || DEFAULT_LOGO_URL}
                alt="معاينة اللوجو"
                width={200}
                height={80}
                style={{ height: logoHeight, width: "auto", maxWidth: "100%" }}
                className="object-contain"
              />
            </div>

            <div className="flex-1 space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="block w-full text-sm text-text-secondary file:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer cursor-pointer"
              />
              {uploadingLogo && (
                <p className="text-xs text-primary">⏳ جاري رفع اللوجو...</p>
              )}
              <p className="text-[10px] text-text-muted">
                يفضّل صورة PNG بخلفية شفافة
              </p>
            </div>
          </div>

          {/* معاينة الناف بار */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-text-muted font-medium">
              شكل اللوجو داخل الناف بار (معاينة حية):
            </p>
            <div className="border border-border rounded-xl overflow-hidden bg-white">
              <div className="flex items-center justify-between h-20 px-6">
                <div className="flex items-center">
                  <Image
                    src={logoUrl || DEFAULT_LOGO_URL}
                    alt="معاينة الناف بار"
                    width={300}
                    height={120}
                    style={{ height: logoHeight, width: "auto" }}
                    className="object-contain"
                  />
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
                  <span>الرئيسية</span>
                  <span>المشاريع</span>
                  <span>المنتجات</span>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100" />
                  <div className="border border-gray-300 rounded-full px-4 py-2 text-xs text-gray-400">
                    البورتفوليو
                  </div>
                  <div className="bg-gray-800 text-white text-xs px-4 py-2 rounded-full">
                    احجز استشارة
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* حجم اللوجو */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                ارتفاع اللوجو (بالبكسل)
              </label>
              <span className="text-sm text-text-muted">{logoHeight}px</span>
            </div>
            <input
              type="range"
              min={30}
              max={400}
              step={5}
              value={logoHeight}
              onChange={(e) => setLogoHeight(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || uploadingLogo}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2.5 rounded-full font-medium transition-colors"
          >
            {saving ? "جاري الحفظ..." : "💾 حفظ اللوجو"}
          </button>
        </div>

        {/* ═══════════════════════════════════════
            📱 الواتساب
        ═══════════════════════════════════════ */}
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-text-primary">📱 رقم الواتساب</h2>
          <p className="text-xs text-text-muted">
            الرقم بدون صفر في الأول (مثال: 201012345678)
          </p>
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="201012345678"
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-primary text-sm dir-ltr text-left"
            dir="ltr"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">💬 رسالة الواتساب</label>
            <p className="text-xs text-text-muted">
              استخدم {"{title}"} لو عايز اسم العرض يتكتب تلقائي
            </p>
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-primary text-sm resize-none"
            />
            <p className="text-[10px] text-text-muted">
              معاينة: {whatsappMessage.replace("{title}", "عرض خصم 20%")}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2.5 rounded-full font-medium transition-colors"
          >
            {saving ? "جاري الحفظ..." : "💾 حفظ إعدادات الواتساب"}
          </button>
        </div>

        {/* ═══════════════════════════════════════
            🔍 عدسة التكبير
        ═══════════════════════════════════════ */}
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-text-primary">🔍 عدسة تكبير صور المشاريع</h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">حجم العدسة</label>
              <span className="text-sm text-text-muted">{magnifierSize}px</span>
            </div>
            <input
              type="range"
              min={100}
              max={300}
              step={10}
              value={magnifierSize}
              onChange={(e) => setMagnifierSize(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">نسبة التقريب</label>
              <span className="text-sm text-text-muted">{Math.round(magnifierZoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1.2}
              max={4}
              step={0.1}
              value={magnifierZoom}
              onChange={(e) => setMagnifierZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2.5 rounded-full font-medium transition-colors"
          >
            {saving ? "جاري الحفظ..." : "💾 حفظ إعدادات العدسة"}
          </button>
        </div>

        {/* ═══════════════════════════════════════
            💾 حفظ كل التعديلات
        ═══════════════════════════════════════ */}
        <div className="sticky bottom-6 bg-surface-raised border border-border rounded-xl p-4 shadow-lg">
          <button
            onClick={handleSave}
            disabled={saving || uploadingLogo}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3 rounded-full font-bold text-lg transition-colors"
          >
            {saving ? "⏳ جاري الحفظ..." : "💾 حفظ كل التعديلات"}
          </button>
        </div>
      </div>
    </div>
  );
}