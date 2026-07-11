"use client";

import { useState, useEffect } from "react";
import {
  subscribeToCurrentOffer,
  subscribeToArchivedOffers,
  addCurrentOffer,
  addArchivedOffer,
  archiveOffer,
  setOfferAsCurrent,
  updateOffer,
  deleteOffer,
} from "@/lib/firestore/offers";
import { Offer } from "@/types/offer";

// ============================================
// 🔧 دوال R2
// ============================================

async function uploadFileToR2(
  file: File,
  folder: string
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/r2/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("فشل رفع الملف");
  return response.json();
}

async function deleteFileFromR2(key: string): Promise<boolean> {
  try {
    const response = await fetch("/api/r2/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function confirmByTyping(message: string): boolean {
  const input = prompt(`${message}\n\nاكتب كلمة "حذف" بالظبط للتأكيد:`);
  return input === "حذف";
}

function getR2DashboardUrl(key: string): string {
  const accountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID!;
  const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME!;
  const encodedKey = encodeURIComponent(key);
  return `https://dash.cloudflare.com/${accountId}/r2/default/buckets/${bucketName}/objects/${encodedKey}`;
}

export default function AdminOffersPage() {
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [archivedOffers, setArchivedOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // ============ فورم إضافة/تعديل العرض الحالي ============
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [badgeText, setBadgeText] = useState("عرض حالي");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [endingOffer, setEndingOffer] = useState(false);
  const [deletingCurrentId, setDeletingCurrentId] = useState(false);

  // ============ فورم إضافة عرض مباشرة للأرشيف ============
  const [archTitle, setArchTitle] = useState("");
  const [archDescription, setArchDescription] = useState("");
  const [archDisplayDate, setArchDisplayDate] = useState("");
  const [archCardHeight, setArchCardHeight] = useState(224); // ✅ ارتفاع البطاقة
  const [archCardCols, setArchCardCols] = useState(3);       // ✅ عدد الأعمدة
  const [archImageFile, setArchImageFile] = useState<File | null>(null);
  const [archImagePreview, setArchImagePreview] = useState<string | null>(null);
  const [savingArchive, setSavingArchive] = useState(false);

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubCurrent = subscribeToCurrentOffer((offer) => {
      setCurrentOffer(offer);
      setLoading(false);
    });
    const unsubArchived = subscribeToArchivedOffers(setArchivedOffers);
    return () => {
      unsubCurrent();
      unsubArchived();
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setBadgeText("عرض حالي");
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
  }

  function resetArchiveForm() {
    setArchTitle("");
    setArchDescription("");
    setArchDisplayDate("");
    setArchCardHeight(224); // ✅
    setArchCardCols(3);     // ✅
    setArchImageFile(null);
    setArchImagePreview(null);
  }

  function startEdit(offer: Offer) {
    setEditingId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description);
    setBadgeText(offer.badgeText || "عرض حالي");
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
    setVideoPreview(file ? URL.createObjectURL(file) : null);
  }

  // ============ حفظ (إضافة جديد أو تعديل موجود) ============
  async function handleSaveOffer() {
    if (!title.trim()) {
      alert("اكتب عنوان العرض");
      return;
    }
    if (!editingId && !imageFile && !videoFile) {
      alert("اختار صورة أو فيديو للعرض على الأقل");
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | undefined;
      let imageKey: string | undefined;
      let videoUrl: string | undefined;
      let videoKey: string | undefined;

      if (imageFile) {
        const uploaded = await uploadFileToR2(imageFile, "عروض/العروض-الحالية");
        imageUrl = uploaded.url;
        imageKey = uploaded.key;
      }
      if (videoFile) {
        const uploaded = await uploadFileToR2(videoFile, "عروض/العروض-الحالية");
        videoUrl = uploaded.url;
        videoKey = uploaded.key;
      }

      if (editingId) {
        const updateData: Record<string, string | boolean | undefined | number> = {
          title: title.trim(),
          description: description.trim(),
          badgeText: badgeText.trim() || "عرض حالي",
        };
        if (imageUrl) updateData.imageUrl = imageUrl;
        if (imageKey) updateData.imageKey = imageKey;
        if (videoUrl) updateData.videoUrl = videoUrl;
        if (videoKey) updateData.videoKey = videoKey;

        await updateOffer(editingId, updateData);
      } else {
        if (currentOffer) {
          await archiveOffer(currentOffer.id);
        }
        await addCurrentOffer({
          title: title.trim(),
          description: description.trim(),
          badgeText: badgeText.trim() || "عرض حالي",
          imageUrl,
          imageKey,
          videoUrl,
          videoKey,
        });
      }

      resetForm();
    } catch (error) {
      console.error(error);
      alert("فشل حفظ العرض");
    } finally {
      setSaving(false);
    }
  }

  // ============ نقل العرض الحالي للأرشيف ============
  async function handleEndCurrentOffer() {
    if (!currentOffer) return;
    const confirmed = confirm("متأكد إنك عايز تنقل العرض الحالي للأرشيف؟");
    if (!confirmed) return;

    setEndingOffer(true);
    try {
      await archiveOffer(currentOffer.id);
    } catch (error) {
      console.error(error);
      alert("فشل نقل العرض للأرشيف");
    } finally {
      setEndingOffer(false);
    }
  }

  // ============ حذف العرض الحالي نهائيًا ============
  async function handleDeleteCurrentOffer() {
    if (!currentOffer) return;
    if (!confirmByTyping(`متأكد إنك عايز تمسح "${currentOffer.title}" نهائيًا؟ الحذف ده مالوش رجعة!`)) {
      return;
    }

    setDeletingCurrentId(true);
    try {
      if (currentOffer.imageKey) await deleteFileFromR2(currentOffer.imageKey);
      if (currentOffer.videoKey) await deleteFileFromR2(currentOffer.videoKey);
      await deleteOffer(currentOffer.id);
    } catch (error) {
      console.error(error);
      alert("فشل حذف العرض");
    } finally {
      setDeletingCurrentId(false);
    }
  }

  // ============ إضافة عرض مباشرة للأرشيف ============
  async function handleAddArchivedOffer() {
    if (!archTitle.trim()) {
      alert("اكتب عنوان العرض");
      return;
    }
    if (!archImageFile) {
      alert("اختار صورة العرض");
      return;
    }

    setSavingArchive(true);
    try {
      const { url: imageUrl, key: imageKey } = await uploadFileToR2(
        archImageFile,
        "عروض/العروض-السابقة"
      );

      await addArchivedOffer({
        title: archTitle.trim(),
        description: archDescription.trim(),
        imageUrl,
        imageKey,
        displayDate: archDisplayDate.trim() || undefined,
        cardHeight: archCardHeight, // ✅
        cardCols: archCardCols,     // ✅
      });

      resetArchiveForm();
    } catch (error) {
      console.error(error);
      alert("فشل إضافة العرض للأرشيف");
    } finally {
      setSavingArchive(false);
    }
  }

  function handleArchImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setArchImageFile(file);
    setArchImagePreview(file ? URL.createObjectURL(file) : null);
  }

  // ============ استرجاع عرض من الأرشيف ============
  async function handleRestore(offer: Offer) {
    const confirmed = confirm(
      `متأكد إنك عايز ترجّع "${offer.title}" يبقى العرض الحالي؟ لو فيه عرض حالي دلوقتي هيتنقل هو للأرشيف بدله.`
    );
    if (!confirmed) return;

    setRestoringId(offer.id);
    try {
      if (currentOffer) {
        await archiveOffer(currentOffer.id);
      }
      await setOfferAsCurrent(offer.id);
    } catch (error) {
      console.error(error);
      alert("فشل استرجاع العرض");
    } finally {
      setRestoringId(null);
    }
  }

  // ============ حذف عرض من الأرشيف نهائيًا ============
  async function handleDeleteArchived(offer: Offer) {
    if (!confirmByTyping(`متأكد إنك عايز تمسح "${offer.title}" نهائيًا؟`)) {
      return;
    }

    setDeletingId(offer.id);
    try {
      if (offer.imageKey) await deleteFileFromR2(offer.imageKey);
      if (offer.videoKey) await deleteFileFromR2(offer.videoKey);
      await deleteOffer(offer.id);
    } catch (error) {
      console.error(error);
      alert("فشل حذف العرض");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        إدارة العروض
      </h1>
      <p className="text-text-muted text-sm mb-8">
        العرض الجديد بيبقى «العرض الحالي»، والقديم بيتنقل تلقائي للأرشيف تحته
      </p>

      {loading ? (
        <p className="text-text-muted">جاري التحميل...</p>
      ) : (
        <div className="space-y-10">
          {/* ============ العرض الحالي ============ */}
          <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              🎯 العرض الحالي
            </h2>

            {currentOffer && (
              <div className="p-3 bg-surface rounded-lg border border-border space-y-3">
                <div className="flex items-center gap-4">
                  {currentOffer.videoUrl ? (
                    <video
                      src={currentOffer.videoUrl}
                      className="w-20 h-20 object-cover rounded-lg"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentOffer.imageUrl}
                      alt={currentOffer.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {currentOffer.title}
                    </p>
                    <p className="text-xs text-text-muted">العرض الحالي دلوقتي</p>

                    {/* ✅ تعديل نص الشريط السريع */}
                    <div className="mt-2">
                      <input
                        type="text"
                        value={currentOffer.badgeText || "عرض حالي"}
                        onChange={(e) => {
                          const updated = { ...currentOffer, badgeText: e.target.value };
                          setCurrentOffer(updated);
                        }}
                        onBlur={async (e) => {
                          const newText = e.target.value.trim() || "عرض حالي";
                          if (newText !== currentOffer.badgeText) {
                            try {
                              await updateOffer(currentOffer.id, { badgeText: newText });
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        placeholder="نص الشريط الأزرق"
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs"
                      />
                    </div>

                    {/* ✅ لينكات الوصول للملف على R2 */}
                    <div className="flex flex-col gap-0.5 mt-1">
                      {(currentOffer.videoUrl || currentOffer.imageUrl) && (
                        <a
                          href={currentOffer.videoUrl || currentOffer.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline"
                        >
                          🔗 فتح الملف مباشرة
                        </a>
                      )}
                      {(currentOffer.videoKey || currentOffer.imageKey) && (
                        <a
                          href={getR2DashboardUrl(currentOffer.videoKey || currentOffer.imageKey || "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-text-secondary hover:underline"
                        >
                          📍 فتح في Cloudflare Dashboard
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => currentOffer && startEdit(currentOffer)}
                    className="text-primary border border-primary/30 hover:bg-primary/10 px-3 py-2 rounded-full text-xs font-medium transition-colors"
                  >
                    ✏️ تعديل
                  </button>
                  <button
                    onClick={handleEndCurrentOffer}
                    disabled={endingOffer}
                    className="text-text-secondary border border-border hover:bg-surface disabled:opacity-50 px-3 py-2 rounded-full text-xs font-medium transition-colors"
                  >
                    {endingOffer ? "جاري..." : "📦 نقل للأرشيف"}
                  </button>
                  <button
                    onClick={handleDeleteCurrentOffer}
                    disabled={deletingCurrentId}
                    className="text-error border border-error/30 hover:bg-error/10 disabled:opacity-50 px-3 py-2 rounded-full text-xs font-medium transition-colors"
                  >
                    {deletingCurrentId ? "جاري..." : "🗑️ حذف نهائي"}
                  </button>
                </div>
              </div>
            )}

            {!currentOffer && !editingId && (
              <p className="text-text-muted text-xs p-3 bg-surface rounded-lg border border-border">
                مفيش عرض حالي دلوقتي — الموقع مش هيعرض قسم «العرض الحالي» لحد ما تضيف واحد
              </p>
            )}

            <div className="pt-2 border-t border-border space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">
                {editingId ? "✏️ تعديل العرض" : "➕ إضافة عرض جديد"}
              </h3>

              <input
                type="text"
                placeholder="عنوان العرض (مثال: خصم 20% بمناسبة افتتاح مكتب الرياض)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
              />

              <textarea
                placeholder="وصف العرض (اختياري)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm resize-none"
              />

              {/* ✅ نص الشريط في الفورم */}
              <input
                type="text"
                placeholder="نص الشريط الأزرق (مثال: عرض حالي · خصم 20% · جديد)"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
              />

              <div>
                <label className="block text-text-secondary text-xs mb-1">
                  📷 صورة {editingId ? "(اختياري - اتركه فاضي لو مش عايز تغيّر)" : ""}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-text-secondary text-sm"
                />
              </div>

              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="معاينة"
                  className="w-full max-w-[200px] rounded-lg border border-primary aspect-square object-cover"
                />
              )}

              <div>
                <label className="block text-text-secondary text-xs mb-1">
                  🎬 فيديو {editingId ? "(اختياري - اتركه فاضي لو مش عايز تغيّر)" : "(اختياري بدل الصورة أو معاها)"}
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="w-full text-text-secondary text-sm"
                />
              </div>

              {videoPreview && (
                <video
                  src={videoPreview}
                  className="w-full max-w-[300px] rounded-lg border border-primary aspect-video object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveOffer}
                  disabled={saving || !title.trim()}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
                >
                  {saving
                    ? "جاري الحفظ..."
                    : editingId
                    ? "حفظ التعديلات"
                    : "حفظ كعرض حالي"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 rounded-full text-sm border border-border text-text-secondary hover:bg-surface transition-colors"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ============ الأرشيف ============ */}
          <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              🗄️ العروض السابقة (الأرشيف)
            </h2>

            {archivedOffers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedOffers.map((offer) => (
                  <div key={offer.id} className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="w-full object-cover rounded-lg border border-border"
                      style={{ height: `${offer.cardHeight || 224}px` }}
                    />
                    <p className="text-xs text-text-secondary truncate">
                      {offer.title}
                    </p>

                    {/* ✅ التاريخ + checkbox إظهار/إخفاء */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={offer.showDate !== false}
                        onChange={async (e) => {
                          try {
                            await updateOffer(offer.id, { showDate: e.target.checked });
                            const updated = { ...offer, showDate: e.target.checked };
                            setArchivedOffers(prev => prev.map(o => o.id === offer.id ? updated : o));
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="accent-primary w-3 h-3"
                      />
                      <span className="text-[10px] text-text-muted">عرض التاريخ</span>
                    </div>

                    <input
                      type="text"
                      value={offer.displayDate || ""}
                      onChange={(e) => {
                        const updated = { ...offer, displayDate: e.target.value };
                        setArchivedOffers(prev => prev.map(o => o.id === offer.id ? updated : o));
                      }}
                      onBlur={async (e) => {
                        try {
                          await updateOffer(offer.id, { displayDate: e.target.value.trim() || undefined });
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      placeholder="تاريخ العرض (مثال: ٨ يوليو ٢٠٢٦)"
                      className="w-full px-2 py-1 rounded border border-border bg-surface text-text-primary text-[10px]"
                    />

                    {/* ✅ تحكم الارتفاع */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted">الطول:</span>
                      <input
                        type="range"
                        min="120"
                        max="400"
                        step="10"
                        value={offer.cardHeight || 224}
                        onChange={(e) => {
                          const height = parseInt(e.target.value);
                          const updated = { ...offer, cardHeight: height };
                          setArchivedOffers(prev => prev.map(o => o.id === offer.id ? updated : o));
                        }}
                        onBlur={async (e) => {
                          try {
                            await updateOffer(offer.id, { cardHeight: parseInt(e.target.value) });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="w-full accent-primary h-1"
                      />
                      <span className="text-[10px] text-text-muted w-8">{offer.cardHeight || 224}px</span>
                    </div>

                    {/* ✅ تحكم عدد الأعمدة */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted">العرض:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((cols) => (
                          <button
                            key={cols}
                            onClick={async () => {
                              try {
                                await updateOffer(offer.id, { cardCols: cols });
                                const updated = { ...offer, cardCols: cols };
                                setArchivedOffers(prev => prev.map(o => o.id === offer.id ? updated : o));
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${(offer.cardCols || 3) === cols ? "bg-primary text-white" : "bg-surface border border-border text-text-secondary hover:bg-border"}`}
                          >
                            {cols === 1 ? "عمود" : cols === 2 ? "عمودين" : "3"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ✅ لينكات الوصول للملف على R2 */}
                    <div className="flex flex-col gap-0.5">
                      {(offer.videoUrl || offer.imageUrl) && (
                        <a
                          href={offer.videoUrl || offer.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline truncate"
                        >
                          🔗 فتح الملف
                        </a>
                      )}
                      {(offer.videoKey || offer.imageKey) && (
                        <a
                          href={getR2DashboardUrl(offer.videoKey || offer.imageKey || "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-text-secondary hover:underline truncate"
                        >
                          📍 Cloudflare
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => startEdit(offer)}
                        className="text-primary border border-primary/30 hover:bg-primary/10 px-1 py-1 rounded-full text-[10px] font-medium transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleRestore(offer)}
                        disabled={restoringId === offer.id}
                        className="text-success border border-success/30 hover:bg-success/10 disabled:opacity-50 px-1 py-1 rounded-full text-[10px] font-medium transition-colors"
                      >
                        {restoringId === offer.id ? "..." : "🔄"}
                      </button>
                      <button
                        onClick={() => handleDeleteArchived(offer)}
                        disabled={deletingId === offer.id}
                        className="text-error border border-error/30 hover:bg-error/10 disabled:opacity-50 px-1 py-1 rounded-full text-[10px] font-medium transition-colors"
                      >
                        {deletingId === offer.id ? "..." : "🗑️"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-xs">مفيش عروض سابقة في الأرشيف</p>
            )}

            {/* ============ إضافة عرض مباشرة للأرشيف ============ */}
            <div className="pt-4 border-t border-border space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">
                ➕ إضافة عرض قديم مباشرة للأرشيف
              </h3>
              <p className="text-xs text-text-muted">
                مفيدة لو عايز تسجّل عرض قديم كان قبل ما تبدأ تستخدم النظام ده، من غير ما يمر بـ«العرض الحالي»
              </p>

              <input
                type="text"
                placeholder="عنوان العرض"
                value={archTitle}
                onChange={(e) => setArchTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
              />

              <textarea
                placeholder="وصف العرض (اختياري)"
                value={archDescription}
                onChange={(e) => setArchDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm resize-none"
              />

              {/* ✅ تاريخ العرض */}
              <input
                type="text"
                placeholder="تاريخ العرض (مثال: ٨ يوليو ٢٠٢٦) — اختياري"
                value={archDisplayDate}
                onChange={(e) => setArchDisplayDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm"
              />

              {/* ✅ ارتفاع البطاقة */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">الطول:</span>
                <input
                  type="range"
                  min="120"
                  max="400"
                  step="10"
                  value={archCardHeight}
                  onChange={(e) => setArchCardHeight(parseInt(e.target.value))}
                  className="flex-1 accent-primary h-1"
                />
                <span className="text-xs text-text-muted w-10">{archCardHeight}px</span>
              </div>

              {/* ✅ عدد الأعمدة */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">العرض:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => setArchCardCols(cols)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${archCardCols === cols ? "bg-primary text-white" : "bg-surface border border-border text-text-secondary hover:bg-border"}`}
                    >
                      {cols === 1 ? "عمود" : cols === 2 ? "عمودين" : "3 أعمدة"}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleArchImageFileChange}
                className="w-full text-text-secondary text-sm"
              />

              {archImagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={archImagePreview}
                  alt="معاينة"
                  className="w-full max-w-[150px] rounded-lg border border-primary aspect-square object-cover"
                />
              )}

              <button
                onClick={handleAddArchivedOffer}
                disabled={savingArchive || !archTitle.trim() || !archImageFile}
                className="w-full bg-surface hover:bg-border disabled:opacity-50 text-text-primary border border-border px-6 py-2 rounded-full text-sm font-medium transition-colors"
              >
                {savingArchive ? "جاري الإضافة..." : "إضافة للأرشيف مباشرة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}