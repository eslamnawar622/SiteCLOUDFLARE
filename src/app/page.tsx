import HeroVideo from "@/components/home/HeroVideo";
import OffersSection from "@/components/home/OffersSection";
import ProjectsPreview from "@/components/home/ProjectsPreview";
import ProductsPreview from "@/components/home/ProductsPreview";
import TeamSection from "@/components/home/TeamSection";
import ConsultationSection from "@/components/home/ConsultationSection";
import MapWrapper from "@/components/MapWrapper";

export default function Home() {
  return (
    <main>
      <HeroVideo />
      <OffersSection />
      <ProjectsPreview />
      <ProductsPreview />
      <TeamSection />
      <ConsultationSection />
      <MapWrapper />
    </main>
  );
}