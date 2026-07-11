"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "@/lib/firestore/team";
import { TeamMember } from "@/types/team";
import ImageCropperModal from "@/components/admin/ImageCropperModal";

// ============================================
// 🔧 دوال R2 (نفس أسلوب صفحة العروض بالظبط)
// ============================================

async function uploadFileToR2(
  file: File | Blob,
  folder: string,
  fileName: string
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file, fileName);
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

const DEFAULT_CARD_SIZE = 220;

export default function AdminTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // بيانات الفورم
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [order, setOrder] = useState(1);
  const [cardWidth, setCardWidth] = useState(DEFAULT_CARD_SIZE);
  const [cardHeight, setCardHeight] = useState(DEFAULT_CARD_SIZE);
  const [photoFile, setPhotoFile] = useState<Blob | null>(null); // الصورة بعد القص
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ✅ صورة الكروبر
  const [rawFile, setRawFile] = useState<File | null>(null); // الصورة الخام قبل القص

  async function loadTeam(): Promise<TeamMember[]> {
    setLoading(true);
    const data = await getTeamMembers();
    setTeam(data);
    setLoading(false);
    return data;
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const data = await getTeamMembers();
      if (cancelled) return;
      setTeam(data);
      setLoading(false);
      setOrder(data.length + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setRole("");
    setBio("");
    setLinkedin("");
    setOrder(team.length + 1);
    setCardWidth(DEFAULT_CARD_SIZE);
    setCardHeight(DEFAULT_CARD_SIZE);
    setPhotoFile(null);
    setPhotoPreview(null);
    setRawFile(null);
  }

  // ✅ لما يختار ملف من جهازه — نفتح الكروبر بدل ما نستخدمه على طول
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file) setRawFile(file);
    e.target.value = ""; // عشان لو اختار نفس الملف تاني يفتح الكروبر برضو
  }

  // ✅ بعد ما يأكد القص جوه الكروبر
  function handleCropConfirm(blob: Blob, previewUrl: string) {
    setPhotoFile(blob);
    setPhotoPreview(previewUrl);
    setRawFile(null);
  }

  function startEdit(member: TeamMember) {
    setEditingId(member.id);
    setName(member.name);
    setRole(member.role);
    setBio(member.bio || "");
    setLinkedin(member.linkedin || "");
    setOrder(member.order);
    setCardWidth(member.cardWidth || DEFAULT_CARD_SIZE);
    setCardHeight(member.cardHeight || DEFAULT_CARD_SIZE);
    setPhotoFile(null);
    setPhotoPreview(member.photo || null);
    setRawFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    if (!name.trim()) {
      alert("اكتب اسم الموظف");
      return;
    }
    if (!role.trim()) {
      alert("اكتب المهنة/المسمى الوظيفي");
      return;
    }
    if (!editingId && !photoFile) {
      alert("اختار صورة للموظف واضبطها في الكروبر");
      return;
    }

    setSaving(true);
    try {
      let photo: string | undefined;
      let photoKey: string | undefined;

      if (photoFile) {
        const uploaded = await uploadFileToR2(
          photoFile,
          "الفريق",
          `${Date.now()}-${name.trim().replace(/\s+/g, "_")}.jpg`
        );
        photo = uploaded.url;
        photoKey = uploaded.key;
      }

      if (editingId) {
        const existing = team.find((m) => m.id === editingId);

        const updateData: Partial<{
          name: string;
          role: string;
          bio: string;
          linkedin: string;
          order: number;
          cardWidth: number;
          cardHeight: number;
          photo: string;
          photoKey: string;
        }> = {
          name: name.trim(),
          role: role.trim(),
          bio: bio.trim(),
          linkedin: linkedin.trim(),
          order,
          cardWidth,
          cardHeight,
        };

        if (photo) {
          updateData.photo = photo;
          updateData.photoKey = photoKey;
          if (existing?.photoKey) {
            await deleteFileFromR2(existing.photoKey);
          }
        }

        await updateTeamMember(editingId, updateData);
      } else {
        await addTeamMember({
          name: name.trim(),
          role: role.trim(),
          bio: bio.trim(),
          linkedin: linkedin.trim(),
          order,
          cardWidth,
          cardHeight,
          photo: photo!,
          photoKey,
        });
      }

      resetForm();
      await loadTeam();
    } catch (error) {
      console.error(error);
      alert("حصل خطأ، حاول تاني");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member: TeamMember) {
    if (!confirmByTyping(`متأكد إنك عايز تمسح "${member.name}" نهائيًا؟`)) {
      return;
    }

    setDeletingId(member.id);
    try {
      if (member.photoKey) {
        await deleteFileFromR2(member.photoKey);
      }
      await deleteTeamMember(member.id);
      await loadTeam();
    } catch (error) {
      console.error(error);
      alert("فشل الحذف");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        إدارة الفريق
      </h1>
      <p className="text-text-muted text-sm mb-8">
        الاسم والمهنة إجباريين. تقدر تتحكم في زوم وموقع الصورة، وفي مقاس
        الكارد نفسه، وتشوف شكله فورًا في المعاينة
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* الفورم */}
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {editingId ? "✏️ تعديل عضو" : "➕ إضافة عضو جديد"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">
                الاسم *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                المهنة / المسمى الوظيفي *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="مثال: مهندس معماري"
                className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              نبذة / تفاصيل إضافية (اختياري)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="أي تفاصيل حابب تضيفها عن خبرة الموظف..."
              className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">
                لينك (لينكدان أو أي لينك تاني) — اختياري
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
                dir="ltr"
              />
            </div>

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
          </div>

          {/* ✅ مقاس الكارد */}
          <div className="p-4 bg-surface rounded-lg border border-border space-y-3">
            <p className="text-text-secondary text-sm font-medium">
              📏 مقاس صورة الكارد (بالبكسل)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-muted text-xs mb-1">
                  العرض: {cardWidth}px
                </label>
                <input
                  type="range"
                  min={120}
                  max={400}
                  step={10}
                  value={cardWidth}
                  onChange={(e) => setCardWidth(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <label className="block text-text-muted text-xs mb-1">
                  الطول: {cardHeight}px
                </label>
                <input
                  type="range"
                  min={120}
                  max={400}
                  step={10}
                  value={cardHeight}
                  onChange={(e) => setCardHeight(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCardWidth(DEFAULT_CARD_SIZE);
                setCardHeight(DEFAULT_CARD_SIZE);
              }}
              className="text-primary text-xs hover:underline"
            >
              رجّع المقاس الافتراضي (مربع 220×220)
            </button>
          </div>

          {/* رفع الصورة */}
          <div>
            <label className="block text-text-secondary text-sm mb-1">
              الصورة {editingId && "(اختياري لو مش عايز تغيّرها)"}
            </label>
            <p className="text-text-muted text-xs mb-2">
              📐 بعد اختيار الصورة هتقدر تكبّرها/تصغّرها وتحركها داخل إطار
              بنفس نسبة الكارد اللي اخترتها فوق
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full text-text-secondary text-sm mb-3"
            />

            {photoPreview && (
              <div className="flex items-center gap-3">
                <div
                  className="relative bg-surface overflow-hidden border-2 border-primary/30"
                  style={{
                    width: 100,
                    height: (100 * cardHeight) / cardWidth,
                    borderRadius: cardWidth === cardHeight ? "9999px" : "16px",
                  }}
                >
                  <Image
                    src={photoPreview}
                    alt="معاينة الصورة"
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
                {editingId && (
                  <p className="text-text-muted text-xs">
                    الصورة الحالية. اختار ملف جديد لو عايز تغيّرها
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
              {saving
                ? "جاري الحفظ..."
                : editingId
                ? "حفظ التعديل"
                : "إضافة الموظف"}
            </button>

            {editingId && (
              <button
                onClick={resetForm}
                className="bg-surface hover:bg-border text-text-secondary px-6 py-2 rounded-full font-medium transition-colors"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>

        {/* ✅ Preview حي — نفس شكل الكارد في الموقع بالظبط */}
        <div className="lg:sticky lg:top-6">
          <p className="text-text-secondary text-sm font-medium mb-3 text-center">
            👁️ المعاينة — كده هيبان في الموقع
          </p>
          <div className="bg-background border border-border rounded-xl p-6 flex justify-center">
            <div className="text-center group max-w-[220px]">
              <div
                className="relative mx-auto overflow-hidden mb-4 ring-2 ring-border-subtle bg-surface"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  borderRadius: cardWidth === cardHeight ? "9999px" : "24px",
                }}
              >
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt={name || "معاينة"}
                    fill
                    className="object-cover"
                    sizes={`${cardWidth}px`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                    مفيش صورة
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                {name || "اسم الموظف"}
              </h3>
              <p className="text-primary text-sm mb-2">
                {role || "المهنة"}
              </p>
              {bio && (
                <p className="text-text-muted text-sm leading-relaxed mb-3 px-2">
                  {bio}
                </p>
              )}
              {linkedin && (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-lighter text-text-secondary">
                  🔗
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* قائمة الفريق */}
      <div className="bg-surface-raised border border-border rounded-xl overflow-hidden mt-10">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            أعضاء الفريق الحاليين ({team.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">
            جاري التحميل...
          </div>
        ) : team.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            مفيش أعضاء فريق لسه
          </div>
        ) : (
          <div className="divide-y divide-border">
            {team.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4">
                <div
                  className="relative flex-shrink-0 overflow-hidden border border-border bg-surface"
                  style={{
                    width: 64,
                    height:
                      (64 * (member.cardHeight || 220)) /
                      (member.cardWidth || 220),
                    borderRadius:
                      (member.cardWidth || 220) === (member.cardHeight || 220)
                        ? "9999px"
                        : "12px",
                  }}
                >
                  {member.photo && (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium truncate">
                    {member.name}
                  </p>
                  <p className="text-primary text-sm">{member.role}</p>
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted text-xs hover:underline"
                      dir="ltr"
                    >
                      🔗 {member.linkedin}
                    </a>
                  )}
                  <p className="text-text-muted text-xs mt-0.5">
                    الترتيب: {member.order} · مقاس الكارد:{" "}
                    {member.cardWidth || 220}×{member.cardHeight || 220}
                  </p>
                </div>

                <button
                  onClick={() => startEdit(member)}
                  className="text-primary hover:text-primary-dark text-sm font-medium px-3 py-1.5 flex-shrink-0"
                >
                  تعديل
                </button>

                <button
                  onClick={() => handleDelete(member)}
                  disabled={deletingId === member.id}
                  className="text-error hover:opacity-80 disabled:opacity-50 text-sm font-medium px-3 py-1.5 flex-shrink-0"
                >
                  {deletingId === member.id ? "جاري..." : "حذف"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ الكروبر — بيفتح لما يختار صورة */}
      {/* الـ key بيضمن remount كامل (زوم وموقع نضيفين) كل ما يختار صورة جديدة */}
      {rawFile && (
        <ImageCropperModal
          key={`${rawFile.name}-${rawFile.size}-${rawFile.lastModified}`}
          file={rawFile}
          aspectWidth={cardWidth}
          aspectHeight={cardHeight}
          onConfirm={handleCropConfirm}
          onCancel={() => setRawFile(null)}
        />
      )}
    </div>
  );
}