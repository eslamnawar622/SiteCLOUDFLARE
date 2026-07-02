import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <h3 className="text-white text-xl font-bold mb-4">Axis Design Studio</h3>
            <p className="text-stone-400 leading-relaxed">
              مكتب تصميمات هندسية ومعماري وديكور، نقدم حلول تصميم عصرية واحترافية في مصر والسعودية والإمارات ولبنان.
            </p>
          </div>

          <div>
            <h3 className="text-white text-lg font-semibold mb-4">روابط سريعة</h3>
            <div className="flex flex-col gap-3">
              <Link href="/" className="hover:text-amber-500 transition-colors">الرئيسية</Link>
              <Link href="/projects" className="hover:text-amber-500 transition-colors">المشاريع</Link>
              <Link href="/products" className="hover:text-amber-500 transition-colors">المنتجات</Link>
              <Link href="/#consultation" className="hover:text-amber-500 transition-colors">احجز استشارة</Link>
            </div>
          </div>

          <div>
            <h3 className="text-white text-lg font-semibold mb-4">تواصل معنا</h3>
            <div className="flex flex-col gap-3 text-stone-400">
              <span>📍 الإسكندرية، مصر</span>
              <span dir="ltr" className="text-right">📞 01012840793</span>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 text-center text-stone-500 text-sm">
          © {new Date().getFullYear()} Axis Design Studio. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}