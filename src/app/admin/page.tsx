import Link from "next/link";

const sections = [
  { href: "/admin/projects", label: "المشاريع", icon: "🏗️", desc: "إدارة مشاريع الشركة المعروضة" },
  { href: "/admin/team", label: "الفريق", icon: "👨‍💼", desc: "أعضاء فريق العمل" },
  { href: "/admin/map", label: "الخريطة", icon: "🗺️", desc: "صور ومواقع الخريطة" },
  { href: "/admin/hero-video", label: "فيديو الهيرو", icon: "🎬", desc: "الفيديو الرئيسي بالصفحة" },
  { href: "/admin/hero-text", label: "نص الهيرو", icon: "📝", desc: "نصوص الصفحة الرئيسية" },
  { href: "/admin/clients", label: "العملاء", icon: "👥", desc: "شعارات وأسماء العملاء" },
  { href: "/admin/offers", label: "العروض", icon: "🎯", desc: "العروض الحالية والسابقة" },
  { href: "/admin/service-types", label: "أنواع الخدمات", icon: "🧩", desc: "تصنيفات الخدمات المقدمة" },
  { href: "/admin/process", label: "مراحل العمل", icon: "🧭", desc: "خطوات آلية العمل مع العميل" },
    { href: "/admin/product-inquiry", label: "طلب المنتج", icon: "💬", desc: "رسالة واتساب طلب المنتج" },

  { href: "/admin/settings", label: "الإعدادات", icon: "⚙️", desc: "الإعدادات العامة للموقع" },
];

export default function AdminHome() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          أهلاً بيك في لوحة التحكم
        </h1>
        <p className="text-text-secondary text-sm">
          اختر القسم اللي عايز تعدّل فيه من الكروت تحت
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-surface-raised border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-3xl">{s.icon}</span>
            <span className="font-semibold text-text-primary">{s.label}</span>
            <span className="text-xs text-text-muted">{s.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}