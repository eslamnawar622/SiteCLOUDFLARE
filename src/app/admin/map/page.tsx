"use client";

import { useState, useEffect } from "react";
import {
  getMapData,
  updateMainOffice,
  updateLabelOverrides,
  LABEL_KEY_OPTIONS,
  addOffice,
  updateOffice,
  deleteOffice,
} from "@/lib/firestore/map";
import {
  MapData,
  MainOffice,
  Office,
  MapImage,
  MapLabelOverride,
  MapLabelKey,
} from "@/types/map";
import MapImagesManager from "@/components/admin/MapImagesManager";
import GoogleMapsLinkInput from "@/components/admin/GoogleMapsLinkInput";

async function deleteFileFromR2(key: string): Promise<void> {
  try {
    await fetch("/api/r2/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  } catch (error) {
    console.error(error);
  }
}

function confirmByTyping(message: string): boolean {
  const input = prompt(`${message}\n\nاكتب كلمة "حذف" بالظبط للتأكيد:`);
  return input === "حذف";
}

function servicesToArray(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function genLabelId(): string {
  return `label_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// ✏️ فورم نصوص الواجهة (جدول ديناميكي: إضافة/حذف حقول)
// ============================================
function LabelsForm({
  overrides,
  onSaved,
}: {
  overrides: MapLabelOverride[];
  onSaved: (o: MapLabelOverride[]) => void;
}) {
  const [rows, setRows] = useState<MapLabelOverride[]>(overrides);
  const [addingKey, setAddingKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableOptions = LABEL_KEY_OPTIONS.filter(
    (opt) => !rows.some((r) => r.key === opt.key)
  );

  function handleAddField(key: MapLabelKey) {
    const option = LABEL_KEY_OPTIONS.find((o) => o.key === key);
    if (!option) return;
    setRows([...rows, { id: genLabelId(), key, value: option.defaultValue }]);
    setAddingKey(false);
  }

  function handleRemoveField(id: string) {
    setRows(rows.filter((r) => r.id !== id));
  }

  function handleChangeValue(id: string, value: string) {
    setRows(rows.map((r) => (r.id === id ? { ...r, value } : r)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateLabelOverrides(rows);
      onSaved(rows);
      alert("تم حفظ نصوص الواجهة");
    } catch (error) {
      console.error(error);
      alert("حصل خطأ، حاول تاني");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">✏️ نصوص الواجهة</h2>
      <p className="text-text-muted text-sm">
        النصوص دي بتظهر في كارت المكتب/المقر الرئيسي جوه صفحة الخريطة بس. ضيف بس الحقول اللي عايز تغيّرها — أي حقل مش موجود هنا بيستخدم النص الافتراضي بتاعه تلقائيًا.
      </p>

      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="text-text-muted text-sm bg-surface border border-border rounded-lg p-3">
            مفيش نصوص مخصصة دلوقتي، الموقع شغال بالنصوص الافتراضية. اضغط «➕ إضافة نص» تحت عشان تبدأ.
          </p>
        )}

        {rows.map((row) => {
          const option = LABEL_KEY_OPTIONS.find((o) => o.key === row.key);
          return (
            <div key={row.id} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <label className="text-text-secondary text-xs w-full sm:w-52 flex-shrink-0">
                {option?.label || row.key}
              </label>
              <input
                type="text"
                value={row.value}
                onChange={(e) => handleChangeValue(row.id, e.target.value)}
                className="flex-1 min-w-0 px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => handleRemoveField(row.id)}
                className="text-error text-sm font-medium px-3 py-2 flex-shrink-0"
              >
                حذف
              </button>
            </div>
          );
        })}
      </div>

      {addingKey ? (
        <div className="border border-primary/30 rounded-lg p-3 space-y-2">
          <p className="text-text-secondary text-sm">اختار النص اللي عايز تخصصه:</p>
          <div className="flex flex-wrap gap-2">
            {availableOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleAddField(opt.key)}
                className="bg-surface hover:bg-border text-text-primary px-3 py-1.5 rounded-full text-sm border border-border"
              >
                {opt.label}
              </button>
            ))}
            {availableOptions.length === 0 && (
              <p className="text-text-muted text-sm">كل النصوص المتاحة مضافة بالفعل</p>
            )}
          </div>
          <button
            onClick={() => setAddingKey(false)}
            className="text-text-secondary text-sm font-medium"
          >
            إلغاء
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingKey(true)}
          className="text-primary text-sm font-medium hover:underline"
        >
          ➕ إضافة نص
        </button>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2 rounded-full font-medium transition-colors block"
      >
        {saving ? "جاري الحفظ..." : "حفظ نصوص الواجهة"}
      </button>
    </div>
  );
}

// ============================================
// 🏢 فورم المقر الرئيسي
// ============================================
function MainOfficeForm({
  mainOffice,
  onSaved,
}: {
  mainOffice: MainOffice;
  onSaved: (m: MainOffice) => void;
}) {
  const [form, setForm] = useState<MainOffice>(mainOffice);
  const [servicesText, setServicesText] = useState(mainOffice.services.join(", "));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated: MainOffice = { ...form, services: servicesToArray(servicesText) };
      await updateMainOffice(updated);
      onSaved(updated);
      alert("تم حفظ بيانات المقر الرئيسي");
    } catch (error) {
      console.error(error);
      alert("حصل خطأ، حاول تاني");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">🏢 المقر الرئيسي</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-text-secondary text-sm mb-1">الاسم</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-text-secondary text-sm mb-1">المدينة/الدولة</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <GoogleMapsLinkInput
        onExtract={(lat, lng) => setForm({ ...form, lat, lng })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-text-secondary text-sm mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-text-secondary text-sm mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-text-secondary text-sm mb-1">التليفون</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-text-secondary text-sm mb-1">رقم واتساب (اختياري)</label>
          <input
            type="text"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="مثال: 201012840793"
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-text-secondary text-sm mb-1">ساعات العمل</label>
          <input
            type="text"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-text-secondary text-sm mb-1">العنوان</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-text-secondary text-sm mb-1">
          الخدمات (افصل بينهم بفاصلة)
        </label>
        <input
          type="text"
          value={servicesText}
          onChange={(e) => setServicesText(e.target.value)}
          placeholder="مبيعات, صيانة, استشارات"
          className="w-full px-4 py-2 rounded-lg bg-surface text-text-primary border border-border focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-text-secondary text-sm mb-1">الصور</label>
        <MapImagesManager
          images={form.images}
          onChange={(images) => setForm({ ...form, images })}
          folder="الخريطة/المقر-الرئيسي"
          namePrefix={form.name || "main"}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2 rounded-full font-medium transition-colors"
      >
        {saving ? "جاري الحفظ..." : "حفظ المقر الرئيسي"}
      </button>
    </div>
  );
}

// ============================================
// 🏪 فورم مكتب (إضافة/تعديل) — مستقل، مفيش تجميع تحت منطقة
// ============================================
function OfficeForm({
  office,
  mainOffice,
  nextNumber,
  onDone,
  onCancel,
}: {
  office: Office | null;
  mainOffice: MainOffice;
  nextNumber: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [number, setNumber] = useState(office?.number ?? nextNumber);
  const [name, setName] = useState(office?.name || "");
  const [region, setRegion] = useState(office?.region || "");
  const [city, setCity] = useState(office?.city || "");
  const [lat, setLat] = useState(office?.lat ?? 0);
  const [lng, setLng] = useState(office?.lng ?? 0);
  const [phone, setPhone] = useState(office?.phone || "");
  const [whatsapp, setWhatsapp] = useState(office?.whatsapp || "");
  const [phoneSameAsMain, setPhoneSameAsMain] = useState(office?.phoneSameAsMain ?? false);
  const [whatsappSameAsMain, setWhatsappSameAsMain] = useState(office?.whatsappSameAsMain ?? false);
  const [hours, setHours] = useState(office?.hours || "");
  const [servicesText, setServicesText] = useState(office?.services.join(", ") || "");
  const [address, setAddress] = useState(office?.address || "");
  const [images, setImages] = useState<MapImage[]>(office?.images || []);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      alert("اكتب اسم المكتب");
      return;
    }
    setSaving(true);
    try {
      const data = {
        number,
        name: name.trim(),
        region: region.trim(),
        city: city.trim(),
        lat,
        lng,
        phone: phoneSameAsMain ? "" : phone.trim(),
        whatsapp: whatsappSameAsMain ? "" : whatsapp.trim(),
        phoneSameAsMain,
        whatsappSameAsMain,
        hours: hours.trim(),
        services: servicesToArray(servicesText),
        address: address.trim(),
        images,
      };
      if (office) {
        await updateOffice(office.id, data);
      } else {
        await addOffice(data);
      }
      onDone();
    } catch (error) {
      console.error(error);
      alert("حصل خطأ، حاول تاني");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface border border-primary/30 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="number"
          placeholder="الرقم"
          value={number}
          onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
          dir="ltr"
        />
        <input
          type="text"
          placeholder="اسم المكتب * (بيظهر في تلميح الخريطة)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
        />
        <input
          type="text"
          placeholder="المنطقة (مثال: الرياض)"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
        />
      </div>

      <input
        type="text"
        placeholder="المدينة"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
      />

      <GoogleMapsLinkInput
        onExtract={(newLat, newLng) => {
          setLat(newLat);
          setLng(newLng);
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
          dir="ltr"
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={lng}
          onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
          dir="ltr"
        />

        {/* التليفون + تبديل نفس المقر الرئيسي */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPhoneSameAsMain(false)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                !phoneSameAsMain
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-raised text-text-secondary border-border"
              }`}
            >
              رقم مختلف
            </button>
            <button
              type="button"
              onClick={() => setPhoneSameAsMain(true)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                phoneSameAsMain
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-raised text-text-secondary border-border"
              }`}
            >
              نفس تليفون المقر الرئيسي
            </button>
          </div>
          {phoneSameAsMain ? (
            <div className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-muted border border-border text-sm" dir="ltr">
              {mainOffice.phone || "لم يتم تحديد تليفون للمقر الرئيسي"}
            </div>
          ) : (
            <input
              type="text"
              placeholder="التليفون"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
              dir="ltr"
            />
          )}
        </div>

        {/* واتساب + تبديل نفس المقر الرئيسي */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWhatsappSameAsMain(false)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                !whatsappSameAsMain
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-raised text-text-secondary border-border"
              }`}
            >
              رقم مختلف
            </button>
            <button
              type="button"
              onClick={() => setWhatsappSameAsMain(true)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                whatsappSameAsMain
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-raised text-text-secondary border-border"
              }`}
            >
              نفس واتساب المقر الرئيسي
            </button>
          </div>
          {whatsappSameAsMain ? (
            <div className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-muted border border-border text-sm" dir="ltr">
              {mainOffice.whatsapp || "لم يتم تحديد واتساب للمقر الرئيسي"}
            </div>
          ) : (
            <input
              type="text"
              placeholder="رقم واتساب (اختياري)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
              dir="ltr"
            />
          )}
        </div>

        <input
          type="text"
          placeholder="ساعات العمل"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
        />
      </div>

      <input
        type="text"
        placeholder="العنوان"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
      />

      <input
        type="text"
        placeholder="الخدمات (افصل بينهم بفاصلة)"
        value={servicesText}
        onChange={(e) => setServicesText(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-surface-raised text-text-primary border border-border text-sm"
      />

      <MapImagesManager
        images={images}
        onChange={setImages}
        folder={`الخريطة/${region || "عام"}`}
        namePrefix={name || "office"}
      />

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-1.5 rounded-full text-sm font-medium"
        >
          {saving ? "جاري الحفظ..." : "حفظ المكتب"}
        </button>
        <button
          onClick={onCancel}
          className="bg-surface-raised hover:bg-border text-text-secondary px-4 py-1.5 rounded-full text-sm font-medium"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

// ============================================
// 🏪 قسم المكاتب: قائمة مسطحة، مرتبة بالرقم، مفيش تجميع تحت منطقة
// ============================================
function OfficesSection({
  offices,
  mainOffice,
  onRefresh,
}: {
  offices: Office[];
  mainOffice: MainOffice;
  onRefresh: () => void;
}) {
  const [addingOffice, setAddingOffice] = useState(false);
  const [editingOfficeId, setEditingOfficeId] = useState<string | null>(null);

  const sortedOffices = offices.slice().sort((a, b) => a.number - b.number);
  const nextNumber = offices.length > 0 ? Math.max(...offices.map((o) => o.number)) + 1 : 1;

  async function handleDeleteOffice(office: Office) {
    if (!confirmByTyping(`متأكد إنك عايز تمسح مكتب "${office.name}"؟`)) {
      return;
    }
    try {
      const removed = await deleteOffice(office.id);
      if (removed) {
        for (const img of removed.images) {
          await deleteFileFromR2(img.key);
        }
      }
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          🏪 المكاتب ({offices.length})
        </h2>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-4 space-y-3">
        {sortedOffices.map((office) =>
          editingOfficeId === office.id ? (
            <OfficeForm
              key={office.id}
              office={office}
              mainOffice={mainOffice}
              nextNumber={nextNumber}
              onDone={() => {
                setEditingOfficeId(null);
                onRefresh();
              }}
              onCancel={() => setEditingOfficeId(null)}
            />
          ) : (
            <div
              key={office.id}
              className="flex items-center justify-between gap-3 p-3 bg-surface rounded-lg border border-border"
            >
              <div className="min-w-0 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                  {office.number}
                </span>
                <div className="min-w-0">
                  <p className="text-text-primary text-sm font-medium truncate">
                    {office.name}{" "}
                    {office.region && (
                      <span className="text-text-muted text-xs font-normal">
                        · {office.region}
                      </span>
                    )}
                  </p>
                  <p className="text-text-muted text-xs truncate">
                    {office.address} ·{" "}
                    {office.phoneSameAsMain ? mainOffice.phone : office.phone}
                    {office.phoneSameAsMain && (
                      <span className="text-primary"> (نفس المقر الرئيسي)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditingOfficeId(office.id)}
                  className="text-primary text-xs font-medium px-2 py-1"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDeleteOffice(office)}
                  className="text-error text-xs font-medium px-2 py-1"
                >
                  حذف
                </button>
              </div>
            </div>
          )
        )}

        {addingOffice ? (
          <OfficeForm
            office={null}
            mainOffice={mainOffice}
            nextNumber={nextNumber}
            onDone={() => {
              setAddingOffice(false);
              onRefresh();
            }}
            onCancel={() => setAddingOffice(false)}
          />
        ) : (
          <button
            onClick={() => setAddingOffice(true)}
            className="text-primary text-sm font-medium hover:underline"
          >
            ➕ إضافة مكتب
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// 🌍 الصفحة الرئيسية
// ============================================
export default function AdminMapPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await getMapData();
    setMapData(data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const data = await getMapData();
      if (cancelled) return;
      setMapData(data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !mapData) {
    return <div className="p-8 text-center text-text-muted">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          إدارة الخريطة
        </h1>
        <p className="text-text-muted text-sm">
          تحكم في المقر الرئيسي، وكل المكاتب برقمها ومنطقتها، وصورهم
        </p>
      </div>

      <LabelsForm
        overrides={mapData.labelOverrides}
        onSaved={(o) => setMapData({ ...mapData, labelOverrides: o })}
      />

      <MainOfficeForm
        mainOffice={mapData.mainOffice}
        onSaved={(m) => setMapData({ ...mapData, mainOffice: m })}
      />

      <OfficesSection
        offices={mapData.offices}
        mainOffice={mapData.mainOffice}
        onRefresh={refresh}
      />
    </div>
  );
}