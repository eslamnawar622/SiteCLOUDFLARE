import { getCurrentOffer, getArchivedOffers } from "@/lib/firestore/offers";
import Image from "next/image";

export default async function OffersSection() {
  const [currentOffer, archivedOffers] = await Promise.all([
  getCurrentOffer(),
  getArchivedOffers(),
]);
  return (
    <section className="bg-stone-50 py-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold text-stone-900 mb-10">
          عروضنا
        </h2>

        {/* العرض الحالي */}
        {currentOffer ? (
          <div className="flex flex-col md:flex-row-reverse gap-8 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-12">
            <div className="md:w-1/2">
              <video
                className="w-full h-64 md:h-full object-cover"
                src={currentOffer.videoUrl}
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
            <div className="md:w-1/2 flex flex-col justify-center p-8">
              <span className="text-sm font-medium text-amber-700 mb-2">
                عرض حالي
              </span>
              <h3 className="text-2xl font-semibold text-stone-900 mb-3">
                {currentOffer.title}
              </h3>
              <p className="text-stone-600 leading-relaxed">
                {currentOffer.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row-reverse gap-8 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-12">
            <div className="relative w-full md:w-1/2 h-64 md:h-auto">
              <Image
                src="/images/offices/placeholder.webp"
                alt="لا يوجد عرض حالي"
                fill
                className="object-cover"
              />
            </div>
            <div className="md:w-1/2 flex flex-col justify-center p-8">
              <span className="text-sm font-medium text-stone-500 mb-2">
                لا يوجد عرض حالي
              </span>
              <h3 className="text-2xl font-semibold text-stone-900 mb-3">
                ترقّبوا عروضنا القادمة
              </h3>
              <p className="text-stone-600 leading-relaxed">
                نعمل دائمًا على تجهيز عروض جديدة، تابعونا لمعرفة كل جديد.
              </p>
            </div>
          </div>
        )}

        {/* أرشيف العروض */}
        {archivedOffers.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-stone-800 mb-6">
              عروض سابقة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden"
                >
                  <div className="relative w-full h-40">
                    <Image
                      src={offer.imageUrl}
                      alt={offer.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h4 className="font-semibold text-stone-900 mb-1">
                      {offer.title}
                    </h4>
                    <p className="text-sm text-stone-600 mb-3">
                      {offer.description}
                    </p>
                    <span className="text-xs text-stone-400">
                      {offer.startDate.toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}