import type { Metadata } from "next";
import { Cairo, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import SocialSidebar from "@/components/shared/SocialSidebar";
import MotionProvider from "@/components/shared/MotionProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

// عناوين — خط هندسي حاسم يتماشى مع شكل اللوجو المثلثي
const cairo = Cairo({
  variable: "--font-heading",
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800"],
});

// نصوص أساسية — خط نظيف واضح احترافي بديل عن الـ Arial الافتراضي
const plexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Axis Design Studio",
  description: "Axis Design Studio — تصميم داخلي وهندسة معمارية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
       lang="ar"
       dir="rtl"
       className={`${cairo.variable} ${plexSansArabic.variable} h-full antialiased`}
       suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <MotionProvider>
            <Navbar />
            <SocialSidebar />
            <div className="flex-1">{children}</div>
            <Footer />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}