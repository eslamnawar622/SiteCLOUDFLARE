export default function HeroVideo() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const videoPublicId = "Screen_Recording_2026-06-29_074425_nllrlu";

  const videoUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${videoPublicId}.mp4`;

  return (
    <section className="relative w-full h-screen h-[100dvh] overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-black/30" />
    </section>
  );
}