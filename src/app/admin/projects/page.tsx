"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getAllProjects,
  addProject,
  updateProject,
  deleteProject,
} from "@/lib/firestore/projects";
import { Project } from "@/types/project";

type GalleryImage = { url: string; key: string };

const emptyForm = {
  slug: "",
  title: "",
  location: "",
  type: "",
  year: new Date().getFullYear(),
  description: "",
  shortDescription: "",
  badgeText: "",
  featured: false,
  cardWidth: "" as string | number,
  cardHeight: "" as string | number,
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    const data = await getAllProjects();
    setProjects(data);
    setLoading(false);
  }

  function resetForm() {
    setForm(emptyForm);
    setGallery([]);
    setMainImageIndex(null);
    setEditingId(null);
  }

  function generateSlug() {
    // بنسيب بس حروف إنجليزي وأرقام (عشان الرابط يشتغل صح ومايعملش 404)
    const asciiSlug = form.title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // لو العنوان عربي بالكامل ومفيش حروف إنجليزي خالص، بنولّد slug من تاريخ + رقم عشوائي
    const slug = asciiSlug || `project-${Date.now().toString(36)}`;

    setForm((f) => ({ ...f, slug }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/r2/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("فشل رفع الصورة");

        const data = await res.json();
        setGallery((prev) => {
          const updated = [...prev, { url: data.url, key: data.key }];
          // أول صورة ترفع تتحط تلقائي كصورة غلاف لو مفيش غلاف متحدد
          if (mainImageIndex === null && updated.length === 1) {
            setMainImageIndex(0);
          }
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء رفع إحدى الصور");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteImage(index: number) {
    const img = gallery[index];
    if (!confirm("متأكد من حذف الصورة دي؟")) return;

    try {
      await fetch("/api/r2/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: img.key }),
      });
    } catch (err) {
      console.error("فشل حذف الصورة من R2", err);
    }

    setGallery((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });

    if (mainImageIndex === index) {
      setMainImageIndex(gallery.length > 1 ? 0 : null);
    } else if (mainImageIndex !== null && index < mainImageIndex) {
      setMainImageIndex(mainImageIndex - 1);
    }
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setForm({
      slug: project.slug,
      title: project.title,
      location: project.location,
      type: project.type,
      year: project.year,
      description: project.description,
      shortDescription: project.shortDescription,
      badgeText: project.badgeText || "",
      featured: project.featured,
      cardWidth: project.cardWidth ?? "",
      cardHeight: project.cardHeight ?? "",
    });

    const images: GalleryImage[] = project.gallery.map((url, i) => ({
      url,
      key: project.galleryKeys?.[i] || "",
    }));
    setGallery(images);
    const mainIdx = images.findIndex((img) => img.url === project.mainImage);
    setMainImageIndex(mainIdx >= 0 ? mainIdx : images.length > 0 ? 0 : null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteProject(project: Project) {
    if (!confirm(`متأكد من حذف مشروع "${project.title}"؟`)) return;

    // حذف الصور من R2 الأول
    for (const key of project.galleryKeys || []) {
      if (!key) continue;
      try {
        await fetch("/api/r2/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
      } catch (err) {
        console.error("فشل حذف صورة من R2", err);
      }
    }

    await deleteProject(project.id);
    if (editingId === project.id) resetForm();
    loadProjects();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.slug || !form.title) {
      alert("لازم تدخل العنوان والـ slug على الأقل");
      return;
    }
    if (gallery.length === 0 || mainImageIndex === null) {
      alert("لازم ترفع صورة واحدة على الأقل وتختار صورة الغلاف");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Omit<Project, "id" | "createdAt">> = {
        slug: form.slug,
        title: form.title,
        location: form.location,
        type: form.type,
        year: Number(form.year),
        description: form.description,
        shortDescription: form.shortDescription,
        badgeText: form.badgeText,
        featured: form.featured,
        mainImage: gallery[mainImageIndex].url,
        gallery: gallery.map((g) => g.url),
        galleryKeys: gallery.map((g) => g.key),
      };

      if (form.cardWidth) {
        payload.cardWidth = Number(form.cardWidth);
      }
      if (form.cardHeight) {
        payload.cardHeight = Number(form.cardHeight);
      }

      if (editingId) {
        await updateProject(editingId, payload);
      } else {
        await addProject(payload as Omit<Project, "id" | "createdAt">);
      }

      resetForm();
      loadProjects();
    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold text-text-primary">
        {editingId ? "تعديل مشروع" : "إضافة مشروع جديد"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-raised border border-border rounded-2xl p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              العنوان
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Slug
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
                required
              />
              <button
                type="button"
                onClick={generateSlug}
                className="px-3 py-2 text-sm bg-surface border border-border rounded-lg whitespace-nowrap hover:bg-surface-raised"
              >
                توليد تلقائي
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              الموقع
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              النوع (يظهر تحت الكارت)
            </label>
            <input
              type="text"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              السنة
            </label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              نص الشريط الأزرق (Badge)
            </label>
            <input
              type="text"
              value={form.badgeText}
              onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
              placeholder="تصميم داخلي / شقة كاملة ..."
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              عرض الكارت بالبكسل (اختياري)
            </label>
            <input
              type="number"
              value={form.cardWidth}
              onChange={(e) => setForm({ ...form, cardWidth: e.target.value })}
              placeholder="مثلاً 400"
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              طول الكارت بالبكسل (اختياري)
            </label>
            <input
              type="number"
              value={form.cardHeight}
              onChange={(e) => setForm({ ...form, cardHeight: e.target.value })}
              placeholder="مثلاً 300"
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            وصف مختصر (يظهر في الكارت)
          </label>
          <textarea
            value={form.shortDescription}
            onChange={(e) =>
              setForm({ ...form, shortDescription: e.target.value })
            }
            rows={2}
            className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            الوصف الكامل (صفحة التفاصيل)
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={5}
            className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          مشروع مميز (يظهر في الصفحة الرئيسية)
        </label>

        {/* رفع الصور */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            صور المشروع
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="block text-sm"
          />
          {uploading && (
            <p className="text-sm text-primary mt-2">جاري رفع الصور...</p>
          )}

          {gallery.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
              {gallery.map((img, index) => (
                <div
                  key={img.key + index}
                  className={`relative aspect-square border-2 rounded-lg overflow-hidden ${
                    mainImageIndex === index
                      ? "border-primary"
                      : "border-border"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`صورة ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 flex items-center justify-between px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setMainImageIndex(index)}
                      className="text-xs text-white hover:underline"
                    >
                      {mainImageIndex === index ? "✓ الغلاف" : "اختر كغلاف"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(index)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة المشروع"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      {/* قائمة المشاريع الحالية */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          المشاريع الحالية
        </h2>
        {loading ? (
          <p className="text-text-muted">جاري التحميل...</p>
        ) : projects.length === 0 ? (
          <p className="text-text-muted">لا توجد مشاريع بعد</p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-4 bg-surface-raised border border-border rounded-xl p-3"
              >
                <Image
                  src={project.mainImage}
                  alt={project.title}
                  width={64}
                  height={64}
                  className="object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-text-primary">
                    {project.title}
                  </p>
                  <p className="text-sm text-text-muted">
                    {project.location} • {project.year}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(project)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-surface"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDeleteProject(project)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-500 hover:bg-red-50"
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