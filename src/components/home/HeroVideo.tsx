export default function HeroVideo() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const videoPublicId = "Screen_Recording_2026-06-29_074425_nllrlu";

  // ✅ Transformations: جودة تلقائية + عرض مناسب لكل جهاز
  const desktopUrl = `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,w_1920/${videoPublicId}.mp4`;
  const mobileUrl = `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,w_800/${videoPublicId}.mp4`;

  // ✅ Poster: أول فريم من الفيديو يظهر فوراً
  const posterUrl = `https://res.cloudinary.com/${cloudName}/video/upload/so_0,q_auto/${videoPublicId}.jpg`;

  return (
    <section className="relative w-full h-screen h-[100dvh] overflow-hidden bg-stone-900">
      {/* فيديو اللاب/التاب - Full HD */}
      <video
        className="hidden md:block absolute inset-0 w-full h-full object-cover"
        src={desktopUrl}
        poster={posterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      {/* فيديو الموبايل - أخف وأسرع */}
      <video
        className="md:hidden absolute inset-0 w-full h-full object-cover"
        src={mobileUrl}
        poster={posterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      {/* تدرج فوق الفيديو */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/30" />

      {/* سهم Scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-80"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}