"use client";

import { useState, createElement } from "react";
import Link from "next/link";
import Image from "next/image";

const PORTFOLIO_PDF_URL =
  "https://res.cloudinary.com/yrltdsrw/image/upload/fl_attachment/v1782983729/Final_2023_m9yztd.pdf";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label: "الرئيسية", href: "/" },
    { label: "المشاريع", href: "/projects" },
    { label: "المنتجات", href: "/products" },
  ];

  const portfolioLinkProps = {
    href: PORTFOLIO_PDF_URL,
    target: "_blank",
    rel: "noopener noreferrer",
  };

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-[9999]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="relative flex items-center justify-between h-20">
          <Link
            href="/"
            className="relative h-10 w-32 md:h-12 md:w-40 lg:h-14 lg:w-48 shrink-0"
          >
            <Image
              src="https://res.cloudinary.com/yrltdsrw/image/upload/Gemini_Generated_Image_kkpgr8kkpgr8kkpg_lvwkws.png"
              alt="Axis Design Studio"
              fill
              className="object-contain"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-stone-700 hover:text-amber-700 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {createElement(
              "a",
              {
                ...portfolioLinkProps,
                className:
                  "text-stone-700 hover:text-amber-700 transition-colors font-medium border border-stone-300 hover:border-amber-700 px-4 py-2 rounded-full",
              },
              "البورتفوليو"
            )}
            <Link
              href="/#consultation"
              className="bg-amber-700 hover:bg-amber-800 text-white px-5 py-2.5 rounded-full font-medium transition-colors"
            >
              احجز استشارة
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-stone-900"
            aria-label="فتح القائمة"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-6 flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-stone-700 hover:text-amber-700 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            {createElement(
              "a",
              {
                ...portfolioLinkProps,
                onClick: () => setMenuOpen(false),
                className:
                  "text-stone-700 hover:text-amber-700 transition-colors font-medium border border-stone-300 px-5 py-2.5 rounded-full text-center",
              },
              "البورتفوليو"
            )}
            <Link
              href="/#consultation"
              onClick={() => setMenuOpen(false)}
              className="bg-amber-700 hover:bg-amber-800 text-white px-5 py-2.5 rounded-full font-medium transition-colors text-center"
            >
              احجز استشارة
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}