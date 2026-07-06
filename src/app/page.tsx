import HeroVideo from "@/components/home/HeroVideo";
import OffersSection from "@/components/home/OffersSection";
import ProjectsPreview from "@/components/home/ProjectsPreview";
import ProductsPreview from "@/components/home/ProductsPreview";
import ClientsSection from "@/components/home/ClientsSection";
import TeamSection from "@/components/home/TeamSection";
import ConsultationSection from "@/components/home/ConsultationSection";
import MapWrapper from "@/components/MapWrapper";
import { getHeroVideo } from "@/lib/firestore/heroVideo";

export default async function Home() {
  // ✅ نجيب بيانات الفيديو من السيرفر قبل ما الصفحة توصل للمتصفح
  const heroVideoData = await getHeroVideo();

  return (
    <main>
      <HeroVideo initialData={heroVideoData} />
      <OffersSection />
      <ProjectsPreview />
      <ProductsPreview />
      <ClientsSection />
      <TeamSection />
      <ConsultationSection />
      <MapWrapper />
    </main>
  );
}