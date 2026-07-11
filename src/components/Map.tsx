"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { getMapData, resolveLabels } from "@/lib/firestore/map";
import { MainOffice, Office, MapLabelText } from "@/types/map";

// ─── Colors (Axis Identity) ───
const COLORS = {
  primary: "#4a62d6",
  primaryDark: "#3a4fb0",
  primaryLight: "#eef1fc",
  muted: "#94a3b8",
};

// ─── Axis Logo SVG (حرف A) ───
const axisLogoSVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L2 22H6.5L8.5 17H15.5L17.5 22H22L12 2ZM10 13L12 8L14 13H10Z" fill="white"/>
</svg>
`;

// ─── دبوس موحّد لكل الفروع وللمقر الرئيسي، بنفس الحجم والشكل ───
// number = null للمقر الرئيسي (مفيش بادچ رقم عليه)
const createOfficeIcon = (number: number | null) => L.divIcon({
  className: "custom-office-icon",
  html: `<div class="axis-pin axis-pin-office">
    <div class="axis-pin-inner">${axisLogoSVG}</div>
    ${number !== null ? `<span class="axis-pin-count">${number}</span>` : ""}
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function FlyToLocation({ position, zoom, trigger }: { position: [number, number]; zoom: number; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, zoom, { duration: 1.5 });
  }, [position, zoom, trigger, map]);
  return null;
}

// ─── هيلبر: مشاركة موقع فرع (Web Share API مع fallback للنسخ) ───
async function shareOfficeLocation(name: string, lat: number, lng: number) {
  const url = `https://www.google.com/maps?q=${lat},${lng}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: name, text: name, url });
      return;
    } catch {
      // المستخدم لغى المشاركة أو حصل خطأ، هنكمل على fallback النسخ
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    alert("تم نسخ رابط الموقع 📋");
  } else {
    window.open(url, "_blank");
  }
}

// ─── هيلبر: بناء لينك واتساب ───
function buildWhatsappLink(number: string, message: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// ─── Sidebar: تفاصيل مكتب واحد (أو المقر الرئيسي) ───
function OfficeSidebar({
  office,
  isMain,
  labels,
  onClose,
}: {
  office: Office | MainOffice;
  isMain: boolean;
  labels: MapLabelText;
  onClose: () => void;
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ background: isMain ? COLORS.primaryDark : COLORS.primary }}>
        <div className="sidebar-header-buttons">
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <span className="sidebar-badge">{isMain ? labels.mainOfficeBadge : labels.branchBadge}</span>
      </div>

      <div className="sidebar-content">
        {office.images.length > 0 && (
          <div className="image-gallery">
            {office.images.map((img, idx) => (
              <div key={img.key} className="gallery-item">
                <Image
                  src={img.url}
                  alt={`صورة ${idx + 1} - ${office.name}`}
                  width={100}
                  height={100}
                  className="gallery-image"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        )}

        <h2 className="office-name">{office.name}</h2>
        <p className="office-city">{office.city}</p>

        <div className="info-cards">
          {!isMain && (office as Office).region && (
            <div className="info-card">
              <span className="info-icon">🗺️</span>
              <div>
                <h4>{labels.regionLabel}</h4>
                <p>{(office as Office).region}</p>
              </div>
            </div>
          )}

          <div className="info-card">
            <span className="info-icon">📍</span>
            <div>
              <h4>{labels.addressLabel}</h4>
              <p>{office.address}</p>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">📞</span>
            <div>
              <h4>{labels.phoneLabel}</h4>
              <p className="phone">{office.phone}</p>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">🕐</span>
            <div>
              <h4>{labels.hoursLabel}</h4>
              <p>{office.hours}</p>
            </div>
          </div>
        </div>

        <div className="services-section">
          <h3>{labels.servicesTitle}</h3>
          <div className="services-tags">
            {office.services.map((s) => (
              <span key={s} className="service-tag">{s}</span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {office.phone && (
            <a href={`tel:${office.phone}`} className="btn-call">
              {labels.callButtonText}
            </a>
          )}

          {office.whatsapp && (
            <a
              href={buildWhatsappLink(office.whatsapp, labels.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              {labels.whatsappButtonText}
            </a>
          )}

          <button
            className="btn-share"
            onClick={() => shareOfficeLocation(office.name, office.lat, office.lng)}
          >
            {labels.shareButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptySidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-empty">
        <span className="empty-icon">🗺️</span>
        <h3>اختر مكتب من الخريطة</h3>
        <p>اضغط على أي دبوس لعرض تفاصيل المكتب</p>
      </div>
    </div>
  );
}

function MapLoading() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center">
        <p className="text-4xl mb-3 animate-bounce">🗺️</p>
        <p className="text-lg text-text-secondary">جاري تحميل الخريطة...</p>
      </div>
    </div>
  );
}

export default function MyMap() {
  const [mainOffice, setMainOffice] = useState<MainOffice | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [labels, setLabels] = useState<MapLabelText | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedOffice, setSelectedOffice] = useState<Office | MainOffice | null>(null);
  const [selectedIsMain, setSelectedIsMain] = useState(false);
  const [flyTo, setFlyTo] = useState<{ position: [number, number]; zoom: number } | null>(null);
  const [flyTrigger, setFlyTrigger] = useState(0);

  useEffect(() => {
    (async () => {
      const data = await getMapData();
      setMainOffice(data.mainOffice);
      setOffices(data.offices);
      setLabels(resolveLabels(data.labelOverrides));
      setLoading(false);
    })();
  }, []);

  // ─── حل أرقام المكاتب: لو office.phoneSameAsMain / whatsappSameAsMain
  // بتاخد الرقم من المقر الرئيسي تلقائيًا. الباقي من الكود بيقرأ office.phone/whatsapp عادي. ───
  const resolvedOffices = useMemo(() => {
    if (!mainOffice) return offices;
    return offices.map((office) => ({
      ...office,
      phone: office.phoneSameAsMain ? mainOffice.phone : office.phone,
      whatsapp: office.whatsappSameAsMain ? mainOffice.whatsapp : office.whatsapp,
    }));
  }, [offices, mainOffice]);

  // ترتيب المكاتب حسب الرقم اليدوي المُدخل من الأدمن
  const sortedOffices = useMemo(
    () => [...resolvedOffices].sort((a, b) => a.number - b.number),
    [resolvedOffices]
  );

  const totalOffices = sortedOffices.length;

  const triggerFlyTo = (position: [number, number], zoom: number) => {
    setFlyTo({ position, zoom });
    setFlyTrigger((prev) => prev + 1);
  };

  const handleOfficeClick = (office: Office) => {
    setSelectedOffice(office);
    setSelectedIsMain(false);
    triggerFlyTo([office.lat, office.lng], 14);
  };

  const handleMainOfficeClick = () => {
    if (!mainOffice) return;
    setSelectedOffice(mainOffice);
    setSelectedIsMain(true);
    triggerFlyTo([mainOffice.lat, mainOffice.lng], 14);
  };

  const handleCloseSidebar = () => {
    setSelectedOffice(null);
  };

  const renderSidebar = () => {
    if (selectedOffice && labels) {
      return (
        <OfficeSidebar
          office={selectedOffice}
          isMain={selectedIsMain}
          labels={labels}
          onClose={handleCloseSidebar}
        />
      );
    }
    return <EmptySidebar />;
  };

  if (loading || !mainOffice || !labels) {
    return (
      <div className="map-page">
        <MapLoading />
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>🌍 فروعنا في الوطن العربي</h1>
        <p>
          <span className="stat">🏢 المقر الرئيسي: {mainOffice.city}</span>
          <span className="stat">📍 {totalOffices} فرع</span>
        </p>
      </div>

      <div className="map-layout">
        <div className="content-area">
          <div className="map-container">
            <MapContainer
              center={[24.0, 45.0]}
              zoom={5}
              minZoom={4}
              maxZoom={18}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {flyTo && (
                <FlyToLocation
                  key={flyTrigger}
                  position={flyTo.position}
                  zoom={flyTo.zoom}
                  trigger={flyTrigger}
                />
              )}

              <Marker
                position={[mainOffice.lat, mainOffice.lng]}
                icon={createOfficeIcon(null)}
                eventHandlers={{ click: handleMainOfficeClick }}
              >
                <Tooltip direction="top" offset={[0, -32]} className="tooltip-main">
                  <span>
                    🏢 {mainOffice.name}
                    {labels.mainOfficeTooltipText ? ` (${labels.mainOfficeTooltipText})` : ""}
                  </span>
                </Tooltip>
              </Marker>

              {sortedOffices.map((office) => (
                <Marker
                  key={office.id}
                  position={[office.lat, office.lng]}
                  icon={createOfficeIcon(office.number)}
                  eventHandlers={{ click: () => handleOfficeClick(office) }}
                >
                  <Tooltip direction="top" offset={[0, -32]} className="tooltip-office">
                    <span>
                      📍 {office.name}
                      {labels.officeTooltipText ? ` (${labels.officeTooltipText})` : ""}
                    </span>
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {renderSidebar()}
        </div>
      </div>
    </div>
  );
}