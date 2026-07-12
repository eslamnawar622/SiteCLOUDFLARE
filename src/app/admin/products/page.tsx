"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/firestore/products";
import { getSettings, updateSettings } from "@/lib/firestore/settings";
import { Product } from "@/types/product";
import ProductsGrid from "@/components/home/ProductsGrid";
import ImagePositionEditor from "@/components/admin/ImagePositionEditor";

type GalleryImage = { url: string; key: string };

const emptyForm = {
  slug: "",
  name: "",
  category: "",
  price: "" as string | number,
  description: "",
  shortDescription: "",
  featured: false,
  cardWidth: "" as string | number,
  cardHeight: "" as string | number,
  imageFit: "cover" as "cover" | "contain",
  imagePositionX: 50,
  imagePositionY: 50,
  imageZoom: 1,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ─── عنوان سكشن المنتجات في الصفحة الرئيسية ───
  const [sectionLabel, setSectionLabel] = useState("تشكيلتنا المميزة");
  const [sectionTitle, setSectionTitle] = useState("منتجاتنا");
  const [sectionLabelSize, setSectionLabelSize] = useState(14);
  const [sectionTitleSize, setSectionTitleSize] = useState(32);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [sectionSaving, setSectionSaving] = useState(false);

  useEffect(() => {
    loadProducts();
    loadSectionSettings();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const data = await getAllProducts();
    setProducts(data);
    setLoading(false);
  }

  async function loadSectionSettings() {
    setSectionLoading(true);
    const data = await getSettings();
    if (data) {
      setSectionLabel(data.productsSectionLabel || "تشكيلتنا المميزة");
      setSectionTitle(data.productsSectionTitle || "منتجاتنا");
      setSectionLabelSize(data.productsSectionLabelSize || 14);
      setSectionTitleSize(data.productsSectionTitleSize || 32);
    }
    setSectionLoading(false);
  }

  async function handleSaveSectionSettings() {
    setSectionSaving(true);
    try {
      await updateSettings({
        productsSectionLabel: sectionLabel,
        productsSectionTitle: sectionTitle,
        productsSectionLabelSize: sectionLabelSize,
        productsSectionTitleSize: sectionTitleSize,
      });
      alert("✅ تم حفظ عنوان السكشن");
    } catch (err) {
      console.error(err);
      alert("❌ فشل حفظ عنوان السكشن");
    } finally {
      setSectionSaving(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setGallery([]);
    setMainImageIndex(null);
    setEditingId(null);
  }

  function generateSlug() {
    const asciiSlug = form.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const slug = asciiSlug || `product-${Date.now().toString(36)}`;

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

    setGallery((prev) => prev.filter((_, i) => i !== index));

    if (mainImageIndex === index) {
      setMainImageIndex(gallery.length > 1 ? 0 : null);
    } else if (mainImageIndex !== null && index < mainImageIndex) {
      setMainImageIndex(mainImageIndex - 1);
    }
  }

  // تحريك صورة لفوق أو لتحت في ترتيب الألبوم
  function moveImage(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;

    setGallery((prev) => {
      const updated = [...prev];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });

    setMainImageIndex((prev) => {
      if (prev === index) return targetIndex;
      if (prev === targetIndex) return index;
      return prev;
    });
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      slug: product.slug,
      name: product.name,
      category: product.category,
      price: product.price ?? "",
      description: product.description,
      shortDescription: product.shortDescription,
      featured: product.featured,
      cardWidth: product.cardWidth ?? "",
      cardHeight: product.cardHeight ?? "",
      imageFit: product.imageFit ?? "cover",
      imagePositionX: product.imagePositionX ?? 50,
      imagePositionY: product.imagePositionY ?? 50,
      imageZoom: product.imageZoom ?? 1,
    });

    const images: GalleryImage[] = product.gallery.map((url, i) => ({
      url,
      key: product.galleryKeys?.[i] || "",
    }));
    setGallery(images);
    const mainIdx = images.findIndex((img) => img.url === product.mainImage);
    setMainImageIndex(mainIdx >= 0 ? mainIdx : images.length > 0 ? 0 : null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteProduct(product: Product) {
    if (!confirm(`متأكد من حذف منتج "${product.name}"؟`)) return;

    for (const key of product.galleryKeys || []) {
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

    await deleteProduct(product.id);
    if (editingId === product.id) resetForm();
    loadProducts();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.slug || !form.name) {
      alert("لازم تدخل الاسم والـ slug على الأقل");
      return;
    }
    if (gallery.length === 0 || mainImageIndex === null) {
      alert("لازم ترفع صورة واحدة على الأقل وتختار صورة الغلاف");
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<Product, "id" | "createdAt"> = {
        slug: form.slug,
        name: form.name,
        category: form.category,
        price: Number(form.price) || 0,
        description: form.description,
        shortDescription: form.shortDescription,
        featured: form.featured,
        mainImage: gallery[mainImageIndex].url,
        gallery: gallery.map((g) => g.url),
        galleryKeys: gallery.map((g) => g.key),
        imageFit: form.imageFit,
        imagePositionX: form.imagePositionX,
        imagePositionY: form.imagePositionY,
        imageZoom: form.imageZoom,
      };

      if (form.cardWidth) {
        payload.cardWidth = Number(form.cardWidth);
      }
      if (form.cardHeight) {
        payload.cardHeight = Number(form.cardHeight);
      }

      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await addProduct(payload);
      }

      resetForm();
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  // 🔍 بيانات البريفيو الحي — نفس شكل Product بالظبط، من الفورم الحالي
  const previewProduct: Product | null =
    mainImageIndex !== null && gallery[mainImageIndex]
      ? {
          id: "preview",
          slug: form.slug || "preview",
          name: form.name || "اسم المنتج",
          category: form.category || "الفئة",
          price: Number(form.price) || 0,
          description: form.description,
          shortDescription: form.shortDescription || "وصف مختصر للمنتج...",
          mainImage: gallery[mainImageIndex].url,
          gallery: gallery.map((g) => g.url),
          galleryKeys: gallery.map((g) => g.key),
          featured: form.featured,
          cardWidth: form.cardWidth ? Number(form.cardWidth) : undefined,
          cardHeight: form.cardHeight ? Number(form.cardHeight) : undefined,
          imageFit: form.imageFit,
          imagePositionX: form.imagePositionX,
          imagePositionY: form.imagePositionY,
          imageZoom: form.imageZoom,
          createdAt: new Date(),
        }
      : null;

  // نسبة العرض للارتفاع بتاعة محرر الموضع، بنفس منطق الكارت الحقيقي
  const editorAspectRatio =
    form.cardWidth && form.cardHeight
      ? Number(form.cardWidth) / Number(form.cardHeight)
      : 4 / 3;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold text-text-primary">
        {editingId ? "تعديل منتج" : "إضافة منتج جديد"}
      </h1>

      {/* ═══════════════════════════════════════
          🏷️ عنوان سكشن المنتجات في الصفحة الرئيسية
      ═══════════════════════════════════════ */}
      <div className="bg-surface-raised border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-bold text-text-primary">
          🏷️ عنوان سكشن المنتجات في الصفحة الرئيسية
        </h2>

        {sectionLoading ? (
          <p className="text-text-muted text-sm">جاري التحميل...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-text-secondary">
                    النص الصغير (فوق العنوان)
                  </label>
                  <span className="text-xs text-text-muted">
                    {sectionLabelSize}px
                  </span>
                </div>
                <input
                  type="text"
                  value={sectionLabel}
                  onChange={(e) => setSectionLabel(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-surface mb-2"
                />
                <input
                  type="range"
                  min={10}
                  max={24}
                  step={1}
                  value={sectionLabelSize}
                  onChange={(e) => setSectionLabelSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-text-secondary">
                    العنوان الرئيسي (داخل الشريط الأزرق)
                  </label>
                  <span className="text-xs text-text-muted">
                    {sectionTitleSize}px
                  </span>
                </div>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-surface mb-2"
                />
                <input
                  type="range"
                  min={20}
                  max={56}
                  step={1}
                  value={sectionTitleSize}
                  onChange={(e) => setSectionTitleSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            {/* بريفيو حي لشكل الشريط الأزرق */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-surface py-10 px-6 text-center">
                <p
                  className="text-primary font-semibold mb-3 tracking-wide"
                  style={{ fontSize: sectionLabelSize }}
                >
                  {sectionLabel || "النص الصغير"}
                </p>
                <span
                  className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full"
                  style={{ fontSize: sectionTitleSize }}
                >
                  {sectionTitle || "العنوان"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSectionSettings}
              disabled={sectionSaving}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2.5 rounded-full font-medium transition-colors"
            >
              {sectionSaving ? "جاري الحفظ..." : "💾 حفظ عنوان السكشن"}
            </button>
          </>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-raised border border-border rounded-2xl p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              اسم المنتج
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              الفئة (تظهر فوق الكارت)
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              السعر (بالريال السعودي)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
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
          منتج مميز (يظهر في الصفحة الرئيسية)
        </label>

        {/* رفع الصور + ترتيب الألبوم */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            صور المنتج (استخدم ▲▼ لترتيب الألبوم)
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

                  <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {index + 1}
                  </div>

                  <div className="absolute top-1 left-1 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(index, "up")}
                      disabled={index === 0}
                      className="bg-black/60 text-white text-xs w-5 h-5 rounded disabled:opacity-30 hover:bg-black/80"
                      title="حرك لفوق"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, "down")}
                      disabled={index === gallery.length - 1}
                      className="bg-black/60 text-white text-xs w-5 h-5 rounded disabled:opacity-30 hover:bg-black/80"
                      title="حرك لتحت"
                    >
                      ▼
                    </button>
                  </div>

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

        {/* 📐 التحكم في مقاس الكارت وطريقة عرض الصورة */}
        <div className="border border-border rounded-xl p-4 space-y-5 bg-surface">
          <p className="text-sm font-semibold text-text-primary">
            📐 مقاس الكارت وطريقة عرض الصورة
          </p>
          <p className="text-xs text-text-muted">
            سيبهم فاضيين لو عايز المقاس التلقائي الافتراضي (زي باقي الكروت)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-text-secondary">
                  عرض الكارت (بكسل)
                </label>
                <span className="text-xs text-text-muted">
                  {form.cardWidth || "تلقائي"}
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={600}
                step={10}
                value={form.cardWidth || 320}
                onChange={(e) =>
                  setForm({ ...form, cardWidth: Number(e.target.value) })
                }
                className="w-full accent-primary"
              />
              {form.cardWidth && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cardWidth: "" })}
                  className="text-xs text-red-500 hover:underline mt-1"
                >
                  إعادة للوضع التلقائي
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-text-secondary">
                  ارتفاع صورة الغلاف (بكسل)
                </label>
                <span className="text-xs text-text-muted">
                  {form.cardHeight || "تلقائي (4:3)"}
                </span>
              </div>
              <input
                type="range"
                min={150}
                max={500}
                step={10}
                value={form.cardHeight || 240}
                onChange={(e) =>
                  setForm({ ...form, cardHeight: Number(e.target.value) })
                }
                className="w-full accent-primary"
              />
              {form.cardHeight && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cardHeight: "" })}
                  className="text-xs text-red-500 hover:underline mt-1"
                >
                  إعادة للوضع التلقائي
                </button>
              )}
            </div>
          </div>

          {/* طريقة عرض الصورة: Cover / Contain */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              طريقة عرض الصورة جوه الكارت
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, imageFit: "cover" })}
                className={`flex-1 border rounded-lg px-3 py-2 text-sm transition-colors ${
                  form.imageFit === "cover"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-text-secondary hover:bg-surface-raised"
                }`}
              >
                تعبئة كاملة (Cover)
                <span className="block text-[11px] text-text-muted mt-0.5">
                  الصورة بتملا المساحة، ممكن يتقص منها جزء
                </span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, imageFit: "contain" })}
                className={`flex-1 border rounded-lg px-3 py-2 text-sm transition-colors ${
                  form.imageFit === "contain"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-text-secondary hover:bg-surface-raised"
                }`}
              >
                احتواء كامل (Contain)
                <span className="block text-[11px] text-text-muted mt-0.5">
                  الصورة كلها بتظهر من غير قص
                </span>
              </button>
            </div>
          </div>

          {/* 🔍 محرر الزوم والموضع — شغال بس في وضع Cover */}
          {form.imageFit === "cover" &&
            mainImageIndex !== null &&
            gallery[mainImageIndex] && (
              <div className="pt-2 border-t border-border">
                <p className="text-sm font-semibold text-text-primary mb-3">
                  🔍 تكبير وتحريك صورة الغلاف
                </p>
                <ImagePositionEditor
                  src={gallery[mainImageIndex].url}
                  aspectRatio={editorAspectRatio}
                  x={form.imagePositionX}
                  y={form.imagePositionY}
                  zoom={form.imageZoom}
                  onChange={({ x, y, zoom }) =>
                    setForm((f) => ({
                      ...f,
                      imagePositionX: x,
                      imagePositionY: y,
                      imageZoom: zoom,
                    }))
                  }
                />
              </div>
            )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة المنتج"}
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

      {/* 🔍 البريفيو الحي — نسخة طبق الأصل من ProductsPreview.tsx الحقيقي */}
      {previewProduct && (
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">
            🔍 معاينة حية (نفس شكل السكشن في الصفحة الرئيسية بالظبط)
          </h2>
          <div className="border border-border rounded-2xl overflow-hidden">
            <section className="bg-surface py-16 px-6 md:px-12">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-6">
                  <p
                    className="text-primary font-semibold mb-3 tracking-wide"
                    style={{ fontSize: sectionLabelSize }}
                  >
                    {sectionLabel}
                  </p>
                  <span
                    className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full"
                    style={{ fontSize: sectionTitleSize }}
                  >
                    {sectionTitle}
                  </span>
                </div>
                <div className="flex justify-end mb-10">
                  <span className="text-primary font-medium opacity-50 cursor-not-allowed">
                    عرض الكل ←
                  </span>
                </div>
                <ProductsGrid products={[previewProduct]} />
              </div>
            </section>
          </div>
        </div>
      )}

      {/* قائمة المنتجات الحالية */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          المنتجات الحالية
        </h2>
        {loading ? (
          <p className="text-text-muted">جاري التحميل...</p>
        ) : products.length === 0 ? (
          <p className="text-text-muted">لا توجد منتجات بعد</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 bg-surface-raised border border-border rounded-xl p-3"
              >
                <Image
                  src={product.mainImage}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-text-primary">
                    {product.name}
                  </p>
                  <p className="text-sm text-text-muted">
                    {product.category} •{" "}
                    {product.price?.toLocaleString("ar-SA")} ر.س
                  </p>
                </div>
                <button
                  onClick={() => startEdit(product)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-surface"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDeleteProduct(product)}
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