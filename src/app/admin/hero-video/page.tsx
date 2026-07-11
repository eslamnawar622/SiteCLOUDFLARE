"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { getSettings, updateSettings } from "@/lib/firestore/settings";

const CLOUDINARY_ACCOUNT_OPTIONS = [
  { label: "Cloudinary 1 (لابتوب)", value: "account1" },
  { label: "Cloudinary 2 (موبايل)", value: "account2" },
];

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ─── مكوّن صغير لعرض لينك مع زرار نسخ ───
function LinkField({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error(error);
    }
  }

  if (!url) return null;

  return (
    <div className="space-y-1">
      <p className="text-xs text-text-muted">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={url}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-xs truncate dir-ltr text-left"
          dir="ltr"
        />
        <button
          onClick={handleCopy}
          type="button"
          className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
            copied
              ? "bg-green-50 border-green-300 text-green-600"
              : "border-border text-text-secondary hover:bg-surface"
          }`}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "اتنسخ" : "نسخ"}
        </button>
      </div>
    </div>
  );
}

interface PendingVideo {
  videoUrl: string;
  publicId: string;
  duration: number;
  accountId: string;
  fileExt: string;
}

export default function AdminHeroVideoPage() {
  // ─── لابتوب ───
  const [heroDesktopVideoUrl, setHeroDesktopVideoUrl] = useState("");
  const [heroDesktopVideoKey, setHeroDesktopVideoKey] = useState("");
  const [heroDesktopPosterUrl, setHeroDesktopPosterUrl] = useState("");
  const [heroDesktopPosterKey, setHeroDesktopPosterKey] = useState("");
  const [heroDesktopAccount, setHeroDesktopAccount] = useState("account1");
  const [uploadingDesktopTemp, setUploadingDesktopTemp] = useState(false);
  const [finalizingDesktop, setFinalizingDesktop] = useState(false);
  const [pendingDesktop, setPendingDesktop] = useState<PendingVideo | null>(null);
  const [desktopFrame, setDesktopFrame] = useState(0);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const desktopPreviewRef = useRef<HTMLVideoElement>(null);

  // ─── موبايل ───
  const [heroMobileVideoUrl, setHeroMobileVideoUrl] = useState("");
  const [heroMobileVideoKey, setHeroMobileVideoKey] = useState("");
  const [heroMobilePosterUrl, setHeroMobilePosterUrl] = useState("");
  const [heroMobilePosterKey, setHeroMobilePosterKey] = useState("");
  const [heroMobileAccount, setHeroMobileAccount] = useState("account2");
  const [uploadingMobileTemp, setUploadingMobileTemp] = useState(false);
  const [finalizingMobile, setFinalizingMobile] = useState(false);
  const [pendingMobile, setPendingMobile] = useState<PendingVideo | null>(null);
  const [mobileFrame, setMobileFrame] = useState(0);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobilePreviewRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getSettings();
      if (data) {
        setHeroDesktopVideoUrl(data.heroDesktopVideoUrl || "");
        setHeroDesktopVideoKey(data.heroDesktopVideoKey || "");
        setHeroDesktopPosterUrl(data.heroDesktopPosterUrl || "");
        setHeroDesktopPosterKey(data.heroDesktopPosterKey || "");
        setHeroDesktopAccount(data.heroDesktopAccount || "account1");

        setHeroMobileVideoUrl(data.heroMobileVideoUrl || "");
        setHeroMobileVideoKey(data.heroMobileVideoKey || "");
        setHeroMobilePosterUrl(data.heroMobilePosterUrl || "");
        setHeroMobilePosterKey(data.heroMobilePosterKey || "");
        setHeroMobileAccount(data.heroMobileAccount || "account2");
      }
      setLoading(false);
    }
    load();
  }, []);

  function getFileExt(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "mp4";
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

  // ═══════════════════════════════════════════
  // خطوة ١: رفع مؤقت على Cloudinary
  // ═══════════════════════════════════════════
  async function uploadTemp(
    file: File,
    accountId: string,
    setUploading: (v: boolean) => void
  ): Promise<PendingVideo | null> {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", accountId);

      const res = await fetch("/api/hero-video/upload-temp", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("فشل الرفع المؤقت");
      const data = await res.json();

      return {
        videoUrl: data.videoUrl,
        publicId: data.publicId,
        duration: data.duration || 0,
        accountId: data.accountId,
        fileExt: getFileExt(file.name),
      };
    } catch (error) {
      console.error(error);
      alert("فشل رفع الفيديو، حاول تاني");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleDesktopFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const pending = await uploadTemp(file, heroDesktopAccount, setUploadingDesktopTemp);
    if (pending) {
      setPendingDesktop(pending);
      setDesktopFrame(0);
    }
    if (desktopInputRef.current) desktopInputRef.current.value = "";
  }

  async function handleMobileFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const pending = await uploadTemp(file, heroMobileAccount, setUploadingMobileTemp);
    if (pending) {
      setPendingMobile(pending);
      setMobileFrame(0);
    }
    if (mobileInputRef.current) mobileInputRef.current.value = "";
  }

  // ═══════════════════════════════════════════
  // السلايدر: تحريك الفيديو للفريم المختار
  // ═══════════════════════════════════════════
  function handleDesktopFrameChange(value: number) {
    setDesktopFrame(value);
    if (desktopPreviewRef.current) {
      desktopPreviewRef.current.currentTime = value;
    }
  }

  function handleMobileFrameChange(value: number) {
    setMobileFrame(value);
    if (mobilePreviewRef.current) {
      mobilePreviewRef.current.currentTime = value;
    }
  }

  // ═══════════════════════════════════════════
  // خطوة ٢: اعتماد الفريم → نقل نهائي لـ R2
  // ═══════════════════════════════════════════
  async function finalizeVideo(
    pending: PendingVideo,
    frameSecond: number,
    folder: string,
    setFinalizing: (v: boolean) => void
  ) {
    setFinalizing(true);
    try {
      const res = await fetch("/api/hero-video/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: pending.publicId,
          accountId: pending.accountId,
          videoUrl: pending.videoUrl,
          frameSecond,
          folder,
          fileExt: pending.fileExt,
        }),
      });

      if (!res.ok) throw new Error("فشل الاعتماد النهائي");
      return await res.json();
    } catch (error) {
      console.error(error);
      alert("فشل اعتماد الفريم، حاول تاني");
      return null;
    } finally {
      setFinalizing(false);
    }
  }

  async function handleConfirmDesktopFrame() {
    if (!pendingDesktop) return;
    const result = await finalizeVideo(pendingDesktop, desktopFrame, "hero-videos", setFinalizingDesktop);
    if (!result) return;

    if (heroDesktopVideoKey) await deleteFromR2(heroDesktopVideoKey);
    if (heroDesktopPosterKey) await deleteFromR2(heroDesktopPosterKey);

    setHeroDesktopVideoUrl(result.url);
    setHeroDesktopVideoKey(result.key);
    setHeroDesktopPosterUrl(result.posterUrl);
    setHeroDesktopPosterKey(result.posterKey);

    await updateSettings({
      heroDesktopVideoUrl: result.url,
      heroDesktopVideoKey: result.key,
      heroDesktopPosterUrl: result.posterUrl,
      heroDesktopPosterKey: result.posterKey,
      heroDesktopAccount: pendingDesktop.accountId,
    });

    setPendingDesktop(null);
    alert("✅ تم اعتماد الفريم وحفظ فيديو اللاب");
  }

  async function handleConfirmMobileFrame() {
    if (!pendingMobile) return;
    const result = await finalizeVideo(pendingMobile, mobileFrame, "hero-videos", setFinalizingMobile);
    if (!result) return;

    if (heroMobileVideoKey) await deleteFromR2(heroMobileVideoKey);
    if (heroMobilePosterKey) await deleteFromR2(heroMobilePosterKey);

    setHeroMobileVideoUrl(result.url);
    setHeroMobileVideoKey(result.key);
    setHeroMobilePosterUrl(result.posterUrl);
    setHeroMobilePosterKey(result.posterKey);

    await updateSettings({
      heroMobileVideoUrl: result.url,
      heroMobileVideoKey: result.key,
      heroMobilePosterUrl: result.posterUrl,
      heroMobilePosterKey: result.posterKey,
      heroMobileAccount: pendingMobile.accountId,
    });

    setPendingMobile(null);
    alert("✅ تم اعتماد الفريم وحفظ فيديو الموبايل");
  }

  function handleCancelDesktopPending() {
    setPendingDesktop(null);
    setDesktopFrame(0);
  }

  function handleCancelMobilePending() {
    setPendingMobile(null);
    setMobileFrame(0);
  }

  // ─── حذف فيديو اللاب ───
  async function handleDeleteDesktop() {
    if (!heroDesktopVideoUrl) return;
    if (!confirm("متأكد إنك عايز تحذف فيديو اللاب؟")) return;

    if (heroDesktopVideoKey) await deleteFromR2(heroDesktopVideoKey);
    if (heroDesktopPosterKey) await deleteFromR2(heroDesktopPosterKey);

    setHeroDesktopVideoUrl("");
    setHeroDesktopVideoKey("");
    setHeroDesktopPosterUrl("");
    setHeroDesktopPosterKey("");

    await updateSettings({
      heroDesktopVideoUrl: "",
      heroDesktopVideoKey: "",
      heroDesktopPosterUrl: "",
      heroDesktopPosterKey: "",
    });

    alert("✅ تم حذف فيديو اللاب");
  }

  // ─── حذف فيديو الموبايل ───
  async function handleDeleteMobile() {
    if (!heroMobileVideoUrl) return;
    if (!confirm("متأكد إنك عايز تحذف فيديو الموبايل؟")) return;

    if (heroMobileVideoKey) await deleteFromR2(heroMobileVideoKey);
    if (heroMobilePosterKey) await deleteFromR2(heroMobilePosterKey);

    setHeroMobileVideoUrl("");
    setHeroMobileVideoKey("");
    setHeroMobilePosterUrl("");
    setHeroMobilePosterKey("");

    await updateSettings({
      heroMobileVideoUrl: "",
      heroMobileVideoKey: "",
      heroMobilePosterUrl: "",
      heroMobilePosterKey: "",
    });

    alert("✅ تم حذف فيديو الموبايل");
  }

  // ─── حفظ اختيار الحساب (لو اتغير من غير رفع فيديو جديد) ───
  async function handleSaveAccounts() {
    setSaving(true);
    try {
      await updateSettings({
        heroDesktopAccount,
        heroMobileAccount,
      });
      alert("✅ تم حفظ اختيار الحسابات");
    } catch (error) {
      console.error(error);
      alert("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-text-muted p-6">جاري التحميل...</p>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        🎬 إدارة فيديو الهيرو
      </h1>
      <p className="text-text-muted text-sm mb-8">
        الفيديو بيترفع مؤقتًا على Cloudinary الأول، وبعدين تقدر تحرك السلايدر وتختار فريم الغلاف بنفسك، وبعد الاعتماد بينقل الفيديو والصورة لـ R2 نهائيًا ويتحذف من Cloudinary.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ═══════════════ فيديو اللاب/تاب ═══════════════ */}
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            🖥️ فيديو اللاب / التاب (أفقي)
          </h2>

          {/* اختيار حساب Cloudinary */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">حساب Cloudinary</label>
            <div className="relative">
              <select
                value={heroDesktopAccount}
                onChange={(e) => setHeroDesktopAccount(e.target.value)}
                disabled={!!pendingDesktop}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text-primary text-sm appearance-none cursor-pointer pr-10 disabled:opacity-50"
              >
                {CLOUDINARY_ACCOUNT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          {/* ─── وضع اختيار الفريم (فيديو مؤقت جديد) ─── */}
          {pendingDesktop ? (
            <div className="space-y-3 border border-primary/40 rounded-lg p-3 bg-primary/5">
              <p className="text-xs font-medium text-primary">🎯 اختر فريم الغلاف بتحريك السلايدر</p>
              <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
                <video
                  ref={desktopPreviewRef}
                  src={pendingDesktop.videoUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="auto"
                />
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(pendingDesktop.duration - 0.1, 0.1)}
                step={0.1}
                value={desktopFrame}
                onChange={(e) => handleDesktopFrameChange(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>0:00</span>
                <span>{desktopFrame.toFixed(1)}s</span>
                <span>{pendingDesktop.duration.toFixed(1)}s</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmDesktopFrame}
                  disabled={finalizingDesktop}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2 rounded-full text-sm font-bold transition-colors"
                >
                  {finalizingDesktop ? "⏳ جاري الاعتماد..." : "✅ اعتماد الفريم ده"}
                </button>
                <button
                  onClick={handleCancelDesktopPending}
                  disabled={finalizingDesktop}
                  className="px-4 border border-border rounded-full text-sm text-text-secondary hover:bg-surface disabled:opacity-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* المعاينة النهائية المحفوظة */}
              {heroDesktopVideoUrl ? (
                <div className="space-y-3">
                  <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
                    <video
                      src={heroDesktopVideoUrl}
                      poster={heroDesktopPosterUrl || undefined}
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                  </div>

                  {/* ═══ اللينكات النهائية على R2 ═══ */}
                  <div className="space-y-2 bg-surface rounded-lg p-3 border border-border">
                    <LinkField label="🔗 لينك الفيديو (R2)" url={heroDesktopVideoUrl} />
                    <LinkField label="🔗 لينك صورة الغلاف (R2)" url={heroDesktopPosterUrl} />
                  </div>

                  <button
                    onClick={handleDeleteDesktop}
                    className="w-full text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-full py-2 text-sm font-medium transition-colors"
                  >
                    🗑️ حذف الفيديو
                  </button>
                </div>
              ) : (
                <div className="aspect-video bg-surface border-2 border-dashed border-border rounded-lg flex items-center justify-center text-text-muted text-sm">
                  لا يوجد فيديو حالي
                </div>
              )}

              {/* رفع جديد */}
              <div className="space-y-2">
                <p className="text-xs text-text-muted">📤 ارفع فيديو جديد هنا</p>
                <input
                  ref={desktopInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleDesktopFileSelect}
                  disabled={uploadingDesktopTemp}
                  className="block w-full text-sm text-text-secondary file:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer cursor-pointer"
                />
                {uploadingDesktopTemp && (
                  <p className="text-xs text-primary">⏳ جاري الرفع المؤقت على Cloudinary...</p>
                )}
              </div>

              {heroDesktopPosterUrl && (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted">🖼️ فريم الغلاف الحالي</p>
                  <div className="rounded-lg overflow-hidden border border-border aspect-video">
                    <Image
                      src={heroDesktopPosterUrl}
                      alt="فريم الغلاف - اللاب"
                      width={640}
                      height={360}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══════════════ فيديو الموبايل ═══════════════ */}
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            📱 فيديو الموبايل (عمودي)
          </h2>

          {/* اختيار حساب Cloudinary */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">حساب Cloudinary</label>
            <div className="relative">
              <select
                value={heroMobileAccount}
                onChange={(e) => setHeroMobileAccount(e.target.value)}
                disabled={!!pendingMobile}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text-primary text-sm appearance-none cursor-pointer pr-10 disabled:opacity-50"
              >
                {CLOUDINARY_ACCOUNT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          {/* ─── وضع اختيار الفريم (فيديو مؤقت جديد) ─── */}
          {pendingMobile ? (
            <div className="space-y-3 border border-primary/40 rounded-lg p-3 bg-primary/5">
              <p className="text-xs font-medium text-primary">🎯 اختر فريم الغلاف بتحريك السلايدر</p>
              <div className="rounded-lg overflow-hidden border border-border bg-black aspect-[9/16] max-h-80 mx-auto">
                <video
                  ref={mobilePreviewRef}
                  src={pendingMobile.videoUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="auto"
                />
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(pendingMobile.duration - 0.1, 0.1)}
                step={0.1}
                value={mobileFrame}
                onChange={(e) => handleMobileFrameChange(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>0:00</span>
                <span>{mobileFrame.toFixed(1)}s</span>
                <span>{pendingMobile.duration.toFixed(1)}s</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmMobileFrame}
                  disabled={finalizingMobile}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2 rounded-full text-sm font-bold transition-colors"
                >
                  {finalizingMobile ? "⏳ جاري الاعتماد..." : "✅ اعتماد الفريم ده"}
                </button>
                <button
                  onClick={handleCancelMobilePending}
                  disabled={finalizingMobile}
                  className="px-4 border border-border rounded-full text-sm text-text-secondary hover:bg-surface disabled:opacity-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* المعاينة النهائية المحفوظة */}
              {heroMobileVideoUrl ? (
                <div className="space-y-3">
                  <div className="rounded-lg overflow-hidden border border-border bg-black aspect-[9/16] max-h-80 mx-auto">
                    <video
                      src={heroMobileVideoUrl}
                      poster={heroMobilePosterUrl || undefined}
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                  </div>

                  {/* ═══ اللينكات النهائية على R2 ═══ */}
                  <div className="space-y-2 bg-surface rounded-lg p-3 border border-border">
                    <LinkField label="🔗 لينك الفيديو (R2)" url={heroMobileVideoUrl} />
                    <LinkField label="🔗 لينك صورة الغلاف (R2)" url={heroMobilePosterUrl} />
                  </div>

                  <button
                    onClick={handleDeleteMobile}
                    className="w-full text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-full py-2 text-sm font-medium transition-colors"
                  >
                    🗑️ حذف الفيديو
                  </button>
                </div>
              ) : (
                <div className="aspect-[9/16] max-h-80 bg-surface border-2 border-dashed border-border rounded-lg flex items-center justify-center text-text-muted text-sm mx-auto">
                  لا يوجد فيديو حالي
                </div>
              )}

              {/* رفع جديد */}
              <div className="space-y-2">
                <p className="text-xs text-text-muted">📤 ارفع فيديو جديد هنا</p>
                <input
                  ref={mobileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleMobileFileSelect}
                  disabled={uploadingMobileTemp}
                  className="block w-full text-sm text-text-secondary file:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer cursor-pointer"
                />
                {uploadingMobileTemp && (
                  <p className="text-xs text-primary">⏳ جاري الرفع المؤقت على Cloudinary...</p>
                )}
              </div>

              {heroMobilePosterUrl && (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted">🖼️ فريم الغلاف الحالي</p>
                  <div className="rounded-lg overflow-hidden border border-border aspect-[9/16] max-h-40 mx-auto">
                    <Image
                      src={heroMobilePosterUrl}
                      alt="فريم الغلاف - الموبايل"
                      width={180}
                      height={320}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="sticky bottom-6 bg-surface-raised border border-border rounded-xl p-4 shadow-lg mt-6">
        <button
          onClick={handleSaveAccounts}
          disabled={saving || uploadingDesktopTemp || uploadingMobileTemp || !!pendingDesktop || !!pendingMobile}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3 rounded-full font-bold text-lg transition-colors"
        >
          {saving ? "⏳ جاري الحفظ..." : "💾 حفظ اختيار الحسابات"}
        </button>
      </div>
    </div>
  );
}