export default function HeroVideo() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  // فيديو أفقي لللاب/التاب
  const desktopVideoId = "Screen_Recording_2026-06-29_074425_nllrlu";
  // فيديو عمودي للموبايل (من الإنستا)
  const mobileVideoId = "video_2026-07-02_14-21-02_lairvc";

  const desktopUrl = `https://res.cloudinary.com/${cloudName}/video/upload/q_auto/${desktopVideoId}.mp4`;
  const mobileUrl = `https://res.cloudinary.com/${cloudName}/video/upload/q_auto/${mobileVideoId}.mp4`;

  return (
    <section className="relative w-full h-screen h-[100dvh] overflow-hidden bg-stone-900">
      {/* فيديو اللاب/التاب - أفقي */}
      <video
        className="hidden md:block absolute inset-0 w-full h-full object-cover"
        src={desktopUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* فيديو الموبايل - عمودي */}
      <video
        className="md:hidden absolute inset-0 w-full h-full object-cover"
        src={mobileUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/30" />
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}