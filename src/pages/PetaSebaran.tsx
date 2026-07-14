import React, { useState, useEffect, useMemo } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { SafeImage } from "@/components/ui/SafeImage";
import { Car, Bike, Wrench, MapPin, Eye, Map as MapIcon, Layers, Radio, ZoomIn, X, Search, ChevronDown, ChevronUp } from "lucide-react";
import { renderToString } from "react-dom/server";
import { StatusBadge } from "@/components/ui/Badge";
import { nameSimilarity, normalizeNamaForMatch } from "@/lib/cleansing";
import { resolveAssetPhotoCandidates, resolveAssetPhotoUrl } from "@/lib/media";
import type { Pegawai } from "@/types";

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapLocation {
  id: string;
  type: string; // 'Kendaraan' atau 'Alat & Mesin'
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  condition: string;
  isMotorcycle?: boolean;
  pengguna?: string;
  qrUrl?: string;
  foto?: string;
  data: Record<string, any>;
}

const BASEMAPS = [
  { id: "osm", name: "OpenStreetMap", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OSM" },
  { id: "google", name: "Google Hybrid", url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", attribution: "© Google" },
  { id: "cartolight", name: "CartoDB Light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: "© CartoDB" },
  { id: "cartodark", name: "CartoDB Dark", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: "© CartoDB" },
];

function MapResizeSync() {
  const map = useMap();
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      window.clearTimeout(frame);
      frame = window.setTimeout(() => map.invalidateSize({ animate: false }), 40);
    };
    refresh();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(refresh) : null;
    observer?.observe(map.getContainer());
    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);
    return () => {
      observer?.disconnect();
      window.clearTimeout(frame);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
    };
  }, [map]);
  return null;
}

function canonicalEmployeeName(raw: unknown, employees: Pegawai[]): string {
  const source = String(raw || "").trim();
  if (!source || source === "-") return "";
  const norm = normalizeNamaForMatch(source);
  const exact = employees.find((employee) => normalizeNamaForMatch(employee.nama) === norm);
  if (exact) return exact.nama;
  const ranked = employees
    .map((employee) => ({ employee, score: nameSimilarity(norm, normalizeNamaForMatch(employee.nama)) }))
    .sort((a, b) => b.score - a.score);
  if (ranked[0] && ranked[0].score >= 0.86 && (!ranked[1] || ranked[0].score - ranked[1].score >= 0.06)) return ranked[0].employee.nama;
  return source;
}

function assetPhotoUrl(photo: unknown, type: string): string {
  return resolveAssetPhotoUrl(photo, type === "Alat & Mesin" ? "alat_mesin" : "kendaraan");
}

export default function PetaSebaran() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState("Semua Tipe");
  const [filterCondition, setFilterCondition] = useState("Semua Kondisi");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBasemap, setActiveBasemap] = useState("cartolight");
  const [radarPulse, setRadarPulse] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [basemapOpen, setBasemapOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [vehicles, equipment, employees] = await Promise.all([
          spreadsheetService.getVehicles(),
          spreadsheetService.getEquipment(),
          spreadsheetService.getEmployeeDirectory(),
        ]);
        const employeeDirectory = employees as Pegawai[];

        const parseCoordinate = (val: any) => {
          if (val === null || val === undefined || String(val).trim() === "") return null;
          const parsed = Number(String(val).replace(',', '.'));
          return isNaN(parsed) ? null : parsed;
        };

        const mapLocations: MapLocation[] = [];

        vehicles.forEach((v: any, index: number) => {
          const lat = parseCoordinate(v.latitude || v.lat);
          const lng = parseCoordinate(v.longitude || v.lng);
          if (lat !== null && lng !== null) {
            const isMotor = String(v.jenis_kendaraan || "").toLowerCase().includes("motor") || 
                           String(v.jenis_kendaraan || "").toLowerCase().includes("roda 2") ||
                           String(v.jenis_kendaraan || "").toLowerCase().includes("roda dua");
            
            mapLocations.push({
              id: String(v.asset_id || v.id || `vehicle-${index}`),
              type: "Kendaraan",
              lat, 
              lng,
              title: v.no_polisi || v.nama_aset || "Kendaraan",
              subtitle: `${v.merk || ""} - ${v.jenis_kendaraan || ""}`,
              condition: v.kondisi || "BAIK",
              isMotorcycle: isMotor,
              pengguna: canonicalEmployeeName(v.pengguna, employeeDirectory),
              qrUrl: v.qr_url,
              foto: v.foto,
              data: {
                "Kode Barang": v.kode_barang || "Belum diisi",
                "No. Polisi": v.no_polisi,
                "Merk": v.merk,
                "Tipe": v.tipe,
                "Tahun": v.tahun,
                "Pengguna": canonicalEmployeeName(v.pengguna, employeeDirectory),
                "Penanggung Jawab": canonicalEmployeeName(v.penanggung_jawab, employeeDirectory),
                "Unit Kerja": v.unit_kerja,
                "Lokasi / Unit": v.lokasi || v.unit_kerja,
                "Koordinat": `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                "Kapasitas Mesin": v.kapasitas_mesin,
                "No. BPKB": v.no_bpkb,
                "No. Rangka": v.no_rangka,
                "No. Mesin": v.no_mesin,
                "Harga Pembelian": v.harga_pembelian,
              }
            });
          }
        });

        equipment.forEach((e: any, index: number) => {
          const lat = parseCoordinate(e.latitude || e.lat);
          const lng = parseCoordinate(e.longitude || e.lng);
          if (lat !== null && lng !== null) {
            mapLocations.push({
              id: String(e.asset_id || e.id || `equipment-${index}`),
              type: "Alat & Mesin",
              lat, 
              lng,
              title: e.nama_aset || "Alat & Mesin",
              subtitle: e.merk || "-",
              condition: e.kondisi || "BAIK",
              pengguna: canonicalEmployeeName(e.pengguna, employeeDirectory),
              qrUrl: e.qr_url,
              foto: e.foto,
              data: {
                "Asset ID": e.asset_id,
                "Kode Barang": e.kode_barang,
                "QR / Asset ID": e.qr_url || e.asset_id,
                "Nama Barang": e.nama_aset,
                "Merk": e.merk,
                "Jenis": e.jenis,
                "Jumlah": e.jumlah ? `${e.jumlah} ${e.satuan || ''}` : '',
                "Kondisi": e.kondisi,
                "Tahun": e.tahun,
                "Pengguna": canonicalEmployeeName(e.pengguna, employeeDirectory),
                "Penanggung Jawab": canonicalEmployeeName(e.penanggung_jawab, employeeDirectory),
                "Lokasi / Unit": e.lokasi,
                "Koordinat": `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                "Harga Pembelian": e.harga_pembelian,
              }
            });
          }
        });

        setLocations(mapLocations);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchType = filterType === "Semua Tipe" || loc.type === filterType;
      const matchCond = filterCondition === "Semua Kondisi" || loc.condition.toUpperCase() === filterCondition.toUpperCase();
      const matchSearch = searchQuery === "" || 
        loc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        loc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(loc.pengguna || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(loc.data).some((value) => String(value || "").toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchCond && matchSearch;
    });
  }, [locations, filterType, filterCondition, searchQuery]);

  // Jumlah titik per tipe atas SELURUH lokasi (untuk chip klikable → filterType).
  const typeSummary = useMemo(() => {
    const order = ["Kendaraan", "Alat & Mesin"];
    const counts: Record<string, number> = {};
    locations.forEach((l) => { counts[l.type] = (counts[l.type] || 0) + 1; });
    const keys = Array.from(new Set([...order.filter((k) => counts[k]), ...Object.keys(counts)]));
    return keys.map((k) => ({ type: k, count: counts[k] || 0 }));
  }, [locations]);

  const markerIcons = useMemo(() => {
    const build = (type: "car" | "motorcycle" | "equipment") => {
      let color = "#0B57D0";
      let IconComponent = <MapPin size={16} />;
      if (type === "car" || type === "motorcycle") {
        color = "#4F46E5";
        IconComponent = type === "motorcycle" ? <Bike size={16} /> : <Car size={16} />;
      } else {
        color = "#16A34A";
        IconComponent = <Wrench size={16} />;
      }

      const iconHtml = renderToString(IconComponent);
      const pulseHtml = radarPulse
        ? `<div class="absolute inset-[-8px] rounded-full border-2 animate-radar-pulse opacity-0 pointer-events-none" style="border-color: ${color}"></div>`
        : "";
      return L.divIcon({
        className: "bg-transparent border-none",
        html: `<div class="relative group w-8 h-8">${pulseHtml}<div class="w-full h-full rounded-full border-2 border-white shadow-md flex items-center justify-center text-white relative z-10" style="background-color: ${color}">${iconHtml}</div></div>`,
        iconAnchor: [16, 16],
        tooltipAnchor: [16, 0],
        popupAnchor: [0, -16],
      });
    };
    return { car: build("car"), motorcycle: build("motorcycle"), equipment: build("equipment") };
  }, [radarPulse]);

  if (loading) {
    return <LoadingState />;
  }

  const center: [number, number] = filteredLocations.length > 0
    ? [filteredLocations[0].lat, filteredLocations[0].lng]
    : [-6.2866, 106.6888]; // default to area info

  const getMarkerIcon = (loc: MapLocation) => loc.type === "Alat & Mesin"
    ? markerIcons.equipment
    : (loc.isMotorcycle ? markerIcons.motorcycle : markerIcons.car);

  const getStats = () => {
    const stats: Record<string, number> = {};
    filteredLocations.forEach(l => {
      stats[l.type] = (stats[l.type] || 0) + 1;
    });
    return stats;
  };
  const stats = getStats();
  const selectedBasemap = BASEMAPS.find(b => b.id === activeBasemap) || BASEMAPS[0];

  const uniqueConditions = ["Semua Kondisi", ...Array.from(new Set(locations.map(l => l.condition.toUpperCase())))];

  return (
    <div className="h-full min-h-0 w-full max-w-none flex flex-col relative bg-gray-50 border-t border-gray-100 overflow-hidden touch-pan-y">
      <div className="absolute top-3 left-3 right-3 z-[25] flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-start pointer-events-none">
        
        {/* Title & Info Card + chip tipe klikable */}
        <div className="flex flex-col gap-2 w-full sm:w-auto pointer-events-auto">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 transition-all w-full sm:w-auto">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Peta Sebaran Aset</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Visualisasi geografis real-time</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterType("Semua Tipe")}
              aria-pressed={filterType === "Semua Tipe"}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border transition-colors ${
                filterType === "Semua Tipe"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white/95 dark:bg-gray-900/95 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
              }`}
            >
              Semua · {locations.length}
            </button>
            {typeSummary.map((t) => (
              <button
                key={t.type}
                onClick={() => setFilterType(t.type)}
                aria-pressed={filterType === t.type}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border transition-colors ${
                  filterType === t.type
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white/95 dark:bg-gray-900/95 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
                }`}
              >
                {t.type} · {t.count}
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pointer-events-auto w-full md:w-auto mt-2 sm:mt-0">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Cari aset..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-40 px-3 pl-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold shadow-sm focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="Semua Tipe">Jenis Aset</option>
              <option value="Kendaraan">Kendaraan</option>
              <option value="Alat & Mesin">Alat & Mesin</option>
            </select>
            <select 
              value={filterCondition} 
              onChange={(e) => setFilterCondition(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold shadow-sm focus:ring-2 focus:ring-blue-500 appearance-none max-w-[140px] truncate"
            >
              {uniqueConditions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setRadarPulse(!radarPulse)}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm border transition-colors flex justify-center items-center gap-2
                ${radarPulse ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
            >
              <Radio size={14} className={radarPulse ? "animate-pulse" : ""} /> Radar 
            </button>
            <div className="relative flex-1 sm:flex-none">
              <button type="button" onClick={() => setBasemapOpen((open) => !open)} aria-expanded={basemapOpen} className="w-full h-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 touch-manipulation">
                <Layers size={14} /> Basemaps
              </button>
              {basemapOpen && <div className="absolute right-0 left-auto top-full pt-2 w-48 z-[35] pointer-events-auto max-h-[50dvh] overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2">
                  {BASEMAPS.map(map => (
                    <button 
                      key={map.id}
                      onClick={() => { setActiveBasemap(map.id); setBasemapOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeBasemap === map.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-gray-50 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                    >
                      {map.name}
                    </button>
                  ))}
                </div>
              </div>}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10 bg-gray-100">
        <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%", zIndex: 10 }} maxZoom={20} zoomAnimation={false} fadeAnimation={false} markerZoomAnimation={false}>
          <MapResizeSync />
          <TileLayer
            key={activeBasemap}
            attribution={selectedBasemap.attribution}
            url={selectedBasemap.url}
            maxZoom={20}
            updateWhenIdle
            updateWhenZooming={false}
            keepBuffer={1}
          />
          {filteredLocations.map((item, idx) => (
            <Marker key={`${item.type}-${item.id}-${idx}`} position={[item.lat, item.lng]} icon={getMarkerIcon(item)}>
              <Popup className="rounded-xl overflow-hidden min-w-[300px]">
                <div className="p-0 -m-3">
                  {item.foto && (
                    <div 
                      className="w-full h-36 bg-gray-100 relative overflow-hidden group cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setZoomedImage(assetPhotoUrl(item.foto, item.type)); }}
                    >
                      <SafeImage 
                        src={assetPhotoUrl(item.foto, item.type)} 
                        fallbackSrcs={resolveAssetPhotoCandidates(item.foto, item.type === "Alat & Mesin" ? "alat_mesin" : "kendaraan").slice(1)}
                        alt={item.title} 
                        className="w-full h-full object-contain bg-gray-900 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ZoomIn size={32} className="text-white drop-shadow-md" />
                      </div>
                    </div>
                  )}
                  <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{item.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{item.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                        <span className="block text-gray-400 dark:text-gray-500 mb-1">Tipe Aset</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{item.type}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                        <span className="block text-gray-400 dark:text-gray-500 mb-1">Kondisi</span>
                        <StatusBadge status={item.condition} className="!text-[10px] !py-0.5" />
                      </div>
                    </div>

                    {/* Detailed Data View */}
                    <div className="border-t border-gray-100 dark:border-gray-800/60 pt-3 mt-3 space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1 relative">
                      {Object.entries(item.data).map(([key, value]) => {
                         if (!value || value === '-') return null;
                         return (
                           <div key={key} className="flex justify-between items-start gap-4 border-b border-gray-50 dark:border-gray-800/50 pb-1.5 last:border-0 last:pb-0">
                             <span className="text-[11px] text-gray-500 dark:text-gray-400 flex-shrink-0">{key}</span>
                             <span className="text-[11px] font-medium text-right text-gray-800 dark:text-gray-200 break-words max-w-[150px]">{value as React.ReactNode}</span>
                           </div>
                         );
                      })}
                    </div>

                    <div className="flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
                      <a 
                        href={`https://maps.google.com/?q=${item.lat},${item.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg py-2 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <MapIcon size={14} /> Maps
                      </a>
                      <a 
                        href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${item.lat},${item.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg py-2 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                      >
                        <Eye size={14} /> Street View
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        <div className="absolute bottom-4 left-3 sm:bottom-6 sm:left-6 z-[25] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-xs font-medium space-y-3 min-w-[210px] max-w-[calc(100vw-1.5rem)] pointer-events-auto transition-all duration-300">
          <div 
            className="flex justify-between items-center cursor-pointer select-none"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <span>Legenda</span>
              <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold text-[10px]">{filteredLocations.length} Titik</span>
            </h3>
            {isLegendOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronUp size={14} className="text-gray-500" />}
          </div>
          
          {isLegendOpen && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-2.5">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Jenis Aset (Warna Marker)</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#4F46E5] flex items-center justify-center text-white ring-2 ring-white dark:ring-gray-900 shadow-sm"><Car size={12} /></div>
                    <span className="text-gray-700 dark:text-gray-300">Kendaraan</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">{stats['Kendaraan'] || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#16A34A] flex items-center justify-center text-white ring-2 ring-white dark:ring-gray-900 shadow-sm"><Wrench size={12} /></div>
                    <span className="text-gray-700 dark:text-gray-300">Alat & Mesin</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">{stats['Alat & Mesin'] || 0}</span>
                </div>
              </div>
              
              <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status Kondisi</p>
                <div className="grid grid-cols-2 gap-2">
                  <StatusBadge status="BAIK" className="justify-center !text-[10px]" />
                  <StatusBadge status="RUSAK RINGAN" className="justify-center !text-[10px]" />
                  <StatusBadge status="KURANG BAIK" className="justify-center !text-[10px]" />
                  <StatusBadge status="RUSAK BERAT" className="justify-center !text-[10px]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {zoomedImage && (
        <div className="fixed inset-0 z-[9999] p-4 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
          <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X size={24} />
          </button>
          <SafeImage 
            src={zoomedImage} 
            alt="Zoomed Asset" 
            className="w-full h-auto max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
