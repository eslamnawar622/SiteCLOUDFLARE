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
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// ─── Types ───
interface Office {
  id: string;
  name: string;
  city: string;
  position: [number, number];
  phone: string;
  hours: string;
  services: string[];
  address: string;
  images: string[];
}

interface Region {
  id: string;
  name: string;
  city: string;
  position: [number, number];
  officeCount: number;
  offices: Office[];
  color: string;
}

// ─── Data ───
const regions: Region[] = [
  {
    id: "riyadh",
    name: "منطقة الرياض",
    city: "الرياض",
    position: [24.7136, 46.6753],
    officeCount: 3,
    color: "#059669",
    offices: [
      { id: "r1", name: "المكتب الرئيسي - الرياض", city: "الرياض", position: [24.7136, 46.6753], phone: "011-123-4567", hours: "8:00 ص - 10:00 م", services: ["مبيعات", "صيانة", "استشارات"], address: "طريق الملك فهد، الرياض", images: ["🏢", "📸", "🏬"] },
      { id: "r2", name: "مكتب الرياض الجنوبي", city: "الرياض", position: [24.65, 46.72], phone: "011-234-5678", hours: "9:00 ص - 9:00 م", services: ["مبيعات", "توصيل"], address: "حي العزيزية، الرياض", images: ["🏪", "📸"] },
      { id: "r3", name: "مكتب الرياض الشمالي", city: "الرياض", position: [24.78, 46.62], phone: "011-345-6789", hours: "8:00 ص - 11:00 م", services: ["مبيعات", "صيانة"], address: "حي النزهة، الرياض", images: ["🏪", "📸"] },
    ],
  },
  {
    id: "makkah",
    name: "منطقة مكة المكرمة",
    city: "جدة",
    position: [21.4858, 39.1925],
    officeCount: 2,
    color: "#10b981",
    offices: [
      { id: "m1", name: "مكتب جدة", city: "جدة", position: [21.4858, 39.1925], phone: "012-123-4567", hours: "9:00 ص - 11:00 م", services: ["مبيعات", "استشارات"], address: "شارع التحلية، جدة", images: ["🏪", "📸", "🌊"] },
      { id: "m2", name: "مكتب مكة", city: "مكة", position: [21.3891, 39.8579], phone: "012-234-5678", hours: "8:00 ص - 10:00 م", services: ["مبيعات", "صيانة"], address: "حي العزيزية، مكة", images: ["🏪", "📸"] },
    ],
  },
  {
    id: "madinah",
    name: "منطقة المدينة المنورة",
    city: "المدينة",
    position: [24.5247, 39.5692],
    officeCount: 1,
    color: "#34d399",
    offices: [
      { id: "md1", name: "مكتب المدينة", city: "المدينة المنورة", position: [24.5247, 39.5692], phone: "014-123-4567", hours: "8:00 ص - 9:00 م", services: ["مبيعات"], address: "طريق الملك عبدالله، المدينة", images: ["🏪", "📸"] },
    ],
  },
  {
    id: "east",
    name: "منطقة الشرقية",
    city: "الدمام",
    position: [26.3927, 50.0916],
    officeCount: 2,
    color: "#10b981",
    offices: [
      { id: "e1", name: "مكتب الدمام", city: "الدمام", position: [26.3927, 50.0916], phone: "013-123-4567", hours: "8:00 ص - 10:00 م", services: ["مبيعات", "صيانة", "استشارات"], address: "طريق الملك فهد، الدمام", images: ["🏪", "📸", "🌊"] },
      { id: "e2", name: "مكتب الخبر", city: "الخبر", position: [26.28, 50.22], phone: "013-234-5678", hours: "9:00 ص - 9:00 م", services: ["مبيعات"], address: "الخبر الشمالية، الخبر", images: ["🏪", "📸"] },
    ],
  },
  {
    id: "asir",
    name: "منطقة عسير",
    city: "أبها",
    position: [18.2164, 42.5053],
    officeCount: 1,
    color: "#34d399",
    offices: [
      { id: "a1", name: "مكتب أبها", city: "أبها", position: [18.2164, 42.5053], phone: "017-123-4567", hours: "9:00 ص - 9:00 م", services: ["مبيعات", "توصيل"], address: "جبل السودة، أبها", images: ["🏪", "📸", "⛰️"] },
    ],
  },
  {
    id: "tabuk",
    name: "منطقة تبوك",
    city: "تبوك",
    position: [28.3835, 36.5662],
    officeCount: 0,
    color: "#d1d5db",
    offices: [],
  },
  {
    id: "hail",
    name: "منطقة حائل",
    city: "حائل",
    position: [27.5114, 41.7208],
    officeCount: 1,
    color: "#34d399",
    offices: [
      { id: "h1", name: "مكتب حائل", city: "حائل", position: [27.5114, 41.7208], phone: "016-123-4567", hours: "8:00 ص - 8:00 م", services: ["مبيعات"], address: "وسط المدينة، حائل", images: ["🏪", "📸"] },
    ],
  },
  {
    id: "qassim",
    name: "منطقة القصيم",
    city: "بريدة",
    position: [26.3331, 43.9714],
    officeCount: 1,
    color: "#34d399",
    offices: [
      { id: "q1", name: "مكتب القصيم", city: "بريدة", position: [26.3331, 43.9714], phone: "016-234-5678", hours: "8:00 ص - 9:00 م", services: ["مبيعات", "صيانة"], address: "شارع الملك سعود، بريدة", images: ["🏪", "📸"] },
    ],
  },
  {
    id: "najran",
    name: "منطقة نجران",
    city: "نجران",
    position: [17.5656, 44.2289],
    officeCount: 0,
    color: "#d1d5db",
    offices: [],
  },
  {
    id: "jouf",
    name: "منطقة الجوف",
    city: "سكاكا",
    position: [29.9652, 40.2064],
    officeCount: 0,
    color: "#d1d5db",
    offices: [],
  },
  {
    id: "jazan",
    name: "منطقة جازان",
    city: "جازان",
    position: [16.8894, 42.5706],
    officeCount: 0,
    color: "#d1d5db",
    offices: [],
  },
  {
    id: "bahah",
    name: "منطقة الباحة",
    city: "الباحة",
    position: [20.0129, 41.4667],
    officeCount: 1,
    color: "#34d399",
    offices: [
      { id: "b1", name: "مكتب الباحة", city: "الباحة", position: [20.0129, 41.4667], phone: "017-234-5678", hours: "8:00 ص - 8:00 م", services: ["مبيعات"], address: "حي البلد، الباحة", images: ["🏪", "📸"] },
    ],
  },
  {
    id: "north",
    name: "منطقة الحدود الشمالية",
    city: "عرعر",
    position: [30.985, 41.0384],
    officeCount: 0,
    color: "#d1d5db",
    offices: [],
  },
];

const mainOffice = {
  id: "main",
  name: "المكتب الرئيسي",
  city: "الإسكندرية، مصر",
  position: [31.2001, 29.9187] as [number, number],
  phone: "03-123-4567",
  hours: "8:00 ص - 10:00 م",
  services: ["مبيعات", "صيانة", "استشارات", "دعم فني"],
  address: "شارع جمال عبدالناصر، الإسكندرية",
  images: ["🏢", "📸", "🌊", "🏛️"],
};

// ─── Icons ───
const mainIcon = L.divIcon({
  className: "custom-main-icon",
  html: `<div class="main-pin"><div class="main-pin-inner">🏢</div></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

const createRegionIcon = (color: string, count: number) => L.divIcon({
  className: "custom-region-icon",
  html: `<div class="region-pin" style="--pin-color: ${color}">
    <div class="region-pin-inner" style="background: ${color}">
      ${count > 0 ? `<span class="region-count">${count}</span>` : ""}
    </div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const officeIcon = L.divIcon({
  className: "custom-office-icon",
  html: `<div class="office-pin"><div class="office-pin-inner">📍</div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

// ─── FlyTo Component ───
function FlyToLocation({ position, zoom, trigger }: { position: [number, number]; zoom: number; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, zoom, { duration: 1.5 });
  }, [position, zoom, trigger, map]);
  return null;
}

// ─── Sidebar: قائمة المكاتب في المنطقة ───
function RegionSidebar({ region, onOfficeClick, onClose }: { region: Region; onOfficeClick: (office: Office) => void; onClose: () => void }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ background: region.color }}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <span className="sidebar-badge">{region.name}</span>
      </div>

      <div className="sidebar-content">
        <div className="region-summary">
          <h3>📍 {region.city}</h3>
          <p>عدد المكاتب: <strong>{region.officeCount}</strong></p>
        </div>

        <div className="offices-list-sidebar">
          <h4>🏪 المكاتب المتاحة</h4>
          {region.offices.map((office) => (
            <div
              key={office.id}
              className="office-card-sidebar"
              onClick={() => onOfficeClick(office)}
            >
              <div className="office-card-header">
                <span className="office-icon">📍</span>
                <div>
                  <h5>{office.name}</h5>
                  <span className="office-address">{office.address}</span>
                </div>
              </div>
              <div className="office-card-info">
                <span>📞 {office.phone}</span>
                <span>🕐 {office.hours}</span>
              </div>
              <div className="office-card-services">
                {office.services.map((s) => (
                  <span key={s} className="service-tag-small">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar: تفاصيل مكتب واحد ───
function OfficeSidebar({ office, onBack, onClose }: { office: Office | typeof mainOffice; onBack: () => void; onClose: () => void }) {
  const isMain = office.id === "main";

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ background: isMain ? "#dc2626" : "#3b82f6" }}>
        <div className="sidebar-header-buttons">
          <button className="back-btn" onClick={onBack}>← رجوع</button>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <span className="sidebar-badge">{isMain ? "🏢 المقر الرئيسي" : "🏪 فرع"}</span>
      </div>

      <div className="sidebar-content">
        {/* Images Gallery */}
        <div className="image-gallery">
          {office.images.map((img, idx) => (
            <div key={idx} className="gallery-item">
              <span className="gallery-emoji">{img}</span>
            </div>
          ))}
        </div>

        {/* Name */}
        <h2 className="office-name">{office.name}</h2>
        <p className="office-city">{isMain ? "الإسكندرية، مصر" : office.city}</p>

        {/* Info Cards */}
        <div className="info-cards">
          <div className="info-card">
            <span className="info-icon">📍</span>
            <div>
              <h4>العنوان</h4>
              <p>{office.address}</p>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">📞</span>
            <div>
              <h4>رقم التواصل</h4>
              <p className="phone">{office.phone}</p>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">🕐</span>
            <div>
              <h4>ساعات العمل</h4>
              <p>{office.hours}</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="services-section">
          <h3>✨ الخدمات المتاحة</h3>
          <div className="services-tags">
            {office.services.map((s) => (
              <span key={s} className="service-tag">{s}</span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <a href={`tel:${office.phone}`} className="btn-call">
            📞 اتصل الآن
          </a>
          <button className="btn-share">
            ↗️ مشاركة الموقع
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar: Empty ───
function EmptySidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-empty">
        <span className="empty-icon">🗺️</span>
        <h3>اختر منطقة أو مكتب</h3>
        <p>اضغط على أي منطقة في الخريطة لعرض المكاتب</p>
        <p>أو اضغط على المقر الرئيسي للتفاصيل</p>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function MyMap() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<Office | typeof mainOffice | null>(null);
  const [flyTo, setFlyTo] = useState<{ position: [number, number]; zoom: number } | null>(null);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [filter, setFilter] = useState<"all" | "with-offices" | "without-offices">("all");

  const filteredRegions = useMemo(() => {
    let result = regions;
    if (filter === "with-offices") result = result.filter((r) => r.officeCount > 0);
    if (filter === "without-offices") result = result.filter((r) => r.officeCount === 0);
    return result;
  }, [filter]);

  const totalOffices = regions.reduce((sum, r) => sum + r.officeCount, 0);

  const triggerFlyTo = (position: [number, number], zoom: number) => {
    setFlyTo({ position, zoom });
    setFlyTrigger((prev) => prev + 1);
  };

  // 🔥 ضغطة على المحافظة → Sidebar يعرض قائمة المكاتب
  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region);
    setSelectedOffice(null);
    triggerFlyTo(region.position, 8);
  };

  // 🔥 ضغطة على مكتب → Sidebar يعرض تفاصيل المكتب
  const handleOfficeClick = (office: Office) => {
    setSelectedOffice(office);
    triggerFlyTo(office.position, 14);
  };

  // 🔥 ضغطة على المقر الرئيسي
  const handleMainOfficeClick = () => {
    setSelectedRegion(null);
    setSelectedOffice(mainOffice);
    triggerFlyTo(mainOffice.position, 14);
  };

  // 🔥 رجوع من تفاصيل المكتب لقائمة المكاتب
  const handleBackToRegion = () => {
    setSelectedOffice(null);
    if (selectedRegion) {
      triggerFlyTo(selectedRegion.position, 8);
    }
  };

  // 🔥 إغلاق Sidebar
  const handleCloseSidebar = () => {
    setSelectedRegion(null);
    setSelectedOffice(null);
  };

  // تحديد إيه اللي يظهر في الـ Sidebar
  const renderSidebar = () => {
    if (selectedOffice) {
      return (
        <OfficeSidebar
          office={selectedOffice}
          onBack={handleBackToRegion}
          onClose={handleCloseSidebar}
        />
      );
    }
    if (selectedRegion) {
      return (
        <RegionSidebar
          region={selectedRegion}
          onOfficeClick={handleOfficeClick}
          onClose={handleCloseSidebar}
        />
      );
    }
    return <EmptySidebar />;
  };

  return (
    <div className="map-page">
      {/* Header */}
      <div className="map-header">
        <h1>🌍 فروعنا في الوطن العربي</h1>
        <p>
          <span className="stat">🏢 المقر الرئيسي: الإسكندرية</span>
          <span className="stat">📍 {totalOffices} فرع في السعودية</span>
          <span className="stat">🏪 {regions.filter((r) => r.officeCount > 0).length} منطقة نشطة</span>
        </p>
      </div>

      <div className="map-layout">
        {/* Filters Bar */}
        <div className="filters-bar">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            الكل
          </button>
          <button className={filter === "with-offices" ? "active" : ""} onClick={() => setFilter("with-offices")}>
            بها مكاتب
          </button>
          <button className={filter === "without-offices" ? "active" : ""} onClick={() => setFilter("without-offices")}>
            قريباً
          </button>
        </div>

        {/* Content: Map + Sidebar */}
        <div className="content-area">
          {/* Map */}
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

              {/* Main Office */}
              <Marker
                position={mainOffice.position}
                icon={mainIcon}
                eventHandlers={{ click: handleMainOfficeClick }}
              >
                <Tooltip direction="top" offset={[0, -44]} className="tooltip-main">
                  <span>🏢 {mainOffice.name} (اضغط للتفاصيل)</span>
                </Tooltip>
              </Marker>

              {/* Regions */}
              {filteredRegions.map((region) => (
                <Marker
                  key={region.id}
                  position={region.position}
                  icon={createRegionIcon(region.color, region.officeCount)}
                  eventHandlers={{ click: () => handleRegionClick(region) }}
                >
                  <Tooltip direction="top" offset={[0, -36]} className="tooltip-region">
                    <span>{region.name} ({region.officeCount} مكتب) - اضغط لعرض المكاتب</span>
                  </Tooltip>
                </Marker>
              ))}

              {/* Individual Offices (when region selected) */}
              {selectedRegion?.offices.map((office) => (
                <Marker
                  key={office.id}
                  position={office.position}
                  icon={officeIcon}
                  eventHandlers={{ click: () => handleOfficeClick(office) }}
                >
                  <Tooltip direction="top" offset={[0, -28]} className="tooltip-office">
                    <span>📍 {office.name} (اضغط للتفاصيل)</span>
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Sidebar */}
          {renderSidebar()}
        </div>
      </div>
    </div>
  );
}
