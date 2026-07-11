"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { subscribeToSettings, SettingsData } from "@/lib/firestore/settings";

const PORTFOLIO_PDF_URL =
  "https://res.cloudinary.com/yrltdsrw/image/upload/fl_attachment/v1782983729/Final_2023_m9yztd.pdf";

interface NavbarProps {
  initialData?: SettingsData | null;
}

export default function Navbar({ initialData }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "");
  const [logoHeight, setLogoHeight] = useState(initialData?.logoHeight || 56);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      setLogoUrl(data?.logoUrl || "");
      setLogoHeight(data?.logoHeight || 56);
    });
    return () => unsubscribe();
  }, []);

  const links = [
    { label: "الرئيسية", href: "/" },
    { label: "المشاريع", href: "/projects" },
    { label: "المنتجات", href: "/products" },
  ];

  return (
    <nav className="sticky top-0 z-[9999] backdrop-blur-md bg-surface-raised/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="relative flex items-center justify-between h-20">
          <Link href="/" className="shrink-0 flex items-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Axis Design Studio"
                width={200}
                height={80}
                style={{ height: logoHeight, width: "auto" }}
                className="object-contain"
                priority
              />
            ) : (
              <span className="text-text-primary font-bold text-xl">
                Axis Design Studio
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-secondary hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <a
              href={PORTFOLIO_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-primary transition-colors font-medium border border-border hover:border-primary px-4 py-2 rounded-full"
            >
              البورتفوليو
            </a>
            <Link
              href="/#consultation"
              className="bg-primary-dark hover:bg-primary-darker text-white px-5 py-2.5 rounded-full font-medium transition-colors"
            >
              احجز استشارة
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-text-primary"
              aria-label="فتح القائمة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-6 flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-text-secondary hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={PORTFOLIO_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="text-text-secondary hover:text-primary transition-colors font-medium border border-border px-5 py-2.5 rounded-full text-center"
            >
              البورتفوليو
            </a>
            <Link
              href="/#consultation"
              onClick={() => setMenuOpen(false)}
              className="bg-primary-dark hover:bg-primary-darker text-white px-5 py-2.5 rounded-full font-medium transition-colors text-center"
            >
              احجز استشارة
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}