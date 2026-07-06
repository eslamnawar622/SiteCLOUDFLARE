import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-primary-darker text-text-secondary pt-16 pb-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <h3 className="text-text-on-primary text-xl font-bold mb-4">Axis Design Studio</h3>
            <p className="text-text-muted leading-relaxed">
              مكتب تصميمات هندسية ومعماري وديكور، نقدم حلول تصميم عصرية واحترافية في مصر والسعودية والإمارات ولبنان.
            </p>
          </div>

          <div>
            <h3 className="text-text-on-primary text-lg font-semibold mb-4">روابط سريعة</h3>
            <div className="flex flex-col gap-3">
              <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              <Link href="/projects" className="hover:text-primary transition-colors">المشاريع</Link>
              <Link href="/products" className="hover:text-primary transition-colors">المنتجات</Link>
              <Link href="/#consultation" className="hover:text-primary transition-colors">احجز استشارة</Link>
            </div>
          </div>

          <div>
            <h3 className="text-text-on-primary text-lg font-semibold mb-4">تواصل معنا</h3>
            <div className="flex flex-col gap-3 text-text-muted">
              <span>📍 الإسكندرية، مصر</span>
              <span dir="ltr" className="text-right">📞 01012840793</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-6 text-center text-text-muted text-sm">
          © {new Date().getFullYear()} Axis Design Studio. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}