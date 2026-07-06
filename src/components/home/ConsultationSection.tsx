"use client";

import { useState } from "react";

export default function ConsultationSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("تصميم داخلي");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/send-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, serviceType, details }),
      });

      if (!response.ok) {
        throw new Error("Failed to send");
      }

      setSuccess(true);
      setName("");
      setPhone("");
      setServiceType("تصميم داخلي");
      setDetails("");
    } catch (error) {
      console.error("Error sending consultation:", error);
      alert("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="consultation" className="bg-primary-darker py-16 px-6 md:px-12">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-text-on-primary mb-3">
          احجز استشارة مجانية
        </h2>
        <p className="text-text-muted mb-10">
          املأ البيانات وهنتواصل معاك في أقرب وقت
        </p>

        {success && (
          <div className="mb-6 bg-success/20 border border-success text-success px-4 py-3 rounded-xl">
            تم إرسال طلبك بنجاح! هنتواصل معاك قريبًا.
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-right space-y-4">
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
            <label className="block text-text-secondary text-sm mb-1">نوع الخدمة</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
            >
              <option value="تصميم داخلي">تصميم داخلي</option>
              <option value="تصميم معماري">تصميم معماري</option>
              <option value="ديكور">ديكور</option>
              <option value="أخرى">أخرى</option>
            </select>
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
      </div>
    </section>
  );
}