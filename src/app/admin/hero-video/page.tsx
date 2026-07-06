"use client";

import { useState, useEffect } from "react";
import {
  getHeroVideo,
  updateHeroVideo,
  clearHeroVideoField,
} from "@/lib/firestore/heroVideo";
import {
  uploadHeroVideo,
  deleteFromCloudinary,
  getPosterFromFrame,
} from "@/lib/cloudinaryUpload";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface CompressionInfo {
  before: number;
  after: number;
}

export default function AdminHeroVideoPage() {
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);

  const [currentDesktopUrl, setCurrentDesktopUrl] = useState<string | null>(null);
  const [currentMobileUrl, setCurrentMobileUrl] = useState<string | null>(null);

  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [deletingDesktop, setDeletingDesktop] = useState(false);
  const [deletingMobile, setDeletingMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  const [desktopCompression, setDesktopCompression] = useState<CompressionInfo | null>(null);
  const [mobileCompression, setMobileCompression] = useState<CompressionInfo | null>(null);

  // ✅ فريم منفصل لللاب
  const [desktopPosterFrame, setDesktopPosterFrame] = useState<number>(0);
  const [savingDesktopFrame, setSavingDesktopFrame] = useState(false);

  // ✅ فريم منفصل للموبايل
  const [mobilePosterFrame, setMobilePosterFrame] = useState<number>(0);
  const [savingMobileFrame, setSavingMobileFrame] = useState(false);

  useEffect(() => {
    async function loadCurrent() {
      setLoading(true);
      const data = await getHeroVideo();
      if (data) {
        setCurrentDesktopUrl(data.desktopVideoUrl || null);
        setCurrentMobileUrl(data.mobileVideoUrl || null);
        setDesktopPosterFrame(data.desktopPosterFrame || 0);
        setMobilePosterFrame(data.mobilePosterFrame || 0);
      }
      setLoading(false);
    }

    loadCurrent();
  }, []);

  function handleDesktopFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setDesktopFile(file);
    setDesktopPreview(file ? URL.createObjectURL(file) : null);
    setDesktopCompression(null);
  }

  function handleMobileFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setMobileFile(file);
    setMobilePreview(file ? URL.createObjectURL(file) : null);
    setMobileCompression(null);
  }

  async function handleUploadDesktop() {
    if (!desktopFile) {
      alert("اختار فيديو الأول");
      return;
    }
    setUploadingDesktop(true);
    try {
      // ✅ بيمسح الفيديو القديم من Cloudinary الأول قبل رفع الجديد
      if (currentDesktopUrl) {
        console.log("🗑️ جاري حذف الفيديو القديم من Cloudinary:", currentDesktopUrl);
        const deleted = await deleteFromCloudinary(currentDesktopUrl, "hero", "video");
        console.log(deleted ? "✅ تم حذف القديم من Cloudinary" : "⚠️ فشل حذف القديم من Cloudinary");
      }

      const sizeBefore = desktopFile.size;
      const { url, bytes: sizeAfter } = await uploadHeroVideo(desktopFile, "desktop");
      await updateHeroVideo({ desktopVideoUrl: url });

      setCurrentDesktopUrl(url);
      setDesktopCompression({ before: sizeBefore, after: sizeAfter });
      setDesktopFile(null);
      setDesktopPreview(null);
    } catch (error) {
      console.error(error);
      alert("فشل رفع فيديو اللاب/التاب");
    } finally {
      setUploadingDesktop(false);
    }
  }

  async function handleUploadMobile() {
    if (!mobileFile) {
      alert("اختار فيديو الأول");
      return;
    }
    setUploadingMobile(true);
    try {
      // ✅ بيمسح الفيديو القديم من Cloudinary الأول قبل رفع الجديد
      if (currentMobileUrl) {
        console.log("🗑️ جاري حذف الفيديو القديم من Cloudinary:", currentMobileUrl);
        const deleted = await deleteFromCloudinary(currentMobileUrl, "hero-mobile", "video");
        console.log(deleted ? "✅ تم حذف القديم من Cloudinary" : "⚠️ فشل حذف القديم من Cloudinary");
      }

      const sizeBefore = mobileFile.size;
      const { url, bytes: sizeAfter } = await uploadHeroVideo(mobileFile, "mobile");
      await updateHeroVideo({ mobileVideoUrl: url });

      setCurrentMobileUrl(url);
      setMobileCompression({ before: sizeBefore, after: sizeAfter });
      setMobileFile(null);
      setMobilePreview(null);
    } catch (error) {
      console.error(error);
      alert("فشل رفع فيديو الموبايل");
    } finally {
      setUploadingMobile(false);
    }
  }

  // ✅ حفظ فريم اللاب
  async function handleSaveDesktopFrame() {
    setSavingDesktopFrame(true);
    try {
      await updateHeroVideo({ desktopPosterFrame });
      alert("✅ تم حفظ فريم اللاب بنجاح");
    } catch (error) {
      console.error(error);
      alert("فشل حفظ الفريم");
    } finally {
      setSavingDesktopFrame(false);
    }
  }

  // ✅ حفظ فريم الموبايل
  async function handleSaveMobileFrame() {
    setSavingMobileFrame(true);
    try {
      await updateHeroVideo({ mobilePosterFrame });
      alert("✅ تم حفظ فريم الموبايل بنجاح");
    } catch (error) {
      console.error(error);
      alert("فشل حفظ الفريم");
    } finally {
      setSavingMobileFrame(false);
    }
  }

  // ✅ حذف فيديو اللاب + مسح فعلي من Cloudinary
  async function handleDeleteDesktop() {
    if (!currentDesktopUrl) return;
    const confirmed = confirm(
      "متأكد إنك عايز تمسح فيديو اللاب/التاب؟\n⚠️ الفيديو هيتمسح من Cloudinary نهائيًا!"
    );
    if (!confirmed) return;

    setDeletingDesktop(true);
    try {
      console.log("🗑️ جاري الحذف من Cloudinary:", currentDesktopUrl);
      const deleted = await deleteFromCloudinary(currentDesktopUrl, "hero", "video");

      if (deleted) {
        console.log("✅ تم التأكيد: الفيديو اتمسح من Cloudinary فعليًا");
      } else {
        console.warn("⚠️ الحذف من Cloudinary فشل أو رجع false — راجع الـ API route والـ Console");
      }

      await clearHeroVideoField("desktopVideoUrl");
      setCurrentDesktopUrl(null);
      setDesktopCompression(null);
      alert(deleted ? "✅ تم حذف الفيديو من Cloudinary وFirestore" : "⚠️ اتمسح من Firestore، لكن فيه مشكلة في حذفه من Cloudinary (شوف الـ Console)");
    } catch (error) {
      console.error("❌ خطأ في الحذف:", error);
      alert("فشل حذف الفيديو");
    } finally {
      setDeletingDesktop(false);
    }
  }

  // ✅ حذف فيديو الموبايل + مسح فعلي من Cloudinary
  async function handleDeleteMobile() {
    if (!currentMobileUrl) return;
    const confirmed = confirm(
      "متأكد إنك عايز تمسح فيديو الموبايل؟\n⚠️ الفيديو هيتمسح من Cloudinary نهائيًا!"
    );
    if (!confirmed) return;

    setDeletingMobile(true);
    try {
      console.log("🗑️ جاري الحذف من Cloudinary:", currentMobileUrl);
      const deleted = await deleteFromCloudinary(currentMobileUrl, "hero-mobile", "video");

      if (deleted) {
        console.log("✅ تم التأكيد: الفيديو اتمسح من Cloudinary فعليًا");
      } else {
        console.warn("⚠️ الحذف من Cloudinary فشل أو رجع false — راجع الـ API route والـ Console");
      }

      await clearHeroVideoField("mobileVideoUrl");
      setCurrentMobileUrl(null);
      setMobileCompression(null);
      alert(deleted ? "✅ تم حذف الفيديو من Cloudinary وFirestore" : "⚠️ اتمسح من Firestore، لكن فيه مشكلة في حذفه من Cloudinary (شوف الـ Console)");
    } catch (error) {
      console.error("❌ خطأ في الحذف:", error);
      alert("فشل حذف الفيديو");
    } finally {
      setDeletingMobile(false);
    }
  }

  const desktopPosterPreview = currentDesktopUrl
    ? getPosterFromFrame(currentDesktopUrl, desktopPosterFrame)
    : "";

  const mobilePosterPreview = currentMobileUrl
    ? getPosterFromFrame(currentMobileUrl, mobilePosterFrame)
    : "";

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        إدارة فيديو الهيرو
      </h1>
      <p className="text-text-muted text-sm mb-8">
        ارفع فيديو أفقي للاب/التاب وفيديو عمودي للموبايل — مع فريم غلاف منفصل لكل واحد
      </p>

      {loading ? (
        <p className="text-text-muted">جاري التحميل...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ============ اللاب/التاب ============ */}
          <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              🖥️ فيديو اللاب / التاب (أفقي)
            </h2>

            {currentDesktopUrl && !desktopPreview && (
              <div>
                <p className="text-text-muted text-xs mb-2">الفيديو الحالي:</p>
                <video
                  src={currentDesktopUrl}
                  className="w-full rounded-lg border border-border aspect-video object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                <button
                  onClick={handleDeleteDesktop}
                  disabled={deletingDesktop}
                  className="w-full mt-3 text-error border border-error/30 hover:bg-error/10 disabled:opacity-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  {deletingDesktop ? "جاري الحذف..." : "🗑️ حذف الفيديو من Cloudinary"}
                </button>
              </div>
            )}

            {!currentDesktopUrl && (
              <p className="text-text-muted text-xs">مفيش فيديو مرفوع دلوقتي</p>
            )}

            {desktopCompression && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-3 space-y-1">
                <p className="text-xs text-text-secondary">
                  📊 الحجم قبل الرفع:{" "}
                  <span className="font-semibold text-text-primary">
                    {formatBytes(desktopCompression.before)}
                  </span>
                </p>
                <p className="text-xs text-text-secondary">
                  📊 الحجم بعد الضغط:{" "}
                  <span className="font-semibold text-text-primary">
                    {formatBytes(desktopCompression.after)}
                  </span>
                </p>
                <p className="text-xs font-semibold text-success">
                  ✅ تم توفير{" "}
                  {Math.round(
                    (1 - desktopCompression.after / desktopCompression.before) * 100
                  )}
                  % من المساحة
                </p>
              </div>
            )}

            <div>
              <label className="block text-text-secondary text-sm mb-2">
                📤 ارفع فيديو جديد هنا
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleDesktopFileChange}
                className="w-full text-text-secondary text-sm"
              />
            </div>

            {desktopPreview && (
              <div>
                <p className="text-text-muted text-xs mb-2">معاينة الفيديو الجديد:</p>
                <video
                  src={desktopPreview}
                  className="w-full rounded-lg border border-primary aspect-video object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              </div>
            )}

            <button
              onClick={handleUploadDesktop}
              disabled={!desktopFile || uploadingDesktop}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
            >
              {uploadingDesktop ? "جاري الرفع..." : "رفع وتحديث فيديو اللاب"}
            </button>

            {/* ✅ Slider منفصل لللاب */}
            {currentDesktopUrl && (
              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  🖼️ فريم الغلاف (Poster) - اللاب
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>الثانية: {desktopPosterFrame}</span>
                    <span>0 - 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={desktopPosterFrame}
                    onChange={(e) => setDesktopPosterFrame(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                {desktopPosterPreview && (
                  <div>
                    <p className="text-text-muted text-xs mb-2">معاينة الفريم:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={desktopPosterPreview}
                      alt="معاينة فريم الغلاف"
                      className="w-full rounded-lg border border-border aspect-video object-cover"
                    />
                  </div>
                )}

                <button
                  onClick={handleSaveDesktopFrame}
                  disabled={savingDesktopFrame}
                  className="w-full bg-surface hover:bg-border disabled:opacity-50 text-text-primary border border-border px-6 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  {savingDesktopFrame ? "جاري الحفظ..." : "💾 حفظ فريم اللاب"}
                </button>
              </div>
            )}
          </div>

          {/* ============ الموبايل ============ */}
          <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              📱 فيديو الموبايل (عمودي)
            </h2>

            {currentMobileUrl && !mobilePreview && (
              <div>
                <p className="text-text-muted text-xs mb-2">الفيديو الحالي:</p>
                <video
                  src={currentMobileUrl}
                  className="w-full max-w-[200px] mx-auto rounded-lg border border-border aspect-[9/16] object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                <button
                  onClick={handleDeleteMobile}
                  disabled={deletingMobile}
                  className="w-full mt-3 text-error border border-error/30 hover:bg-error/10 disabled:opacity-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  {deletingMobile ? "جاري الحذف..." : "🗑️ حذف الفيديو من Cloudinary"}
                </button>
              </div>
            )}

            {!currentMobileUrl && (
              <p className="text-text-muted text-xs">مفيش فيديو مرفوع دلوقتي</p>
            )}

            {mobileCompression && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-3 space-y-1">
                <p className="text-xs text-text-secondary">
                  📊 الحجم قبل الرفع:{" "}
                  <span className="font-semibold text-text-primary">
                    {formatBytes(mobileCompression.before)}
                  </span>
                </p>
                <p className="text-xs text-text-secondary">
                  📊 الحجم بعد الضغط:{" "}
                  <span className="font-semibold text-text-primary">
                    {formatBytes(mobileCompression.after)}
                  </span>
                </p>
                <p className="text-xs font-semibold text-success">
                  ✅ تم توفير{" "}
                  {Math.round(
                    (1 - mobileCompression.after / mobileCompression.before) * 100
                  )}
                  % من المساحة
                </p>
              </div>
            )}

            <div>
              <label className="block text-text-secondary text-sm mb-2">
                📤 ارفع فيديو جديد هنا
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleMobileFileChange}
                className="w-full text-text-secondary text-sm"
              />
            </div>

            {mobilePreview && (
              <div>
                <p className="text-text-muted text-xs mb-2">معاينة الفيديو الجديد:</p>
                <video
                  src={mobilePreview}
                  className="w-full max-w-[200px] mx-auto rounded-lg border border-primary aspect-[9/16] object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              </div>
            )}

            <button
              onClick={handleUploadMobile}
              disabled={!mobileFile || uploadingMobile}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
            >
              {uploadingMobile ? "جاري الرفع..." : "رفع وتحديث فيديو الموبايل"}
            </button>

            {/* ✅ Slider منفصل للموبايل */}
            {currentMobileUrl && (
              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  🖼️ فريم الغلاف (Poster) - الموبايل
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>الثانية: {mobilePosterFrame}</span>
                    <span>0 - 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={mobilePosterFrame}
                    onChange={(e) => setMobilePosterFrame(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                {mobilePosterPreview && (
                  <div>
                    <p className="text-text-muted text-xs mb-2">معاينة الفريم:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mobilePosterPreview}
                      alt="معاينة فريم الغلاف"
                      className="w-full max-w-[200px] mx-auto rounded-lg border border-border aspect-[9/16] object-cover"
                    />
                  </div>
                )}

                <button
                  onClick={handleSaveMobileFrame}
                  disabled={savingMobileFrame}
                  className="w-full bg-surface hover:bg-border disabled:opacity-50 text-text-primary border border-border px-6 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  {savingMobileFrame ? "جاري الحفظ..." : "💾 حفظ فريم الموبايل"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}