"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeToHeroVideo, HeroVideoData } from "@/lib/firestore/heroVideo";
import { subscribeToHeroText, HeroButton } from "@/lib/firestore/heroText";
import { getPosterFromFrame } from "@/lib/cloudinaryUpload";

const FALLBACK_TITLE = "Axis Design Studio";
const FALLBACK_SUBTITLE = "نحول رؤيتك إلى واقع";
const FALLBACK_DESCRIPTION =
  "تصميم داخلي · معماري · ديكور · في مصر والسعودية والإمارات";
const FALLBACK_BUTTONS: HeroButton[] = [
  {
    id: "btn-1",
    text: "احجز استشارة مجانية",
    link: "/#consultation",
    style: "primary",
  },
  {
    id: "btn-2",
    text: "شوف أعمالنا",
    link: "/projects",
    style: "secondary",
  },
];

function withAutoOptimization(url: string): string {
  if (!url) return url;
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("f_auto") || url.includes("q_auto")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}

// ✅ دالة مساعدة تحول بيانات الفيديو الخام لـ url + poster جاهزين
function buildVideoState(data: HeroVideoData | null) {
  const finalDesktopUrl = data?.desktopVideoUrl
    ? withAutoOptimization(data.desktopVideoUrl)
    : "";

  const finalMobileUrl = data?.mobileVideoUrl
    ? withAutoOptimization(data.mobileVideoUrl)
    : "";

  const desktopFrame = data?.desktopPosterFrame ?? 0;
  const mobileFrame = data?.mobilePosterFrame ?? 0;

  return {
    desktopUrl: finalDesktopUrl,
    mobileUrl: finalMobileUrl,
    desktopPoster: finalDesktopUrl
      ? getPosterFromFrame(finalDesktopUrl, desktopFrame)
      : "",
    mobilePoster: finalMobileUrl
      ? getPosterFromFrame(finalMobileUrl, mobileFrame)
      : "",
  };
}

// ✅ الـ component بقى بيستقبل initialData (اختياري) جاي من السيرفر
interface HeroVideoProps {
  initialData?: HeroVideoData | null;
}

export default function HeroVideo({ initialData = null }: HeroVideoProps) {
  // ✅ نبني الحالة الابتدائية من البيانات اللي جايه من السيرفر
  const initialState = buildVideoState(initialData);

  const [desktopUrl, setDesktopUrl] = useState(initialState.desktopUrl);
  const [mobileUrl, setMobileUrl] = useState(initialState.mobileUrl);

  const [desktopPoster, setDesktopPoster] = useState(initialState.desktopPoster);
  const [mobilePoster, setMobilePoster] = useState(initialState.mobilePoster);

  const [title, setTitle] = useState(FALLBACK_TITLE);
  const [subtitle, setSubtitle] = useState(FALLBACK_SUBTITLE);
  const [description, setDescription] = useState(FALLBACK_DESCRIPTION);
  const [buttons, setButtons] = useState<HeroButton[]>(FALLBACK_BUTTONS);

  useEffect(() => {
    const unsubscribeVideo = subscribeToHeroVideo((data) => {
      const state = buildVideoState(data);
      setDesktopUrl(state.desktopUrl);
      setMobileUrl(state.mobileUrl);
      setDesktopPoster(state.desktopPoster);
      setMobilePoster(state.mobilePoster);
    });

    const unsubscribeText = subscribeToHeroText((data) => {
      if (data) {
        setTitle(data.title || FALLBACK_TITLE);
        setSubtitle(data.subtitle || FALLBACK_SUBTITLE);
        setDescription(data.description || FALLBACK_DESCRIPTION);
        setButtons(
          data.buttons && data.buttons.length > 0
            ? data.buttons
            : FALLBACK_BUTTONS
        );
      }
    });

    return () => {
      unsubscribeVideo();
      unsubscribeText();
    };
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden bg-primary-darker"
      style={{ height: "100dvh" }}
    >
      <video
        key={`desktop-${desktopUrl}`}
        className="hidden md:block absolute inset-0 w-full h-full object-cover"
        src={desktopUrl || undefined}
        poster={desktopPoster || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <video
        key={`mobile-${mobileUrl}`}
        className="md:hidden absolute inset-0 w-full h-full object-cover"
        src={mobileUrl || undefined}
        poster={mobilePoster || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-primary-darker/90 via-primary-darker/30 to-primary-darker/60 pointer-events-none" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg">
            {title}
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-2 drop-shadow-md max-w-2xl mx-auto">
            {subtitle}
          </p>
          <p className="text-base md:text-lg text-white/70 mb-8 max-w-xl mx-auto">
            {description}
          </p>

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
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-auto">
        <Link
          href="#offers"
          className="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <span className="text-xs font-medium">اكتشف المزيد</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}