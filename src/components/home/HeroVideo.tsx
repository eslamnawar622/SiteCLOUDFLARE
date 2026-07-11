"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeToSettings, SettingsData } from "@/lib/firestore/settings";

interface HeroVideoProps {
  initialData?: SettingsData | null;
}

export default function HeroVideo({ initialData }: HeroVideoProps) {
  const [settings, setSettings] = useState<SettingsData | null>(initialData ?? null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      setSettings(data);
    });
    return () => unsubscribe();
  }, []);

  const desktopUrl = settings?.heroDesktopVideoUrl || "";
  const mobileUrl = settings?.heroMobileVideoUrl || "";
  const desktopPoster = settings?.heroDesktopPosterUrl || "";
  const mobilePoster = settings?.heroMobilePosterUrl || "";

  const title = settings?.heroTitle || "";
  const subtitle = settings?.heroSubtitle || "";
  const description = settings?.heroDescription || "";
  const buttons = settings?.heroButtons || [];
  const offerBadgeText = settings?.heroOfferBadgeText || "";

  if (!settings) {
    return (
      <section
        className="relative w-full overflow-hidden bg-primary-darker flex items-center justify-center"
        style={{ height: "100dvh" }}
      >
        <div className="animate-pulse text-white/50">جاري التحميل...</div>
      </section>
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-primary-darker"
      style={{ height: "100dvh" }}
    >
      {/* فيديو لابتوب */}
      {desktopUrl && (
        <video
          key={`desktop-${desktopUrl}`}
          className="hidden md:block absolute inset-0 w-full h-full object-cover"
          src={desktopUrl}
          poster={desktopPoster || undefined}
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="metadata"
        />
      )}

      {/* فيديو موبايل */}
      {mobileUrl && (
        <video
          key={`mobile-${mobileUrl}`}
          className="md:hidden absolute inset-0 w-full h-full object-cover"
          src={mobileUrl}
          poster={mobilePoster || undefined}
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="metadata"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-primary-darker/90 via-primary-darker/30 to-primary-darker/60 pointer-events-none" />

      {/* شريط "عرض حالي" */}
      {offerBadgeText && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div
            className="bg-primary text-white text-xs md:text-sm font-bold py-4 px-2.5 rounded-l-xl shadow-[0_0_20px_rgba(74,98,214,0.5)] border-l-4 border-white/30 tracking-widest"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {offerBadgeText}
          </div>
        </div>
      )}

      {/* المحتوى النصي */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <div className="pointer-events-auto">
          {title && (
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-lg md:text-2xl text-white/90 mb-2 drop-shadow-md max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="text-base md:text-lg text-white/70 mb-8 max-w-xl mx-auto">
              {description}
            </p>
          )}

          {buttons.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {buttons.map((button) =>
                button.style === "primary" ? (
                  <Link
                    key={button.id}
                    href={button.link}
                    className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
                  >
                    {button.text}
                  </Link>
                ) : (
                  <Link
                    key={button.id}
                    href={button.link}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105"
                  >
                    {button.text}
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* زرار الصوت */}
      {(desktopUrl || mobileUrl) && (
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute bottom-24 left-8 z-20 flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-4 py-3 rounded-full transition-all duration-300 hover:scale-105 border border-white/30 shadow-lg"
          aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
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
      )}

      {/* سهم التمرير */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-auto">
        <Link href="#offers" className="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors">
          <span className="text-xs font-medium">اكتشف المزيد</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}