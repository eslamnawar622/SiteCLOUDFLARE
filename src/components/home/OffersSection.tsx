"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  getCurrentOffer,
  getArchivedOffers,
  trackOfferView,
  trackOfferClick,
} from "@/lib/firestore/offers";
import { getSettings, subscribeToSettings } from "@/lib/firestore/settings";
import { Offer, BadgePosition, BadgeOrientation } from "@/types/offer";

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => {
      if (typeof window !== "undefined") {
        return window.matchMedia(query).matches;
      }
      return false;
    },
    () => false
  );
}

// ============================================
// 🏷️ مكان الشريط الأزرق (badge) — شبكة 3×3
// الافتراضي "middle-right" هو نفس المكان القديم الثابت
// ============================================
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
    return "rounded-xl border-2"; // نص الكارت (عايم) — بوردر خفيف حواليه كله
  }
  const isLeftSide = pos.endsWith("left");
  return isLeftSide ? "rounded-r-xl border-r-4" : "rounded-l-xl border-l-4";
}

export default function OffersSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [archivedOffers, setArchivedOffers] = useState<Offer[]>([]);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const trackedRef = useRef<Set<string>>(new Set());

  const [whatsappNumber, setWhatsappNumber] = useState("201234567890");
  const [whatsappMessage, setWhatsappMessage] = useState(
    "مرحباً Axis Design Studio 👋\n\nأنا مهتم بالعرض: *{title}*\n\nممكن التفاصيل؟"
  );

  // ✅ هيدر السكشن الديناميكي
  const [sectionLabel, setSectionLabel] = useState("عروضنا");
  const [sectionTitle, setSectionTitle] = useState("عروضنا");
  const [sectionLabelSize, setSectionLabelSize] = useState(14);
  const [sectionTitleSize, setSectionTitleSize] = useState(32);
  // ⛔ منع عرض القيم الافتراضية قبل ما توصل الإعدادات الحقيقية من فايرستور
  const [headerReady, setHeaderReady] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [current, archived] = await Promise.all([
        getCurrentOffer(),
        getArchivedOffers(),
      ]);
      setCurrentOffer(current);
      setArchivedOffers(archived);
      setLoading(false);
    }
    loadData();

    async function loadSettings() {
      const settings = await getSettings();
      if (settings?.whatsappNumber) setWhatsappNumber(settings.whatsappNumber);
      if (settings?.whatsappMessage) setWhatsappMessage(settings.whatsappMessage);
      if (settings?.offersSectionLabel) setSectionLabel(settings.offersSectionLabel);
      if (settings?.offersSectionTitle) setSectionTitle(settings.offersSectionTitle);
      if (settings?.offersSectionLabelSize)
        setSectionLabelSize(settings.offersSectionLabelSize);
      if (settings?.offersSectionTitleSize)
        setSectionTitleSize(settings.offersSectionTitleSize);
      setHeaderReady(true);
    }
    loadSettings();

    const unsub = subscribeToSettings((data) => {
      if (data?.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
      if (data?.whatsappMessage) setWhatsappMessage(data.whatsappMessage);
      if (data?.offersSectionLabel) setSectionLabel(data.offersSectionLabel);
      if (data?.offersSectionTitle) setSectionTitle(data.offersSectionTitle);
      if (data?.offersSectionLabelSize)
        setSectionLabelSize(data.offersSectionLabelSize);
      if (data?.offersSectionTitleSize)
        setSectionTitleSize(data.offersSectionTitleSize);
      setHeaderReady(true);
    });
    return () => unsub();
  }, []);

  // ✅ Track view once per offer
  useEffect(() => {
    if (currentOffer?.id && !trackedRef.current.has(currentOffer.id)) {
      trackedRef.current.add(currentOffer.id);
      trackOfferView(currentOffer.id, isDesktop).catch(console.error);
    }
  }, [currentOffer?.id, isDesktop]);

  function handleToggleSound() {
    const video = videoRef.current;
    if (!video) return;
    if (muted) {
      video.currentTime = 0;
      video.muted = false;
      video.play();
      setMuted(false);
    } else {
      video.muted = true;
      setMuted(true);
    }
  }

  function handleUseOffer() {
    if (!currentOffer) return;
    trackOfferClick(currentOffer.id, isDesktop).catch(console.error);
    const message = whatsappMessage.replace("{title}", currentOffer.title);
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  if (loading) return null;

  const gridCols = archivedOffers[0]?.cardCols || 3;
  const getGridColsClass = () => {
    switch (gridCols) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  };

  const mobileHeight = currentOffer?.currentMobileHeight || 256;
  const desktopHeight = currentOffer?.currentDesktopHeight || 400;
  const desktopWidth = currentOffer?.currentDesktopWidth || 50;

  const mediaStyle: React.CSSProperties = isDesktop
    ? { height: `${desktopHeight}px`, width: `${desktopWidth}%` }
    : { height: `${mobileHeight}px`, width: "100%" };

  const textStyle: React.CSSProperties = isDesktop
    ? { width: `${100 - desktopWidth}%` }
    : { width: "100%" };

  // ✅ مكان واتجاه الشريط الأزرق (badge) حسب الجهاز
  const badgePosition: BadgePosition = isDesktop
    ? currentOffer?.badgePositionDesktop || "middle-right"
    : currentOffer?.badgePositionMobile || "middle-right";
  const badgeOrientation: BadgeOrientation = isDesktop
    ? currentOffer?.badgeOrientationDesktop || "vertical"
    : currentOffer?.badgeOrientationMobile || "vertical";
  // نسبة حجم الشريط % — 100 هو الحجم الطبيعي
  const badgeSize = isDesktop
    ? currentOffer?.badgeSizeDesktop || 100
    : currentOffer?.badgeSizeMobile || 100;
  const badgeScale = badgeSize / 100;

  return (
    <section id="offers" className="bg-surface py-16 px-6 md:px-12 relative">
      <div className="max-w-6xl mx-auto">
        <div
          className="text-center mb-10"
          style={{ visibility: headerReady ? "visible" : "hidden" }}
        >
          <p
            className="text-primary font-semibold mb-3 tracking-wide"
            style={{ fontSize: sectionLabelSize }}
          >
            {sectionLabel}
          </p>
          <span
            className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full"
            style={{ fontSize: sectionTitleSize }}
          >
            {sectionTitle}
          </span>
        </div>

        {/* العرض الحالي */}
        {currentOffer ? (
          <div className="flex flex-col md:flex-row-reverse gap-8 bg-surface-raised rounded-2xl shadow-sm border border-border overflow-hidden mb-12 relative">
            <div
              className="absolute z-20 pointer-events-none"
              style={getBadgePositionStyle(badgePosition)}
            >
              <div
                className={`bg-primary text-white font-bold shadow-[0_0_20px_rgba(74,98,214,0.5)] border-white/30 tracking-widest ${
                  badgeOrientation === "horizontal" ? "whitespace-nowrap" : ""
                } ${getBadgeShapeClasses(badgePosition, badgeOrientation)}`}
                style={{
                  fontSize: `${(isDesktop ? 14 : 13) * badgeScale}px`,
                  paddingBlock: `${
                    (badgeOrientation === "horizontal" ? 8 : 16) * badgeScale
                  }px`,
                  paddingInline: `${
                    (badgeOrientation === "horizontal" ? 20 : 10) * badgeScale
                  }px`,
                  ...(badgeOrientation === "vertical"
                    ? { writingMode: "vertical-rl", textOrientation: "mixed" }
                    : {}),
                }}
              >
                {currentOffer.badgeText || "عرض حالي"}
              </div>
            </div>

            <div className="relative flex-shrink-0" style={mediaStyle}>
              {currentOffer.videoUrl ? (
                <>
                  {/* ✅ poster = صورة الفريم المستخرج من الفيديو، بتظهر فورًا قبل ما الفيديو يحمّل — زي الهيرو بالظبط */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    src={currentOffer.videoUrl}
                    poster={currentOffer.posterUrl || currentOffer.imageUrl}
                    autoPlay
                    muted={muted}
                    loop
                    playsInline
                  />
                  <button
                    onClick={handleToggleSound}
                    className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-4 py-3 rounded-full transition-all duration-300 hover:scale-105 border border-white/20 shadow-lg"
                    aria-label={muted ? "تفعيل الصوت" : "كتم الصوت"}
                  >
                    {muted ? (
                      <>
                        <svg
                          className="w-6 h-6 md:w-7 md:h-7"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                        <span className="text-sm font-medium hidden md:inline">
                          تشغيل الصوت
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-6 h-6 md:w-7 md:h-7"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        <span className="text-sm font-medium hidden md:inline">
                          كتم الصوت
                        </span>
                      </>
                    )}
                  </button>
                </>
              ) : currentOffer.imageUrl ? (
                <Image
                  src={currentOffer.imageUrl}
                  alt={currentOffer.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : null}
            </div>

            <div
              className="flex flex-col justify-center p-8"
              style={textStyle}
            >
              <span className="text-sm font-medium text-primary mb-2">
                عرض حالي
              </span>
              <h3 className="text-2xl font-semibold text-text-primary mb-3">
                {currentOffer.title}
              </h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                {currentOffer.description}
              </p>
              <button
                onClick={handleUseOffer}
                className="self-start bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                استفد من العرض
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row-reverse gap-8 bg-surface-raised rounded-2xl shadow-sm border border-border overflow-hidden mb-12">
            <div className="relative w-full md:w-1/2 h-64 md:h-auto">
              <Image
                src="/images/offices/placeholder.webp"
                alt="لا يوجد عرض حالي"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="md:w-1/2 flex flex-col justify-center p-8">
              <span className="text-sm font-medium text-text-muted mb-2">
                لا يوجد عرض حالي
              </span>
              <h3 className="text-2xl font-semibold text-text-primary mb-3">
                ترقّبوا عروضنا القادمة
              </h3>
              <p className="text-text-secondary leading-relaxed">
                نعمل دائمًا على تجهيز عروض جديدة، تابعونا لمعرفة كل جديد.
              </p>
            </div>
          </div>
        )}

        {/* أرشيف العروض */}
        {archivedOffers.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-6">
              عروض سابقة
            </h3>
            <div className={`grid ${getGridColsClass()} gap-6`}>
              {archivedOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-surface-raised rounded-xl border border-border overflow-hidden"
                >
                  <div
                    className="relative w-full"
                    style={{ height: `${offer.cardHeight || 224}px` }}
                  >
                    {offer.imageUrl && (
                      <Image
                        src={offer.imageUrl}
                        alt={offer.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-semibold text-text-primary mb-1">
                      {offer.title}
                    </h4>
                    <p className="text-sm text-text-secondary mb-3">
                      {offer.description}
                    </p>
                    {offer.showDate !== false && (
                      <span className="text-xs text-text-muted">
                        {offer.displayDate ||
                          offer.startDate.toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}