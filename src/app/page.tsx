import HeroVideo from "@/components/home/HeroVideo";
import OffersSection from "@/components/home/OffersSection";
import ProjectsPreview from "@/components/home/ProjectsPreview";
import ProductsPreview from "@/components/home/ProductsPreview";
import ClientsSection from "@/components/home/ClientsSection";
import TeamSection from "@/components/home/TeamSection";
import ProcessSection from "@/components/home/ProcessSection";
import ConsultationSection from "@/components/home/ConsultationSection";
import MapWrapper from "@/components/MapWrapper";
import { getSettings } from "@/lib/firestore/settings";

export default async function Home() {
  const settings = await getSettings(); // ← SSR أسرع!

  return (
    <main>
      <HeroVideo initialData={settings} />
      <OffersSection />
      <ProjectsPreview />
      <ProductsPreview />
      <ClientsSection />
      <TeamSection />
      <ProcessSection />
      <ConsultationSection />
      <MapWrapper />
    </main>
  );
}