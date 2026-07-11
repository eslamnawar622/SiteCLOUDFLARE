"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { getCurrentOffer, getArchivedOffers } from "@/lib/firestore/offers";
import { getSettings, subscribeToSettings } from "@/lib/firestore/settings";
import { Offer } from "@/types/offer";

export default function OffersSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [archivedOffers, setArchivedOffers] = useState<Offer[]>([]);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);

  const [whatsappNumber, setWhatsappNumber] = useState("201234567890");
  const [whatsappMessage, setWhatsappMessage] = useState("مرحباً Axis Design Studio 👋\n\nأنا مهتم بالعرض: *{title}*\n\nممكن التفاصيل؟");

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
    }
    loadSettings();

    const unsub = subscribeToSettings((data) => {
      if (data?.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
      if (data?.whatsappMessage) setWhatsappMessage(data.whatsappMessage);
    });
    return () => unsub();
  }, []);

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
    const message = whatsappMessage.replace("{title}", currentOffer.title);
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  if (loading) return null;

  // ✅ تحديد عدد الأعمدة من أول عرض (أو default 3)
  const gridCols = archivedOffers[0]?.cardCols || 3;

  // ✅ تحديد classes الأعمدة بناءً على القيمة
  const getGridColsClass = () => {
    switch (gridCols) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 sm:grid-cols-2";
      case 3: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      default: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  };

  return (
    <section id="offers" className="bg-surface py-16 px-6 md:px-12 relative">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold text-text-primary mb-10">
          عروضنا
        </h2>

        {/* العرض الحالي */}
        {currentOffer ? (
          <div className="flex flex-col md:flex-row-reverse gap-8 bg-surface-raised rounded-2xl shadow-sm border border-border overflow-hidden mb-12 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div
                className="bg-primary text-white text-xs md:text-sm font-bold py-4 px-2.5 rounded-l-xl shadow-[0_0_20px_rgba(74,98,214,0.5)] border-l-4 border-white/30 tracking-widest"
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              >
                {currentOffer.badgeText || "عرض حالي"}
              </div>
            </div>

            <div className="md:w-1/2 relative">
              {currentOffer.videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-64 md:h-full object-cover"
                    src={currentOffer.videoUrl}
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
                        <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                        <span className="text-sm font-medium hidden md:inline">تشغيل الصوت</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        <span className="text-sm font-medium hidden md:inline">كتم الصوت</span>
                      </>
                    )}
                  </button>
                </>
              ) : currentOffer.imageUrl ? (
                <Image src={currentOffer.imageUrl} alt={currentOffer.title} fill className="object-cover" />
              ) : null}
            </div>

            <div className="md:w-1/2 flex flex-col justify-center p-8">
              <span className="text-sm font-medium text-primary mb-2">عرض حالي</span>
              <h3 className="text-2xl font-semibold text-text-primary mb-3">{currentOffer.title}</h3>
              <p className="text-text-secondary leading-relaxed mb-6">{currentOffer.description}</p>
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
              <Image src="/images/offices/placeholder.webp" alt="لا يوجد عرض حالي" fill className="object-cover" />
            </div>
            <div className="md:w-1/2 flex flex-col justify-center p-8">
              <span className="text-sm font-medium text-text-muted mb-2">لا يوجد عرض حالي</span>
              <h3 className="text-2xl font-semibold text-text-primary mb-3">ترقّبوا عروضنا القادمة</h3>
              <p className="text-text-secondary leading-relaxed">نعمل دائمًا على تجهيز عروض جديدة، تابعونا لمعرفة كل جديد.</p>
            </div>
          </div>
        )}

        {/* أرشيف العروض - المعدل بالكامل */}
        {archivedOffers.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-6">عروض سابقة</h3>

            {/* ✅ grid ديناميكي حسب cardCols */}
            <div className={`grid ${getGridColsClass()} gap-6`}>
              {archivedOffers.map((offer) => (
                <div key={offer.id} className="bg-surface-raised rounded-xl border border-border overflow-hidden">

                  {/* ✅ ارتفاع ديناميكي حسب cardHeight */}
                  <div 
                    className="relative w-full"
                    style={{ height: `${offer.cardHeight || 224}px` }}
                  >
                    {offer.imageUrl && (
                      <Image 
                        src={offer.imageUrl} 
                        alt={offer.title} 
                        fill 
                        className="object-cover" 
                      />
                    )}
                  </div>

                  <div className="p-5">
                    <h4 className="font-semibold text-text-primary mb-1">{offer.title}</h4>
                    <p className="text-sm text-text-secondary mb-3">{offer.description}</p>

                    {/* ✅ التاريخ بقى اختياري */}
                    {offer.showDate !== false && (
                      <span className="text-xs text-text-muted">
                        {offer.displayDate || offer.startDate.toLocaleDateString("ar-EG", {
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