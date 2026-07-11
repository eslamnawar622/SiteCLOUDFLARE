"use client";

import { useEffect, useState } from "react";
import { getServiceTypes } from "@/lib/firestore/serviceTypes";
import { getConsultationSettings } from "@/lib/firestore/consultationSettings";
import { defaultConsultationSettings } from "@/types/consultationSettings";
import { ServiceType } from "@/types/serviceType";
import { ConsultationSettings } from "@/types/consultationSettings";
import BeforeAfterSlider from "@/components/shared/BeforeAfterSlider";

export default function ConsultationSection() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [preferredDay, setPreferredDay] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const [settings, setSettings] = useState<ConsultationSettings>(
    defaultConsultationSettings
  );

  const [details, setDetails] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const offer = params.get("offer");
    return offer ? `مهتم بعرض: ${offer}` : "";
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getServiceTypes().then((types) => {
      setServiceTypes(types);
      if (types.length > 0) setServiceType(types[0].name);
    });
    getConsultationSettings().then(setSettings);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/send-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          serviceType,
          details,
          preferredDay,
          preferredTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send");
      }

      setSuccess(true);
      setName("");
      setPhone("");
      setServiceType(serviceTypes[0]?.name || "");
      setDetails("");
      setPreferredDay("");
      setPreferredTime("");
    } catch (error) {
      console.error("Error sending consultation:", error);
      alert("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const days = settings.availableDays?.length
    ? settings.availableDays
    : defaultConsultationSettings.availableDays;
  const timeSlots = settings.availableTimeSlots?.length
    ? settings.availableTimeSlots
    : defaultConsultationSettings.availableTimeSlots;

  return (
    <section
      id="consultation"
      className="relative pt-24 pb-16 px-6 md:px-12"
      style={{
        backgroundColor: "#fbfbfa",
        backgroundImage:
          "radial-gradient(circle at 15% 10%, rgba(56, 90, 220, 0.05) 0%, transparent 45%), linear-gradient(rgba(30, 40, 80, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 40, 80, 0.035) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 32px 32px, 32px 32px",
      }}
    >
      {settings.beforeImage && settings.afterImage && (
        <div className="absolute inset-0 z-0">
          <BeforeAfterSlider
            beforeImage={settings.beforeImage}
            afterImage={settings.afterImage}
            beforeLabel={settings.beforeLabel}
            afterLabel={settings.afterLabel}
            labelFontSize={settings.labelFontSize}
            opacity={settings.backgroundOpacity}
          />
        </div>
      )}

      <div className="relative z-10 max-w-lg mx-auto">
        <div className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="text-center mb-6">
            <span className="inline-block bg-primary text-white text-2xl md:text-3xl font-semibold px-6 py-2 rounded-full mb-3">
              {settings.sectionTitle}
            </span>
            <p className="text-text-secondary text-sm mt-2">{settings.sectionSubtitle}</p>
          </div>

          {success && (
            <div className="mb-6 bg-success/20 border border-success text-success px-4 py-3 rounded-xl text-center">
              تم إرسال طلبك بنجاح! هنتواصل معاك قريبًا.
            </div>
          )}

          <form onSubmit={handleSubmit} className="text-right space-y-4">
            {serviceTypes.length > 0 && (
              <div>
                <label className="block text-text-secondary text-sm mb-1">نوع الخدمة</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface text-text-primary border border-border focus:outline-none focus:border-primary appearance-none"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "left 1rem center",
                  }}
                >
                  {serviceTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-text-secondary text-sm mb-1">الاسم</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
                placeholder="اسمك بالكامل"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                إمتى تحب نكلمك؟ (اختياري)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={preferredDay}
                  onChange={(e) => setPreferredDay(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-surface text-text-primary border border-border focus:outline-none focus:border-primary appearance-none text-sm"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "left 0.75rem center",
                  }}
                >
                  <option value="">اليوم</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>

                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-surface text-text-primary border border-border focus:outline-none focus:border-primary appearance-none text-sm"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "left 0.75rem center",
                  }}
                >
                  <option value="">الوقت</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                تفاصيل إضافية (اختياري)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
                placeholder="اكتب أي تفاصيل تساعدنا نفهم طلبك أكتر"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3 rounded-full font-medium transition-colors"
            >
              {loading ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </form>

          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-text-secondary">
            <span>بياناتك آمنة</span>
            <span>رد سريع</span>
          </div>
        </div>
      </div>
    </section>
  );
}