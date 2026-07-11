"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getClients,
  addClient,
  updateClient,
  deleteClient,
  Client,
  getClientsSectionSettings,
  updateClientsSectionSettings,
} from "@/lib/firestore/clients";
import { uploadClientLogo, deleteFromCloudinary } from "@/lib/cloudinaryUpload";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ إعدادات قسم العملاء
  const [sectionTitle, setSectionTitle] = useState("عملاؤنا");
  const [sectionSubtitle, setSectionSubtitle] = useState(
    "نفتخر بثقة كبرى الشركات والعلامات التجارية في مصر والوطن العربي"
  );
  const [savingSettings, setSavingSettings] = useState(false);

  // بيانات الفورم
  const [name, setName] = useState("");
  const [order, setOrder] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // حالة التعديل
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ تحميل العملاء
  useEffect(() => {
    async function init() {
      setLoading(true);
      const data = await getClients();
      setClients(data);
      setLoading(false);
    }
    init();
  }, []);

  // ✅ تحميل إعدادات القسم
  useEffect(() => {
    async function loadSettings() {
      const s = await getClientsSectionSettings();
      setSectionTitle(s.title);
      setSectionSubtitle(s.subtitle);
    }
    loadSettings();
  }, []);

  // لما يختار صورة — نظهر preview
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  // ✅ حفظ إعدادات القسم
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateClientsSectionSettings({
        title: sectionTitle,
        subtitle: sectionSubtitle,
      });
      alert("✅ تم حفظ الإعدادات!");
    } catch {
      alert("❌ حصل خطأ");
    } finally {
      setSavingSettings(false);
    }
  }

  // إضافة أو تعديل عميل
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name) {
      alert("لازم تكتب اسم العميل");
      return;
    }

    setUploading(true);

    try {
      let logoUrl = "";

      if (file) {
        logoUrl = await uploadClientLogo(file);
      }

      if (editingId) {
        const updateData: Partial<{
          name: string;
          logoUrl: string;
          order: number;
        }> = {
          name,
          order,
        };
        if (logoUrl) updateData.logoUrl = logoUrl;

        await updateClient(editingId, updateData);
        setEditingId(null);
      } else {
        if (!file) {
          alert("لازم تختار صورة لوجو");
          setUploading(false);
          return;
        }
        await addClient({ name, logoUrl, order });
      }

      setName("");
      setOrder(1);
      setFile(null);
      setPreviewUrl(null);

      // ✅ أعد التحميل
      const data = await getClients();
      setClients(data);
    } catch {
      alert("حصل خطأ، حاول تاني");
    } finally {
      setUploading(false);
    }
  }

  // تجهيز الفورم لتعديل عميل
  function handleEdit(client: Client) {
    setEditingId(client.id);
    setName(client.name);
    setOrder(client.order);
    setFile(null);
    setPreviewUrl(client.logoUrl || null);
  }

  // إلغاء التعديل
  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setOrder(1);
    setFile(null);
    setPreviewUrl(null);
  }

  // حذف عميل + الصورة من Cloudinary
  async function handleDelete(client: Client) {
    const confirmed = confirm("متأكد إنك عايز تمسح العميل ده؟");
    if (!confirmed) return;

    try {
      if (client.logoUrl) {
        await deleteFromCloudinary(client.logoUrl);
      }
      await deleteClient(client.id);

      // ✅ أعد التحميل
      const data = await getClients();
      setClients(data);
    } catch {
      alert("حصل خطأ في الحذف");
    }
  }

  return (
       <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-8">
        إدارة العملاء
      </h1>

      {/* ✅ إعدادات قسم العملاء */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-surface-raised border border-border rounded-xl p-6 mb-10 space-y-4"
      >
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          ⚙️ إعدادات قسم العملاء
        </h2>

        <div>
          <label className="block text-text-secondary text-sm mb-1">
            العنوان الرئيسي
          </label>
          <input
            type="text"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
            placeholder="مثال: عملاؤنا / شركاؤنا"
          />
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1">
            الوصف الفرعي
          </label>
          <textarea
            value={sectionSubtitle}
            onChange={(e) => setSectionSubtitle(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary resize-none"
            placeholder="اكتب الوصف اللي تحت العنوان..."
          />
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2 rounded-full font-medium transition-colors"
        >
          {savingSettings ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
        </button>
      </form>

      {/* الفورم */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-raised border border-border rounded-xl p-6 mb-10 space-y-4"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          {editingId ? "تعديل عميل" : "إضافة عميل جديد"}
        </h2>

        {/* اسم العميل */}
        <div>
          <label className="block text-text-secondary text-sm mb-1">
            اسم العميل
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
            placeholder="اسم الشركة"
          />
        </div>

        {/* الترتيب */}
        <div>
          <label className="block text-text-secondary text-sm mb-1">
            الترتيب
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
          />
        </div>

        {/* رفع الصورة — مع preview */}
        <div>
          <label className="block text-text-secondary text-sm mb-1">
            صورة اللوجو {editingId && "(اختياري لو مش عايز تغيّرها)"}
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-text-secondary text-sm mb-3"
          />

          {previewUrl && (
            <div className="relative w-32 h-20 bg-surface rounded-lg overflow-hidden border border-border">
              <Image
                src={previewUrl}
                alt="معاينة الصورة"
                fill
                className="object-contain p-2"
              />
            </div>
          )}

          {!previewUrl && !editingId && (
            <p className="text-text-muted text-xs">
              📤 ارفع صورة اللوجو هنا — الصورة هتتعرض في موقعك فوراً
            </p>
          )}
        </div>

        {/* أزرار */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            {uploading
              ? "جاري الحفظ..."
              : editingId
              ? "حفظ التعديل"
              : "إضافة العميل"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-surface hover:bg-border text-text-secondary px-6 py-2 rounded-full font-medium transition-colors"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      {/* جدول العملاء */}
      <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            العملاء الحاليين ({clients.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">
            جاري التحميل...
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            مفيش عملاء لسه
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-4 p-4"
              >
                <div className="relative w-16 h-16 flex-shrink-0 bg-surface rounded-lg overflow-hidden">
                  {client.logoUrl && (
                    <Image
                      src={client.logoUrl}
                      alt={client.name}
                      fill
                      className="object-contain p-2"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-text-primary font-medium">
                    {client.name}
                  </p>
                  <p className="text-text-muted text-sm">
                    الترتيب: {client.order}
                  </p>
                </div>

                <button
                  onClick={() => handleEdit(client)}
                  className="text-primary hover:text-primary-dark text-sm font-medium px-3 py-1.5"
                >
                  تعديل
                </button>

                <button
                  onClick={() => handleDelete(client)}
                  className="text-error hover:opacity-80 text-sm font-medium px-3 py-1.5"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}