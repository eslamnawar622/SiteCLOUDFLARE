"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
   { href: "/admin/projects", label: "🏗️ المشاريع", id: "projects" },
   { href: "/admin/team", label: "👨‍💼 الفريق", id: "team" },
  { href: "/admin/map", label: "🗺️ الخريطة", id: "map" },
  { href: "/admin/hero-video", label: "🎬 فيديو الهيرو", id: "hero-video" },
  { href: "/admin/hero-text", label: "📝 نص الهيرو", id: "hero-text" },
  { href: "/admin/clients", label: "👥 العملاء", id: "clients" },
  { href: "/admin/offers", label: "🎯 العروض", id: "offers" },
  { href: "/admin/settings", label: "⚙️ الإعدادات", id: "settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } bg-surface-raised border-l border-border flex flex-col transition-all duration-300 fixed right-0 top-0 h-full z-30`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-lg font-bold text-text-primary">لوحة التحكم</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface transition-colors"
          >
            {collapsed ? "◀" : "▶"}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`mx-2 px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`}
              >
                <span className="text-xl">{item.label.split(" ")[0]}</span>
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label.slice(2)}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {!collapsed && (
            <p className="text-[10px] text-text-muted text-center">
              Axis Design Studio
            </p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "mr-16" : "mr-64"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}