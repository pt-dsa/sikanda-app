// ---------------------------------------------------------------------------
// SIKANDA — Modul Kelengkapan Data Pegawai (Core Value)
// ---------------------------------------------------------------------------
// Definisi "LENGKAP" (disepakati Tahap 5/Tanya SIKANDA — 9 kriteria):
//   1. NIP valid 18 digit numerik
//   2. Jabatan terisi
//   3. Golongan terisi
//   4. TMT Golongan terisi
//   5. Tanggal Lahir terisi
//   6. Foto terisi
//   7. Email terisi
//   8. Kontak terisi
//   9. Relasi nama ↔ aset BERSIH: match_quality bukan "fuzzy" DAN tidak ada
//      temuan Levenshtein (scanAssetNameMismatches) yang menunjuk pegawai ini.
//      Pegawai TANPA aset dianggap bersih (tidak ada nama fuzzy).
//
// Semua fungsi MURNI (tanpa side effects). Sumber kebenaran kriteria 1-5
// selaras dengan modul Cleansing (scanPegawai) — jangan divergen.
// ---------------------------------------------------------------------------

import { scanAssetNameMismatches, type AssetSheetName } from "@/lib/cleansing";
import type { Pegawai, DistribusiItem } from "@/types";

// ---------------------------------------------------------------------------
// Unified asset rows — bentuk baku input scanAssetNameMismatches.
// Dipakai BERSAMA oleh halaman Cleansing, Pegawai, dan getDashboardMetrics
// (satu definisi, tidak ada duplikasi — pelajaran bug #8 Tahap 4).
// ---------------------------------------------------------------------------
export interface UnifiedAsset {
  sheet: AssetSheetName;
  assetId: string;
  assetLabel: string;
  holderName: string;
}

export function buildUnifiedAssets(
  vehicles: any[],
  equipment: any[],
  inventory: any[]
): UnifiedAsset[] {
  return [
    ...vehicles.map((v: any) => ({
      sheet: "assets_vehicle" as AssetSheetName,
      assetId: String(v.asset_id || ""),
      assetLabel: `${v.merk || ""} ${v.tipe || ""} — ${v.no_polisi || "-"}`.trim(),
      holderName: String(v.pengguna || ""),
    })),
    ...equipment.map((eq: any) => ({
      sheet: "assets_equipment" as AssetSheetName,
      assetId: String(eq.asset_id || ""),
      assetLabel: String(eq.nama_aset || "-"),
      holderName: String(eq.pengguna || ""),
    })),
    ...inventory.map((iv: any) => ({
      sheet: "assets_inventory" as AssetSheetName,
      assetId: String(iv.asset_id || ""),
      assetLabel: String(iv.nama_aset || "-"),
      holderName: String(iv.pengguna || ""),
    })),
  ].filter((a) => a.assetId);
}

/**
 * Kumpulan NIP pegawai yang namanya menjadi target temuan fuzzy Levenshtein
 * (ada holder_name aset yang MIRIP tapi tidak persis sama dengan nama pegawai
 * tersebut). NIP dibandingkan sebagai STRING eksak.
 */
export function buildFuzzyNipSet(
  pegawaiList: Pegawai[],
  unifiedAssets: UnifiedAsset[]
): Set<string> {
  const set = new Set<string>();
  const issues = scanAssetNameMismatches(pegawaiList, unifiedAssets);
  for (const i of issues) {
    const nip = String(i.matchedNip || "").trim();
    if (nip) set.add(nip);
  }
  return set;
}

// ---------------------------------------------------------------------------
// Perhitungan kelengkapan per pegawai
// ---------------------------------------------------------------------------
export interface KelengkapanResult {
  persen: number;        // 0..100 (dibulatkan)
  lengkap: boolean;      // true bila seluruh kriteria terpenuhi
  terpenuhi: number;
  total: number;
  missing: string[];     // label kriteria yang BELUM terpenuhi (untuk tooltip)
}

export function hitungKelengkapan(
  p: Pegawai,
  fuzzyNipSet: Set<string>
): KelengkapanResult {
  const nip = String(p.nip || "").trim();
  const relasiBersih =
    p.match_quality !== "fuzzy" && !(nip !== "" && fuzzyNipSet.has(nip));

  // [terpenuhi?, label] — urutan tetap agar tooltip konsisten.
  const checks: Array<[boolean, string]> = [
    [/^\d{18}$/.test(nip), "NIP 18 digit"],
    [String(p.jabatan || "").trim() !== "", "Jabatan"],
    [String(p.golongan || "").trim() !== "", "Golongan"],
    [String(p.tgl_mulai_golongan || "").trim() !== "", "TMT Golongan"],
    [String(p.tgl_lahir || "").trim() !== "", "Tanggal Lahir"],
    [String(p.foto || "").trim() !== "", "Foto"],
    [String(p.email || "").trim() !== "", "Email"],
    [String(p.kontak || "").trim() !== "", "Kontak"],
    [relasiBersih, "Nama fuzzy dgn aset"],
  ];

  const missing: string[] = [];
  let terpenuhi = 0;
  for (const [ok, label] of checks) {
    if (ok) terpenuhi++;
    else missing.push(label);
  }
  const total = checks.length;
  const persen = Math.round((terpenuhi / total) * 100);
  return { persen, lengkap: terpenuhi === total, terpenuhi, total, missing };
}

// ---------------------------------------------------------------------------
// Rekap agregat untuk panel Dashboard
// ---------------------------------------------------------------------------
export interface RekapKelengkapan {
  lengkap: number;                 // jumlah pegawai 100%
  belum: number;                   // jumlah pegawai < 100%
  rataRata: number;                // rata-rata persen (dibulatkan)
  fieldKosong: DistribusiItem[];   // kriteria yang paling sering belum terpenuhi (desc)
}

export function rekapKelengkapan(
  list: Pegawai[],
  fuzzyNipSet: Set<string>
): RekapKelengkapan {
  let lengkap = 0;
  let totalPersen = 0;
  const counts: Record<string, number> = {};

  for (const p of list) {
    const r = hitungKelengkapan(p, fuzzyNipSet);
    if (r.lengkap) lengkap++;
    totalPersen += r.persen;
    for (const label of r.missing) counts[label] = (counts[label] || 0) + 1;
  }

  const fieldKosong = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    lengkap,
    belum: list.length - lengkap,
    rataRata: list.length > 0 ? Math.round(totalPersen / list.length) : 0,
    fieldKosong,
  };
}
