"use client";

import { useState, useEffect, useRef } from "react";
import {
  subscribeToCurrentOffer,
  subscribeToArchivedOffers,
  addCurrentOffer,
  addArchivedOffer,
  archiveOffer,
  setOfferAsCurrent,
  updateOffer,
  deleteOffer,
} from "@/lib/firestore/offers";
import { getSettings, updateSettings } from "@/lib/firestore/settings";
import { Offer, OfferStats, BadgePosition, BadgeOrientation } from "@/types/offer";

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

function confirmByTyping(message: string): boolean {
  const input = prompt(
    `${message}\n\nاكتب كلمة "حذف" بالظبط للتأكيد:`
  );
  return input === "حذف";
}

function getR2DashboardUrl(key: string): string {
  const accountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID!;
  const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME!;
  const encodedKey = encodeURIComponent(key);
  return `https://dash.cloudflare.com/${accountId}/r2/default/buckets/${bucketName}/objects/${encodedKey}`;
}

function getFileExt(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "mp4";
}

// ============================================
// 🔗 مكوّن صغير لعرض لينك R2 مع زرار نسخ — نفس اللي في صفحة الهيرو
// ============================================

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

// ============================================
// 🎬 فيديو العروض — رفع مؤقت على Cloudinary + اختيار فريم الغلاف
// نفس آلية hero-video بالظبط، لكن فيديو واحد بس (مفيش لابتوب/موبايل منفصلين)
// ============================================

interface PendingVideo {
  videoUrl: string;
  publicId: string;
  duration: number;
  accountId: string;
  fileExt: string;
}

const OFFER_VIDEO_ACCOUNT = "account1";
const OFFER_VIDEO_FOLDER = "عروض/العروض-الحالية";

// ============================================
// 🏷️ مكان الشريط الأزرق (badge) — شبكة 3×3
// ============================================

const BADGE_POSITIONS: { value: BadgePosition; label: string }[] = [
  { value: "top-left", label: "أعلى شمال" },
  { value: "top-center", label: "أعلى نص" },
  { value: "top-right", label: "أعلى يمين" },
  { value: "middle-left", label: "نص شمال" },
  { value: "middle-center", label: "نص نص" },
  { value: "middle-right", label: "نص يمين" },
  { value: "bottom-left", label: "تحت شمال" },
  { value: "bottom-center", label: "تحت نص" },
  { value: "bottom-right", label: "تحت يمين" },
];

// الافتراضي "middle-right" هو نفس المكان القديم الثابت
function getBadgePositionStyle(
  pos: BadgePosition = "middle-right"
): React.CSSProperties {
  switch (pos) {
    case "top-left":
      return { top: 0, left: 0 };
    case "top-center":
      return { top: 0, left: "50%", transform: "translateX(-50%)" };
    case "top-right":
      return { top: 0, right: 0 };
    case "middle-left":
      return { top: "50%", left: 0, transform: "translateY(-50%)" };
    case "middle-center":
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    case "middle-right":
      return { top: "50%", right: 0, transform: "translateY(-50%)" };
    case "bottom-left":
      return { bottom: 0, left: 0 };
    case "bottom-center":
      return { bottom: 0, left: "50%", transform: "translateX(-50%)" };
    case "bottom-right":
      return { bottom: 0, right: 0 };
    default:
      return { top: "50%", right: 0, transform: "translateY(-50%)" };
  }
}

// شكل حواف الشريط حسب اتجاهه ومكانه:
// عمودي → بيلزق في الجانب الشمال أو اليمين (زي لسان بارز)
// أفقي → بيلزق فوق أو تحت (زي شريط عريض)
function getBadgeShapeClasses(
  pos: BadgePosition = "middle-right",
  orientation: BadgeOrientation = "vertical"
): string {
  if (orientation === "horizontal") {
    if (pos.startsWith("top")) return "rounded-b-xl border-b-4";
    if (pos.startsWith("bottom")) return "rounded-t-xl border-t-4";
    return "rounded-xl border-2";
  }
  const isLeftSide = pos.endsWith("left");
  return isLeftSide ? "rounded-r-xl border-r-4" : "rounded-l-xl border-l-4";
}

const ORIENTATIONS: { value: BadgeOrientation; label: string }[] = [
  { value: "vertical", label: "↕️ عمودي (نص واقف)" },
  { value: "horizontal", label: "↔️ أفقي (شريط عريض)" },
];

function OrientationToggle({
  value,
  onChange,
}: {
  value: BadgeOrientation;
  onChange: (o: BadgeOrientation) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {ORIENTATIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-colors ${
            value === o.value
              ? "bg-primary text-white"
              : "bg-surface border border-border text-text-secondary hover:bg-border"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BadgePositionGrid({
  value,
  onChange,
}: {
  value: BadgePosition;
  onChange: (pos: BadgePosition) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {BADGE_POSITIONS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`px-2 py-2 rounded-lg text-[10px] font-medium transition-colors ${
            value === p.value
              ? "bg-primary text-white"
              : "bg-surface border border-border text-text-secondary hover:bg-border"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// 📊 مكون الإحصائيات
// ============================================

function OfferStatsBadge({ stats }: { stats?: OfferStats }) {
  if (!stats) return null;

  const totalViews = stats.totalViews || 0;
  const totalClicks = stats.totalClicks || 0;
  const mobileViews = stats.mobileViews || 0;
  const desktopViews = stats.desktopViews || 0;

  const mobilePercent =
    totalViews > 0 ? Math.round((mobileViews / totalViews) * 100) : 0;
  const desktopPercent = 100 - mobilePercent;
  const ctr =
    totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  // آخر 7 أيام
  const last7Days = [...(stats.history || [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const maxViews = Math.max(...last7Days.map((d) => d.views), 1);

  return (
    <div className="mt-2 space-y-2 bg-surface rounded-lg border border-border p-2.5">
      {/* الأرقام */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px]">
        <span className="text-text-muted" title="عدد المشاهدات">
          👁️ {totalViews.toLocaleString("ar-EG")}
        </span>
        <span className="text-text-muted" title="عدد الضغطات">
          🖱️ {totalClicks.toLocaleString("ar-EG")}
        </span>
        <span className="text-text-muted" title="نسبة الموبايل">
          📱 {mobilePercent}%
        </span>
        <span className="text-text-muted" title="نسبة الديسكتوب">
          💻 {desktopPercent}%
        </span>
        <span
          className="text-primary font-semibold"
          title="نسبة التحويل (Click-Through Rate)"
        >
          CTR: {ctr}%
        </span>
      </div>

      {/* شريط الأجهزة */}
      <div className="flex h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-primary"
          style={{ width: `${desktopPercent}%` }}
          title={`ديسكتوب: ${desktopPercent}%`}
        />
        <div
          className="bg-success"
          style={{ width: `${mobilePercent}%` }}
          title={`موبايل: ${mobilePercent}%`}
        />
      </div>

      {/* رسم بياني */}
      {last7Days.length > 0 && (
        <MiniChart data={last7Days} maxViews={maxViews} />
      )}
    </div>
  );
}

function MiniChart({
  data,
  maxViews,
}: {
  data: { date: string; views: number; clicks: number }[];
  maxViews: number;
}) {
  const width = 220;
  const height = 48;
  const barWidth = Math.max((width / data.length) - 3, 14);
  const chartHeight = height - 16;

  return (
    <div className="mt-1">
      <svg width={width} height={height} className="block">
        {data.map((d, i) => {
          const barH = Math.max((d.views / maxViews) * chartHeight, 2);
          const clickH =
            d.views > 0
              ? Math.max((d.clicks / d.views) * barH, 2)
              : 0;
          const x = i * (barWidth + 3) + 2;
          const y = chartHeight - barH + 2;

          const dayLabel = new Date(d.date).toLocaleDateString("ar-EG", {
            weekday: "narrow",
          });

          return (
            <g key={d.date}>
              {/* Views bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill="#4a62d6"
                rx={3}
                opacity={0.85}
              />
              {/* Clicks overlay */}
              {d.clicks > 0 && (
                <rect
                  x={x}
                  y={y + barH - clickH}
                  width={barWidth}
                  height={clickH}
                  fill="#22c55e"
                  rx={3}
                  opacity={0.9}
                />
              )}
              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={height - 2}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="8"
                fontFamily="system-ui"
              >
                {dayLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-3 mt-1 text-[9px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-primary inline-block" />
          مشاهدات
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-success inline-block" />
          ضغطات
        </span>
      </div>
    </div>
  );
}

// ============================================
// الصفحة الرئيسية
// ============================================

export default function AdminOffersPage() {
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [archivedOffers, setArchivedOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ إعدادات عنوان سكشن العروض في الصفحة الرئيسية
  const [sectionLabel, setSectionLabel] = useState("عروضنا");
  const [sectionTitle, setSectionTitle] = useState("عروضنا");
  const [sectionLabelSize, setSectionLabelSize] = useState(14);
  const [sectionTitleSize, setSectionTitleSize] = useState(32);
  const [savingSectionSettings, setSavingSectionSettings] = useState(false);

  // ============ فورم إضافة/تعديل العرض الحالي ============
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [badgeText, setBadgeText] = useState("عرض حالي");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── فيديو العرض: نفس آلية hero-video (رفع مؤقت → اختيار فريمين → اعتماد) ───
  const [videoUrl, setVideoUrl] = useState("");
  const [videoKey, setVideoKey] = useState("");
  const [posterUrlDesktop, setPosterUrlDesktop] = useState("");
  const [posterKeyDesktop, setPosterKeyDesktop] = useState("");
  const [posterUrlMobile, setPosterUrlMobile] = useState("");
  const [posterKeyMobile, setPosterKeyMobile] = useState("");
  const [uploadingVideoTemp, setUploadingVideoTemp] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [finalizingVideo, setFinalizingVideo] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<PendingVideo | null>(null);
  // ✅ فريمين منفصلين — واحد للابتوب وواحد للموبايل، كل واحد بيتقص حسب أبعاد عرضه الفعلية
  const [desktopFrame, setDesktopFrame] = useState(0);
  const [mobileFrame, setMobileFrame] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const desktopVideoPreviewRef = useRef<HTMLVideoElement>(null);
  const mobileVideoPreviewRef = useRef<HTMLVideoElement>(null);

  const [currentMobileHeight, setCurrentMobileHeight] = useState(256);
  const [currentDesktopHeight, setCurrentDesktopHeight] = useState(400);
  const [currentDesktopWidth, setCurrentDesktopWidth] = useState(50);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "desktop"
  );

  // ✅ مكان الشريط الأزرق (badge) — منفصل لكل جهاز
  const [badgePositionMobile, setBadgePositionMobile] =
    useState<BadgePosition>("middle-right");
  const [badgePositionDesktop, setBadgePositionDesktop] =
    useState<BadgePosition>("middle-right");
  const [badgeOrientationMobile, setBadgeOrientationMobile] =
    useState<BadgeOrientation>("vertical");
  const [badgeOrientationDesktop, setBadgeOrientationDesktop] =
    useState<BadgeOrientation>("vertical");
  const [badgeSizeMobile, setBadgeSizeMobile] = useState(100);
  const [badgeSizeDesktop, setBadgeSizeDesktop] = useState(100);

  const [endingOffer, setEndingOffer] = useState(false);
  const [deletingCurrentId, setDeletingCurrentId] = useState(false);

  // ============ فورم إضافة عرض مباشرة للأرشيف ============
  const [archTitle, setArchTitle] = useState("");
  const [archDescription, setArchDescription] = useState("");
  const [archDisplayDate, setArchDisplayDate] = useState("");
  const [archCardHeight, setArchCardHeight] = useState(224);
  const [archCardCols, setArchCardCols] = useState(3);
  const [archImageFile, setArchImageFile] = useState<File | null>(null);
  const [archImagePreview, setArchImagePreview] = useState<string | null>(null);
  const [savingArchive, setSavingArchive] = useState(false);

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubCurrent = subscribeToCurrentOffer((offer) => {
      setCurrentOffer(offer);
      setLoading(false);
    });
    const unsubArchived = subscribeToArchivedOffers(setArchivedOffers);
    return () => {
      unsubCurrent();
      unsubArchived();
    };
  }, []);

  // ✅ تحميل إعدادات عنوان سكشن العروض
  useEffect(() => {
    async function loadSectionSettings() {
      const settings = await getSettings();
      if (settings?.offersSectionLabel) setSectionLabel(settings.offersSectionLabel);
      if (settings?.offersSectionTitle) setSectionTitle(settings.offersSectionTitle);
      if (settings?.offersSectionLabelSize)
        setSectionLabelSize(settings.offersSectionLabelSize);
      if (settings?.offersSectionTitleSize)
        setSectionTitleSize(settings.offersSectionTitleSize);
    }
    loadSectionSettings();
  }, []);

  async function handleSaveSectionSettings() {
    setSavingSectionSettings(true);
    try {
      await updateSettings({
        offersSectionLabel: sectionLabel,
        offersSectionTitle: sectionTitle,
        offersSectionLabelSize: sectionLabelSize,
        offersSectionTitleSize: sectionTitleSize,
      });
      alert("✅ تم حفظ عنوان السكشن!");
    } catch (error) {
      console.error(error);
      alert("❌ حصل خطأ");
    } finally {
      setSavingSectionSettings(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setBadgeText("عرض حالي");
    setImageFile(null);
    setImagePreview(null);
    setVideoUrl("");
    setVideoKey("");
    setPosterUrlDesktop("");
    setPosterKeyDesktop("");
    setPosterUrlMobile("");
    setPosterKeyMobile("");
    setPendingVideo(null);
    setDesktopFrame(0);
    setMobileFrame(0);
    setUploadProgress(0);
    setCurrentMobileHeight(256);
    setCurrentDesktopHeight(400);
    setCurrentDesktopWidth(50);
    setBadgePositionMobile("middle-right");
    setBadgePositionDesktop("middle-right");
    setBadgeOrientationMobile("vertical");
    setBadgeOrientationDesktop("vertical");
    setBadgeSizeMobile(100);
    setBadgeSizeDesktop(100);
  }

  function resetArchiveForm() {
    setArchTitle("");
    setArchDescription("");
    setArchDisplayDate("");
    setArchCardHeight(224);
    setArchCardCols(3);
    setArchImageFile(null);
    setArchImagePreview(null);
  }

  function startEdit(offer: Offer) {
    setEditingId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description);
    setBadgeText(offer.badgeText || "عرض حالي");
    setImageFile(null);
    setImagePreview(null);
    setVideoUrl(offer.videoUrl || "");
    setVideoKey(offer.videoKey || "");
    setPosterUrlDesktop(offer.posterUrlDesktop || "");
    setPosterKeyDesktop(offer.posterKeyDesktop || "");
    setPosterUrlMobile(offer.posterUrlMobile || "");
    setPosterKeyMobile(offer.posterKeyMobile || "");
    setPendingVideo(null);
    setDesktopFrame(0);
    setMobileFrame(0);
    setUploadProgress(0);
    setCurrentMobileHeight(offer.currentMobileHeight || 256);
    setCurrentDesktopHeight(offer.currentDesktopHeight || 400);
    setCurrentDesktopWidth(offer.currentDesktopWidth || 50);
    setBadgePositionMobile(offer.badgePositionMobile || "middle-right");
    setBadgePositionDesktop(offer.badgePositionDesktop || "middle-right");
    setBadgeOrientationMobile(offer.badgeOrientationMobile || "vertical");
    setBadgeOrientationDesktop(offer.badgeOrientationDesktop || "vertical");
    setBadgeSizeMobile(offer.badgeSizeMobile || 100);
    setBadgeSizeDesktop(offer.badgeSizeDesktop || 100);
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  // ═══════════════════════════════════════════
  // 🎬 خطوة ١: رفع الفيديو مؤقتًا على Cloudinary — عن طريق XHR عشان نقدر نتابع نسبة الرفع %
  // ═══════════════════════════════════════════
  function uploadTempWithProgress(
    file: File,
    accountId: string,
    onProgress: (percent: number) => void
  ): Promise<{ videoUrl: string; publicId: string; duration: number; accountId: string }> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", accountId);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/offer-video/upload-temp");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("فشل قراءة رد السيرفر"));
          }
        } else {
          reject(new Error("فشل الرفع المؤقت"));
        }
      };

      xhr.onerror = () => reject(new Error("فشل الاتصال بالسيرفر"));
      xhr.send(formData);
    });
  }

  async function handleVideoFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideoTemp(true);
    setUploadProgress(0);
    try {
      const data = await uploadTempWithProgress(
        file,
        OFFER_VIDEO_ACCOUNT,
        setUploadProgress
      );

      setPendingVideo({
        videoUrl: data.videoUrl,
        publicId: data.publicId,
        duration: data.duration || 0,
        accountId: data.accountId,
        fileExt: getFileExt(file.name),
      });
      setDesktopFrame(0);
      setMobileFrame(0);
    } catch (error) {
      console.error(error);
      alert("فشل رفع الفيديو، حاول تاني");
    } finally {
      setUploadingVideoTemp(false);
      setUploadProgress(0);
    }
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  // ═══════════════════════════════════════════
  // 🎯 السلايدرات: تحريك كل معاينة لفريمها المختار — لكل جهاز لوحده
  // ═══════════════════════════════════════════
  function handleDesktopFrameChange(value: number) {
    setDesktopFrame(value);
    if (desktopVideoPreviewRef.current) {
      desktopVideoPreviewRef.current.currentTime = value;
    }
  }

  function handleMobileFrameChange(value: number) {
    setMobileFrame(value);
    if (mobileVideoPreviewRef.current) {
      mobileVideoPreviewRef.current.currentTime = value;
    }
  }

  // ═══════════════════════════════════════════
  // ✅ خطوة ٢: اعتماد الفريمين → نقل نهائي لـ R2 (فيديو + صورة غلاف اللابتوب + صورة غلاف الموبايل)
  // ═══════════════════════════════════════════
  async function handleConfirmVideoFrame() {
    if (!pendingVideo) return;
    setFinalizingVideo(true);
    try {
      const res = await fetch("/api/offer-video/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: pendingVideo.publicId,
          accountId: pendingVideo.accountId,
          videoUrl: pendingVideo.videoUrl,
          frameSecondDesktop: desktopFrame,
          frameSecondMobile: mobileFrame,
          folder: OFFER_VIDEO_FOLDER,
          fileExt: pendingVideo.fileExt,
        }),
      });

      if (!res.ok) throw new Error("فشل الاعتماد النهائي");
      const result = await res.json();

      // امسح الفيديو/الصور القديمة من R2 لو كانوا موجودين
      if (videoKey) await deleteFileFromR2(videoKey);
      if (posterKeyDesktop) await deleteFileFromR2(posterKeyDesktop);
      if (posterKeyMobile) await deleteFileFromR2(posterKeyMobile);

      setVideoUrl(result.url);
      setVideoKey(result.key);
      setPosterUrlDesktop(result.posterUrlDesktop);
      setPosterKeyDesktop(result.posterKeyDesktop);
      setPosterUrlMobile(result.posterUrlMobile);
      setPosterKeyMobile(result.posterKeyMobile);
      setPendingVideo(null);
    } catch (error) {
      console.error(error);
      alert("فشل اعتماد الفريمين، حاول تاني");
    } finally {
      setFinalizingVideo(false);
    }
  }

  function handleCancelPendingVideo() {
    setPendingVideo(null);
    setDesktopFrame(0);
    setMobileFrame(0);
  }

  function handleRemoveVideo() {
    // بيشيل الفيديو من الفورم بس (الحذف الفعلي من R2 بيحصل وقت الحفظ لو استبدلته،
    // أو تقدر تمسحه وتحفظ عرض بصورة بس)
    setVideoUrl("");
    setVideoKey("");
    setPosterUrlDesktop("");
    setPosterKeyDesktop("");
    setPosterUrlMobile("");
    setPosterKeyMobile("");
  }

  async function handleSaveOffer() {
    if (!title.trim()) {
      alert("اكتب عنوان العرض");
      return;
    }
    if (!editingId && !imageFile && !videoUrl) {
      alert("اختار صورة أو فيديو للعرض على الأقل");
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | undefined;
      let imageKey: string | undefined;

      if (imageFile) {
        const uploaded = await uploadFileToR2(
          imageFile,
          "عروض/العروض-الحالية"
        );
        imageUrl = uploaded.url;
        imageKey = uploaded.key;
      }

      if (editingId) {
        const updateData: Record<
          string,
          string | boolean | undefined | number
        > = {
          title: title.trim(),
          description: description.trim(),
          badgeText: badgeText.trim() || "عرض حالي",
          currentMobileHeight,
          currentDesktopHeight,
          currentDesktopWidth,
          badgePositionMobile,
          badgePositionDesktop,
          badgeOrientationMobile,
          badgeOrientationDesktop,
          badgeSizeMobile,
          badgeSizeDesktop,
          // ✅ الفيديو والفريمين كانوا خلاص اتعملهم finalize واتحفظوا على R2
          videoUrl: videoUrl || undefined,
          videoKey: videoKey || undefined,
          posterUrlDesktop: posterUrlDesktop || undefined,
          posterKeyDesktop: posterKeyDesktop || undefined,
          posterUrlMobile: posterUrlMobile || undefined,
          posterKeyMobile: posterKeyMobile || undefined,
        };
        if (imageUrl) updateData.imageUrl = imageUrl;
        if (imageKey) updateData.imageKey = imageKey;

        await updateOffer(editingId, updateData);
      } else {
        if (currentOffer) {
          await archiveOffer(currentOffer.id);
        }
        await addCurrentOffer({
          title: title.trim(),
          description: description.trim(),
          badgeText: badgeText.trim() || "عرض حالي",
          imageUrl,
          imageKey,
          videoUrl: videoUrl || undefined,
          videoKey: videoKey || undefined,
          posterUrlDesktop: posterUrlDesktop || undefined,
          posterKeyDesktop: posterKeyDesktop || undefined,
          posterUrlMobile: posterUrlMobile || undefined,
          posterKeyMobile: posterKeyMobile || undefined,
          currentMobileHeight,
          currentDesktopHeight,
          currentDesktopWidth,
          badgePositionMobile,
          badgePositionDesktop,
          badgeOrientationMobile,
          badgeOrientationDesktop,
          badgeSizeMobile,
          badgeSizeDesktop,
        });
      }

      resetForm();
    } catch (error) {
      console.error(error);
      alert("فشل حفظ العرض");
    } finally {
      setSaving(false);
    }
  }

  async function handleEndCurrentOffer() {
    if (!currentOffer) return;
    const confirmed = confirm(
      "متأكد إنك عايز تنقل العرض الحالي للأرشيف؟"
    );
    if (!confirmed) return;

    setEndingOffer(true);
    try {
      await archiveOffer(currentOffer.id);
    } catch (error) {
      console.error(error);
      alert("فشل نقل العرض للأرشيف");
    } finally {
      setEndingOffer(false);
    }
  }

  async function handleDeleteCurrentOffer() {
    if (!currentOffer) return;
    if (
      !confirmByTyping(
        `متأكد إنك عايز تمسح "${currentOffer.title}" نهائيًا؟ الحذف ده مالوش رجعة!`
      )
    ) {
      return;
    }

    setDeletingCurrentId(true);
    try {
      if (currentOffer.imageKey)
        await deleteFileFromR2(currentOffer.imageKey);
      if (currentOffer.videoKey)
        await deleteFileFromR2(currentOffer.videoKey);
      if (currentOffer.posterKeyDesktop)
        await deleteFileFromR2(currentOffer.posterKeyDesktop);
      if (currentOffer.posterKeyMobile)
        await deleteFileFromR2(currentOffer.posterKeyMobile);
      await deleteOffer(currentOffer.id);
    } catch (error) {
      console.error(error);
      alert("فشل حذف العرض");
    } finally {
      setDeletingCurrentId(false);
    }
  }

  async function handleAddArchivedOffer() {
    if (!archTitle.trim()) {
      alert("اكتب عنوان العرض");
      return;
    }
    if (!archImageFile) {
      alert("اختار صورة العرض");
      return;
    }

    setSavingArchive(true);
    try {
      const { url: imageUrl, key: imageKey } = await uploadFileToR2(
        archImageFile,
        "عروض/العروض-السابقة"
      );

      await addArchivedOffer({
        title: archTitle.trim(),
        description: archDescription.trim(),
        imageUrl,
        imageKey,
        displayDate: archDisplayDate.trim() || undefined,
        cardHeight: archCardHeight,
        cardCols: archCardCols,
      });

      resetArchiveForm();
    } catch (error) {
      console.error(error);
      alert("فشل إضافة العرض للأرشيف");
    } finally {
      setSavingArchive(false);
    }
  }

  function handleArchImageFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] || null;
    setArchImageFile(file);
    setArchImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleRestore(offer: Offer) {
    const confirmed = confirm(
      `متأكد إنك عايز ترجّع "${offer.title}" يبقى العرض الحالي؟ لو فيه عرض حالي دلوقتي هيتنقل هو للأرشيف بدله.`
    );
    if (!confirmed) return;

    setRestoringId(offer.id);
    try {
      if (currentOffer) {
        await archiveOffer(currentOffer.id);
      }
      await setOfferAsCurrent(offer.id);
    } catch (error) {
      console.error(error);
      alert("فشل استرجاع العرض");
    } finally {
      setRestoringId(null);
    }
  }

  async function handleDeleteArchived(offer: Offer) {
    if (
      !confirmByTyping(
        `متأكد إنك عايز تمسح "${offer.title}" نهائيًا؟`
      )
    ) {
      return;
    }

    setDeletingId(offer.id);
    try {
      if (offer.imageKey) await deleteFileFromR2(offer.imageKey);
      if (offer.videoKey) await deleteFileFromR2(offer.videoKey);
      if (offer.posterKeyDesktop) await deleteFileFromR2(offer.posterKeyDesktop);
      if (offer.posterKeyMobile) await deleteFileFromR2(offer.posterKeyMobile);
      await deleteOffer(offer.id);
    } catch (error) {
      console.error(error);
      alert("فشل حذف العرض");
    } finally {
      setDeletingId(null);
    }
  }

  const previewBadgePosition =
    previewDevice === "mobile" ? badgePositionMobile : badgePositionDesktop;
  const previewBadgeOrientation =
    previewDevice === "mobile"
      ? badgeOrientationMobile
      : badgeOrientationDesktop;
  const previewBadgeSize =
    previewDevice === "mobile" ? badgeSizeMobile : badgeSizeDesktop;
  const previewBadgeScale = previewBadgeSize / 100;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        إدارة العروض
      </h1>
      <p className="text-text-muted text-sm mb-8">
        العرض الجديد بيبقى «العرض الحالي»، والقديم بيتنقل تلقائي للأرشيف
        تحته
      </p>

      {/* ============ عنوان سكشن العروض في الصفحة الرئيسية ============ */}
      <div className="bg-surface-raised border border-border rounded-xl p-6 mb-10 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          🏷️ عنوان سكشن العروض
        </h2>

        <div>
          <label className="block text-text-secondary text-sm mb-1">
            النص الصغير (فوق العنوان)
          </label>
          <input
            type="text"
            value={sectionLabel}
            onChange={(e) => setSectionLabel(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
            placeholder="مثال: عروضنا"
          />
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-text-muted whitespace-nowrap">
              حجم الخط
            </span>
            <input
              type="range"
              min="10"
              max="24"
              step="1"
              value={sectionLabelSize}
              onChange={(e) => setSectionLabelSize(parseInt(e.target.value))}
              className="w-full accent-primary h-1"
            />
            <span className="text-xs text-text-muted w-10 text-left">
              {sectionLabelSize}px
            </span>
          </div>
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1">
            العنوان الرئيسي (جوه الشريط الأزرق)
          </label>
          <input
            type="text"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
            placeholder="مثال: عروضنا"
          />
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-text-muted whitespace-nowrap">
              حجم الخط
            </span>
            <input
              type="range"
              min="18"
              max="48"
              step="1"
              value={sectionTitleSize}
              onChange={(e) => setSectionTitleSize(parseInt(e.target.value))}
              className="w-full accent-primary h-1"
            />
            <span className="text-xs text-text-muted w-10 text-left">
              {sectionTitleSize}px
            </span>
          </div>
        </div>

        {/* بريفيو حي */}
        <div className="bg-surface rounded-lg border border-border p-6 text-center">
          <p
            className="text-primary font-semibold mb-3 tracking-wide"
            style={{ fontSize: sectionLabelSize }}
          >
            {sectionLabel || "عروضنا"}
          </p>
          <span
            className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full"
            style={{ fontSize: sectionTitleSize }}
          >
            {sectionTitle || "عروضنا"}
          </span>
        </div>

        <button
          onClick={handleSaveSectionSettings}
          disabled={savingSectionSettings}
          className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2 rounded-full font-medium transition-colors"
        >
          {savingSectionSettings ? "جاري الحفظ..." : "💾 حفظ عنوان السكشن"}
        </button>
      </div>

      {loading ? (
        <p className="text-text-muted">جاري التحميل...</p>
      ) : (
        <div className="space-y-10">
          {/* ============ العرض الحالي ============ */}
          <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              🎯 العرض الحالي
            </h2>

            {currentOffer && (
              <div className="p-3 bg-surface rounded-lg border border-border space-y-3">
                <div className="flex items-center gap-4">
                  {currentOffer.videoUrl ? (
                    <video
                      src={currentOffer.videoUrl}
                      poster={currentOffer.posterUrlDesktop || undefined}
                      className="w-20 h-20 object-cover rounded-lg"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentOffer.imageUrl}
                      alt={currentOffer.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {currentOffer.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      العرض الحالي دلوقتي
                    </p>

                    <div className="mt-2">
                      <input
                        type="text"
                        value={currentOffer.badgeText || "عرض حالي"}
                        onChange={(e) => {
                          const updated = {
                            ...currentOffer,
                            badgeText: e.target.value,
                          };
                          setCurrentOffer(updated);
                        }}
                        onBlur={async (e) => {
                          const newText =
                            e.target.value.trim() || "عرض حالي";
                          if (newText !== currentOffer.badgeText) {
                            try {
                              await updateOffer(currentOffer.id, {
                                badgeText: newText,
                              });
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        placeholder="نص الشريط الأزرق"
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 mt-1">
                      {(currentOffer.videoUrl ||
                        currentOffer.imageUrl) && (
                        <a
                          href={
                            currentOffer.videoUrl ||
                            currentOffer.imageUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline"
                        >
                          🔗 فتح الملف مباشرة
                        </a>
                      )}
                      {currentOffer.posterUrlDesktop && (
                        <a
                          href={currentOffer.posterUrlDesktop}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline"
                        >
                          🖥️ فتح صورة غلاف اللابتوب
                        </a>
                      )}
                      {currentOffer.posterUrlMobile && (
                        <a
                          href={currentOffer.posterUrlMobile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline"
                        >
                          📱 فتح صورة غلاف الموبايل
                        </a>
                      )}
                      {(currentOffer.videoKey ||
                        currentOffer.imageKey) && (
                        <a
                          href={getR2DashboardUrl(
                            currentOffer.videoKey ||
                              currentOffer.imageKey ||
                              ""
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-text-secondary hover:underline"
                        >
                          📍 فتح في Cloudflare Dashboard
                        </a>
                      )}
                    </div>

                    {/* ✅ إحصائيات العرض الحالي */}
                    <OfferStatsBadge stats={currentOffer.stats} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      currentOffer && startEdit(currentOffer)
                    }
                    className="text-primary border border-primary/30 hover:bg-primary/10 px-3 py-2 rounded-full text-xs font-medium transition-colors"
                  >
                    ✏️ تعديل
                  </button>
                  <button
                    onClick={handleEndCurrentOffer}
                    disabled={endingOffer}
                    className="text-text-secondary border border-border hover:bg-surface disabled:opacity-50 px-3 py-2 rounded-full text-xs font-medium transition-colors"
                  >
                    {endingOffer ? "جاري..." : "📦 نقل للأرشيف"}
                  </button>
                  <button
                    onClick={handleDeleteCurrentOffer}
                    disabled={deletingCurrentId}
                    className="text-error border border-error/30 hover:bg-error/10 disabled:opacity-50 px-3 py-2 rounded-full text-xs font-medium transition-colors"
                  >
                    {deletingCurrentId ? "جاري..." : "🗑️ حذف نهائي"}
                  </button>
                </div>
              </div>
            )}

            {!currentOffer && !editingId && (
              <p className="text-text-muted text-xs p-3 bg-surface rounded-lg border border-border">
                مفيش عرض حالي دلوقتي — الموقع مش هيعرض قسم «العرض الحالي»
                لحد ما تضيف واحد
              </p>
            )}

            <div className="pt-2 border-t border-border space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">
                {editingId ? "✏️ تعديل العرض" : "➕ إضافة عرض جديد"}
              </h3>

              <input
                type="text"
                placeholder="عنوان العرض (مثال: خصم 20% بمناسبة افتتاح مكتب الرياض)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
              />

              <textarea
                placeholder="وصف العرض (اختياري)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm resize-none"
              />

              {/* ✅ نص ومكان الشريط الأزرق (badge) */}
              <div className="border border-border rounded-lg p-4 space-y-4 bg-surface">
                <p className="text-xs font-semibold text-text-primary">
                  🏷️ الشريط الأزرق
                </p>

                <input
                  type="text"
                  placeholder="نص الشريط الأزرق (مثال: عرض حالي · خصم 20% · جديد)"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
                />

                <div className="space-y-1.5">
                  <p className="text-xs text-text-secondary">
                    📱 مكانه واتجاهه على الموبايل
                  </p>
                  <BadgePositionGrid
                    value={badgePositionMobile}
                    onChange={setBadgePositionMobile}
                  />
                  <OrientationToggle
                    value={badgeOrientationMobile}
                    onChange={setBadgeOrientationMobile}
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-text-muted whitespace-nowrap">
                      🔍 الحجم
                    </span>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="5"
                      value={badgeSizeMobile}
                      onChange={(e) =>
                        setBadgeSizeMobile(parseInt(e.target.value))
                      }
                      className="w-full accent-primary h-1"
                    />
                    <span className="text-[10px] text-text-muted w-10 text-left">
                      {badgeSizeMobile}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-text-secondary">
                    💻 مكانه واتجاهه على اللابتوب
                  </p>
                  <BadgePositionGrid
                    value={badgePositionDesktop}
                    onChange={setBadgePositionDesktop}
                  />
                  <OrientationToggle
                    value={badgeOrientationDesktop}
                    onChange={setBadgeOrientationDesktop}
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-text-muted whitespace-nowrap">
                      🔍 الحجم
                    </span>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="5"
                      value={badgeSizeDesktop}
                      onChange={(e) =>
                        setBadgeSizeDesktop(parseInt(e.target.value))
                      }
                      className="w-full accent-primary h-1"
                    />
                    <span className="text-[10px] text-text-muted w-10 text-left">
                      {badgeSizeDesktop}%
                    </span>
                  </div>
                </div>
              </div>

              {/* ✅ تحكم أبعاد العرض الحالي */}
              <div className="border border-border rounded-lg p-4 space-y-4 bg-surface">
                <p className="text-xs font-semibold text-text-primary">
                  📐 أبعاد العرض الحالي
                </p>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      📱 الطول على الموبايل
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {currentMobileHeight}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="900"
                    step="10"
                    value={currentMobileHeight}
                    onChange={(e) =>
                      setCurrentMobileHeight(parseInt(e.target.value))
                    }
                    className="w-full accent-primary h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      💻 الطول على اللابتوب
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {currentDesktopHeight}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="250"
                    max="900"
                    step="10"
                    value={currentDesktopHeight}
                    onChange={(e) =>
                      setCurrentDesktopHeight(parseInt(e.target.value))
                    }
                    className="w-full accent-primary h-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      💻 عرض عمود الوسائط على اللابتوب
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {currentDesktopWidth}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="70"
                    step="5"
                    value={currentDesktopWidth}
                    onChange={(e) =>
                      setCurrentDesktopWidth(parseInt(e.target.value))
                    }
                    className="w-full accent-primary h-1"
                  />
                </div>
              </div>

              {/* ✅ Preview حي — مطابق تمامًا لشكل الصفحة الرئيسية */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      previewDevice === "mobile"
                        ? "bg-primary text-white"
                        : "bg-surface border border-border text-text-secondary"
                    }`}
                  >
                    📱 معاينة موبايل
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      previewDevice === "desktop"
                        ? "bg-primary text-white"
                        : "bg-surface border border-border text-text-secondary"
                    }`}
                  >
                    💻 معاينة لابتوب
                  </button>
                </div>

                <div
                  className={`mx-auto rounded-2xl overflow-visible ${
                    previewDevice === "mobile" ? "max-w-[320px]" : "w-full"
                  }`}
                >
                  <div
                    className={`flex ${
                      previewDevice === "mobile"
                        ? "flex-col"
                        : "flex-row-reverse"
                    } gap-8 bg-surface-raised rounded-2xl shadow-sm border border-border overflow-hidden relative`}
                  >
                    {/* الشارة — قابلة للتحريك في أي مكان من الشبكة فوق */}
                    <div
                      className="absolute z-20 pointer-events-none"
                      style={getBadgePositionStyle(previewBadgePosition)}
                    >
                      <div
                        className={`bg-primary text-white font-bold shadow-[0_0_20px_rgba(74,98,214,0.5)] border-white/30 tracking-widest ${
                          previewBadgeOrientation === "horizontal"
                            ? "whitespace-nowrap"
                            : ""
                        } ${getBadgeShapeClasses(
                          previewBadgePosition,
                          previewBadgeOrientation
                        )}`}
                        style={{
                          fontSize: `${
                            (previewDevice === "desktop" ? 14 : 13) *
                            previewBadgeScale
                          }px`,
                          paddingBlock: `${
                            (previewBadgeOrientation === "horizontal"
                              ? 8
                              : 16) * previewBadgeScale
                          }px`,
                          paddingInline: `${
                            (previewBadgeOrientation === "horizontal"
                              ? 20
                              : 10) * previewBadgeScale
                          }px`,
                          ...(previewBadgeOrientation === "vertical"
                            ? {
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                              }
                            : {}),
                        }}
                      >
                        {badgeText || "عرض حالي"}
                      </div>
                    </div>

                    <div
                      className="relative bg-border flex-shrink-0"
                      style={
                        previewDevice === "mobile"
                          ? {
                              height: `${currentMobileHeight}px`,
                              width: "100%",
                            }
                          : {
                              height: `${currentDesktopHeight}px`,
                              width: `${currentDesktopWidth}%`,
                            }
                      }
                    >
                      {videoUrl ? (
                        <video
                          src={videoUrl}
                          poster={
                            (previewDevice === "mobile"
                              ? posterUrlMobile
                              : posterUrlDesktop) || undefined
                          }
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : imagePreview || currentOffer?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreview || currentOffer?.imageUrl}
                          alt="معاينة"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                          لسه مفيش صورة/فيديو
                        </div>
                      )}
                    </div>

                    <div
                      className="flex flex-col justify-center p-8"
                      style={
                        previewDevice === "mobile"
                          ? {
                              width: "100%",
                              minHeight: `${currentMobileHeight}px`,
                            }
                          : { width: `${100 - currentDesktopWidth}%` }
                      }
                    >
                      <span className="text-sm font-medium text-primary mb-2">
                        عرض حالي
                      </span>
                      <h3 className="text-2xl font-semibold text-text-primary mb-3">
                        {title || "عنوان العرض"}
                      </h3>
                      <p className="text-text-secondary leading-relaxed mb-6 line-clamp-3">
                        {description || "وصف العرض هيظهر هنا"}
                      </p>
                      <button
                        type="button"
                        tabIndex={-1}
                        className="self-start bg-primary text-white px-6 py-3 rounded-full font-medium pointer-events-none"
                      >
                        استفد من العرض
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted">
                  ⚠️ لو الشريط الأزرق اتحط في مكان بيغطي على العنوان أو
                  الوصف، جرّب مكان تاني من الشبكة فوق لو مش عاجبك الشكل
                </p>
              </div>

              <div>
                <label className="block text-text-secondary text-xs mb-1">
                  📷 صورة{" "}
                  {editingId
                    ? "(اختياري - اتركه فاضي لو مش عايز تغيّر)"
                    : ""}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-text-secondary text-sm"
                />
              </div>

              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="معاينة"
                  className="w-full max-w-[200px] rounded-lg border border-primary aspect-square object-cover"
                />
              )}

              {/* ═══════════════ 🎬 فيديو العرض — رفع مؤقت + اختيار فريمين (لابتوب وموبايل) ═══════════════ */}
              <div className="border border-border rounded-lg p-4 space-y-3 bg-surface">
                <p className="text-xs font-semibold text-text-primary">
                  🎬 فيديو العرض{" "}
                  {editingId ? "(اختياري - اتركه زي ما هو لو مش عايز تغيّر)" : "(اختياري بدل الصورة أو معاها)"}
                </p>
                <p className="text-[10px] text-text-muted">
                  بيترفع مؤقتًا على Cloudinary الأول، وتقدر تختار فريم غلاف
                  منفصل لكل جهاز (لأن القص بيختلف حسب أبعاد العرض اللي
                  حددتها فوق)، وبعد الاعتماد بينقل الفيديو والصورتين لـ R2
                  نهائيًا.
                </p>

                {/* ─── وضع اختيار الفريمين (فيديو مؤقت جديد) ─── */}
                {pendingVideo ? (
                  <div className="space-y-4 border border-primary/40 rounded-lg p-3 bg-primary/5">
                    {/* 🖥️ فريم اللابتوب */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-primary">
                        🖥️ اختر فريم غلاف اللابتوب
                      </p>
                      <div
                        className="rounded-lg overflow-hidden border border-border bg-black mx-auto"
                        style={{
                          aspectRatio: `${currentDesktopWidth || 50} / 30`,
                          maxWidth: "100%",
                        }}
                      >
                        <video
                          ref={desktopVideoPreviewRef}
                          src={pendingVideo.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="auto"
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(pendingVideo.duration - 0.1, 0.1)}
                        step={0.1}
                        value={desktopFrame}
                        onChange={(e) =>
                          handleDesktopFrameChange(parseFloat(e.target.value))
                        }
                        className="w-full cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>0:00</span>
                        <span>{desktopFrame.toFixed(1)}s</span>
                        <span>{pendingVideo.duration.toFixed(1)}s</span>
                      </div>
                    </div>

                    {/* 📱 فريم الموبايل */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-medium text-primary">
                        📱 اختر فريم غلاف الموبايل
                      </p>
                      <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video max-w-sm mx-auto">
                        <video
                          ref={mobileVideoPreviewRef}
                          src={pendingVideo.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="auto"
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(pendingVideo.duration - 0.1, 0.1)}
                        step={0.1}
                        value={mobileFrame}
                        onChange={(e) =>
                          handleMobileFrameChange(parseFloat(e.target.value))
                        }
                        className="w-full cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>0:00</span>
                        <span>{mobileFrame.toFixed(1)}s</span>
                        <span>{pendingVideo.duration.toFixed(1)}s</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmVideoFrame}
                        disabled={finalizingVideo}
                        className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2 rounded-full text-sm font-bold transition-colors"
                      >
                        {finalizingVideo
                          ? "⏳ جاري الاعتماد..."
                          : "✅ اعتماد الفريمين"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPendingVideo}
                        disabled={finalizingVideo}
                        className="px-4 border border-border rounded-full text-sm text-text-secondary hover:bg-surface disabled:opacity-50 transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {videoUrl && (
                      <div className="space-y-2">
                        <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
                          <video
                            src={videoUrl}
                            poster={posterUrlDesktop || undefined}
                            className="w-full h-full object-cover"
                            controls
                            muted
                          />
                        </div>

                        {/* ═══ اللينكات النهائية على R2 — نفس شكل صفحة الهيرو، لكل جهاز لوحده ═══ */}
                        <div className="space-y-2 bg-surface-raised rounded-lg p-3 border border-border">
                          <LinkField label="🔗 لينك الفيديو (R2)" url={videoUrl} />
                          <LinkField label="🖥️ لينك صورة غلاف اللابتوب (R2)" url={posterUrlDesktop} />
                          <LinkField label="📱 لينك صورة غلاف الموبايل (R2)" url={posterUrlMobile} />
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="w-full text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-full py-1.5 text-xs font-medium transition-colors"
                        >
                          🗑️ شيل الفيديو من الفورم
                        </button>
                      </div>
                    )}

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileSelect}
                      disabled={uploadingVideoTemp}
                      className="block w-full text-sm text-text-secondary file:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer cursor-pointer"
                    />

                    {/* ✅ شريط تقدم الرفع المؤقت — نسبة % حية */}
                    {uploadingVideoTemp && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-primary">
                          <span>⏳ جاري الرفع المؤقت على Cloudinary...</span>
                          <span className="font-bold">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-200 ease-out rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {false && (
                      <p className="text-xs text-primary">
                        ⏳ جاري الرفع المؤقت على Cloudinary...
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveOffer}
                  disabled={saving || !title.trim() || !!pendingVideo}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
                >
                  {saving
                    ? "جاري الحفظ..."
                    : editingId
                    ? "حفظ التعديلات"
                    : "حفظ كعرض حالي"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 rounded-full text-sm border border-border text-text-secondary hover:bg-surface transition-colors"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ============ الأرشيف ============ */}
          <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              🗄️ العروض السابقة (الأرشيف)
            </h2>

            {archivedOffers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedOffers.map((offer) => (
                  <div key={offer.id} className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="w-full object-cover rounded-lg border border-border"
                      style={{ height: `${offer.cardHeight || 224}px` }}
                    />
                    <p className="text-xs text-text-secondary truncate">
                      {offer.title}
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={offer.showDate !== false}
                        onChange={async (e) => {
                          try {
                            await updateOffer(offer.id, {
                              showDate: e.target.checked,
                            });
                            const updated = {
                              ...offer,
                              showDate: e.target.checked,
                            };
                            setArchivedOffers((prev) =>
                              prev.map((o) =>
                                o.id === offer.id ? updated : o
                              )
                            );
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="accent-primary w-3 h-3"
                      />
                      <span className="text-[10px] text-text-muted">
                        عرض التاريخ
                      </span>
                    </div>

                    <input
                      type="text"
                      value={offer.displayDate || ""}
                      onChange={(e) => {
                        const updated = {
                          ...offer,
                          displayDate: e.target.value,
                        };
                        setArchivedOffers((prev) =>
                          prev.map((o) =>
                            o.id === offer.id ? updated : o
                          )
                        );
                      }}
                      onBlur={async (e) => {
                        try {
                          await updateOffer(offer.id, {
                            displayDate:
                              e.target.value.trim() || undefined,
                          });
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      placeholder="تاريخ العرض (مثال: ٨ يوليو ٢٠٢٦)"
                      className="w-full px-2 py-1 rounded border border-border bg-surface text-text-primary text-[10px]"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted">
                        الطول:
                      </span>
                      <input
                        type="range"
                        min="120"
                        max="400"
                        step="10"
                        value={offer.cardHeight || 224}
                        onChange={(e) => {
                          const height = parseInt(e.target.value);
                          const updated = {
                            ...offer,
                            cardHeight: height,
                          };
                          setArchivedOffers((prev) =>
                            prev.map((o) =>
                              o.id === offer.id ? updated : o
                            )
                          );
                        }}
                        onBlur={async (e) => {
                          try {
                            await updateOffer(offer.id, {
                              cardHeight: parseInt(e.target.value),
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="w-full accent-primary h-1"
                      />
                      <span className="text-[10px] text-text-muted w-8">
                        {offer.cardHeight || 224}px
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted">
                        العرض:
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((cols) => (
                          <button
                            key={cols}
                            onClick={async () => {
                              try {
                                await updateOffer(offer.id, {
                                  cardCols: cols,
                                });
                                const updated = {
                                  ...offer,
                                  cardCols: cols,
                                };
                                setArchivedOffers((prev) =>
                                  prev.map((o) =>
                                    o.id === offer.id ? updated : o
                                  )
                                );
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              (offer.cardCols || 3) === cols
                                ? "bg-primary text-white"
                                : "bg-surface border border-border text-text-secondary hover:bg-border"
                            }`}
                          >
                            {cols === 1
                              ? "عمود"
                              : cols === 2
                              ? "عمودين"
                              : "3"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      {(offer.videoUrl || offer.imageUrl) && (
                        <a
                          href={offer.videoUrl || offer.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline truncate"
                        >
                          🔗 فتح الملف
                        </a>
                      )}
                      {(offer.videoKey || offer.imageKey) && (
                        <a
                          href={getR2DashboardUrl(
                            offer.videoKey || offer.imageKey || ""
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-text-secondary hover:underline truncate"
                        >
                          📍 Cloudflare
                        </a>
                      )}
                    </div>

                    {/* ✅ إحصائيات العرض في الأرشيف */}
                    <OfferStatsBadge stats={offer.stats} />

                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => startEdit(offer)}
                        className="text-primary border border-primary/30 hover:bg-primary/10 px-1 py-1 rounded-full text-[10px] font-medium transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleRestore(offer)}
                        disabled={restoringId === offer.id}
                        className="text-success border border-success/30 hover:bg-success/10 disabled:opacity-50 px-1 py-1 rounded-full text-[10px] font-medium transition-colors"
                      >
                        {restoringId === offer.id ? "..." : "🔄"}
                      </button>
                      <button
                        onClick={() => handleDeleteArchived(offer)}
                        disabled={deletingId === offer.id}
                        className="text-error border border-error/30 hover:bg-error/10 disabled:opacity-50 px-1 py-1 rounded-full text-[10px] font-medium transition-colors"
                      >
                        {deletingId === offer.id ? "..." : "🗑️"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-xs">
                مفيش عروض سابقة في الأرشيف
              </p>
            )}

            {/* ============ إضافة عرض مباشرة للأرشيف ============ */}
            <div className="pt-4 border-t border-border space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">
                ➕ إضافة عرض قديم مباشرة للأرشيف
              </h3>
              <p className="text-xs text-text-muted">
                مفيدة لو عايز تسجّل عرض قديم كان قبل ما تبدأ تستخدم النظام
                ده، من غير ما يمر بـ«العرض الحالي»
              </p>

              <input
                type="text"
                placeholder="عنوان العرض"
                value={archTitle}
                onChange={(e) => setArchTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
              />

              <textarea
                placeholder="وصف العرض (اختياري)"
                value={archDescription}
                onChange={(e) => setArchDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm resize-none"
              />

              <input
                type="text"
                placeholder="تاريخ العرض (مثال: ٨ يوليو ٢٠٢٦) — اختياري"
                value={archDisplayDate}
                onChange={(e) => setArchDisplayDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
              />

              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">الطول:</span>
                <input
                  type="range"
                  min="120"
                  max="400"
                  step="10"
                  value={archCardHeight}
                  onChange={(e) =>
                    setArchCardHeight(parseInt(e.target.value))
                  }
                  className="flex-1 accent-primary h-1"
                />
                <span className="text-xs text-text-muted w-10">
                  {archCardHeight}px
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">العرض:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => setArchCardCols(cols)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        archCardCols === cols
                          ? "bg-primary text-white"
                          : "bg-surface border border-border text-text-secondary hover:bg-border"
                      }`}
                    >
                      {cols === 1
                        ? "عمود"
                        : cols === 2
                        ? "عمودين"
                        : "3 أعمدة"}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleArchImageFileChange}
                className="w-full text-text-secondary text-sm"
              />

              {archImagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={archImagePreview}
                  alt="معاينة"
                  className="w-full max-w-[150px] rounded-lg border border-primary aspect-square object-cover"
                />
              )}

              <button
                onClick={handleAddArchivedOffer}
                disabled={
                  savingArchive || !archTitle.trim() || !archImageFile
                }
                className="w-full bg-surface hover:bg-border disabled:opacity-50 text-text-primary border border-border px-6 py-2 rounded-full text-sm font-medium transition-colors"
              >
                {savingArchive
                  ? "جاري الإضافة..."
                  : "إضافة للأرشيف مباشرة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}