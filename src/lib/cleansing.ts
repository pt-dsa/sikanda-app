// ---------------------------------------------------------------------------
// SIKANDA — Modul Deteksi Data Cleansing (Tahap 6)
// ---------------------------------------------------------------------------
// Semua fungsi di sini MURNI (no side effects): hanya membaca data pegawai
// dan menghasilkan daftar masalah. Penulisan koreksi dilakukan lewat
// apiService.savePegawai() di halaman Cleansing.tsx.
//
// Format tanggal standar SIKANDA: "D Month YYYY" Indonesia (mis. "8 September 1979").
// Fungsi formatDate() di utils.ts menghasilkan format ini — dipakai sebagai referensi.
// ---------------------------------------------------------------------------

import { parseAnyDate, formatDate } from "@/lib/utils";
import type { Pegawai } from "@/types";

// ---------------------------------------------------------------------------
// Sheet aset yang didukung untuk auto-koreksi holder_name (lihat Code.gs
// action `asset_fix_holder`). Nama harus PERSIS sama dengan nama sheet asli.
// ---------------------------------------------------------------------------
export type AssetSheetName = "assets_vehicle" | "assets_equipment";

export const ASSET_SHEET_LABEL: Record<AssetSheetName, string> = {
  assets_vehicle: "Kendaraan",
  assets_equipment: "Alat & Mesin",
};

// ---------------------------------------------------------------------------
// Fuzzy name matching — Levenshtein distance based similarity (0..1).
// Dipakai khusus untuk mendeteksi kemiripan nama pegawai vs holder_name aset
// (typo, beda spasi, beda urutan gelar) dengan akurasi terukur, BUKAN sekadar
// pencocokan token sederhana seperti exactKey/fuzzyKey di spreadsheetService.
// ---------------------------------------------------------------------------
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prevDiag = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prevDiag : 1 + Math.min(prevDiag, dp[j], dp[j - 1]);
      prevDiag = tmp;
    }
  }
  return dp[n];
}

/** Similarity 0..1 (1 = identik). */
export function nameSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

/** Normalisasi nama untuk pembanding: uppercase, buang gelar setelah koma, rapikan spasi. */
export function normalizeNamaForMatch(s: string): string {
  return String(s || "")
    .toUpperCase()
    .split(",")[0]            // "ADE SUPRIZAL, ST, MT" → "ADE SUPRIZAL"
    .replace(/\s+/g, " ")
    .trim();
}

// Ambang kemiripan: di bawah ini dianggap tidak berhubungan sama sekali.
const SIMILARITY_MIN_RELEVANT = 0.70;
// Di atas/sama ambang ini: kemiripan "Tinggi" (kemungkinan typo/format kecil).
const SIMILARITY_HIGH = 0.90;

export interface AssetNameIssue {
  id: string;                  // kunci unik: sheet|asset_id
  sheet: AssetSheetName;
  sheetLabel: string;
  assetId: string;
  assetLabel: string;          // label tampilan aset (merk/tipe/no.polisi atau nama_aset)
  currentHolder: string;       // holder_name SAAT INI di sheet aset (mengandung typo/beda format)
  matchedNip: string;
  matchedNama: string;         // nama BAKU dari sheet pegawai (sumber kebenaran)
  similarity: number;          // 0..1
  confidence: "tinggi" | "sedang";
}

/**
 * Bandingkan setiap holder_name aset terhadap seluruh nama pegawai, cari
 * kecocokan TERBAIK yang BUKAN exact match (exact match berarti sudah benar,
 * tidak perlu dikoreksi). Hanya kandidat dengan similarity >= 0.70 disertakan;
 * di bawah itu dianggap tidak berhubungan (hindari salah-gabung nama berbeda).
 */
export function scanAssetNameMismatches(
  pegawaiList: Pegawai[],
  assets: Array<{ sheet: AssetSheetName; assetId: string; assetLabel: string; holderName: string }>
): AssetNameIssue[] {
  const pegawaiNorm = pegawaiList
    .map((p) => ({
      nip: String(p.nip || "").trim(),
      nama: String(p.nama || "").trim(),
      norm: normalizeNamaForMatch(p.nama),
    }))
    .filter((p) => p.nip && p.norm);

  const issues: AssetNameIssue[] = [];

  for (const a of assets) {
    const holder = String(a.holderName || "").trim();
    if (!holder || holder === "-") continue;
    const holderNorm = normalizeNamaForMatch(holder);
    if (!holderNorm) continue;

    // Sudah exact match ke salah satu pegawai → tidak ada masalah, lewati.
    if (pegawaiNorm.some((p) => p.norm === holderNorm)) continue;

    let best: { nip: string; nama: string; score: number } | null = null;
    for (const p of pegawaiNorm) {
      const score = nameSimilarity(holderNorm, p.norm);
      if (!best || score > best.score) best = { nip: p.nip, nama: p.nama, score };
    }
    if (!best || best.score < SIMILARITY_MIN_RELEVANT) continue;

    issues.push({
      id: `${a.sheet}|${a.assetId}`,
      sheet: a.sheet,
      sheetLabel: ASSET_SHEET_LABEL[a.sheet],
      assetId: a.assetId,
      assetLabel: a.assetLabel,
      currentHolder: holder,
      matchedNip: best.nip,
      matchedNama: best.nama,
      similarity: best.score,
      confidence: best.score >= SIMILARITY_HIGH ? "tinggi" : "sedang",
    });
  }

  // Urutkan: kemiripan tertinggi dulu (paling layak ditinjau pertama).
  return issues.sort((x, y) => y.similarity - x.similarity);
}

// Kode masalah — dipakai sebagai ID filter di UI
export type IssueCode =
  | "NIP_KOSONG"
  | "NIP_BUKAN_18_DIGIT"
  | "NIP_DUPLIKAT"
  | "FIELD_WAJIB_KOSONG"
  | "STATUS_TIDAK_VALID"
  | "TANGGAL_TIDAK_STANDAR"
  | "NAMA_SPASI_GANDA"
  | "MATCH_ASET_NONE";

export type IssueLevel = "kritis" | "tinggi" | "sedang" | "info";

export interface CleansingIssue {
  nip: string;          // NIP pegawai (string eksak)
  nama: string;         // Nama untuk tampilan
  kode: IssueCode;
  field: string;        // Kunci field yang bermasalah (sesuai Pegawai interface)
  fieldLabel: string;   // Label tampilan
  nilaiLama: string;    // Nilai asli dari spreadsheet (untuk konfirmasi)
  saranPerbaikan: string; // Nilai yang disarankan (untuk auto-koreksi: ini yang ditulis)
  bisaAutoKoreksi: boolean; // true → tombol Terapkan aktif
  level: IssueLevel;
}

// Kunci unik per isu (untuk tracking status "applied")
export function issueKey(i: CleansingIssue): string {
  return `${i.nip}|${i.kode}|${i.field}`;
}

// ---------------------------------------------------------------------------
// scanPegawai — fungsi utama: pindai seluruh daftar pegawai, kembalikan isu
// ---------------------------------------------------------------------------
export function scanPegawai(list: Pegawai[]): CleansingIssue[] {
  const issues: CleansingIssue[] = [];

  // -- Hitung kemunculan NIP untuk deteksi duplikat --
  const nipCount = new Map<string, number>();
  for (const p of list) {
    const nip = String(p.nip ?? "").trim();
    if (nip) nipCount.set(nip, (nipCount.get(nip) ?? 0) + 1);
  }

  for (const p of list) {
    const nip   = String(p.nip  ?? "").trim();
    const nama  = String(p.nama ?? "").trim();

    // ── 1. NIP KOSONG ────────────────────────────────────────────────────────
    if (!nip) {
      issues.push({
        nip, nama, kode: "NIP_KOSONG",
        field: "nip", fieldLabel: "NIP",
        nilaiLama: "-",
        saranPerbaikan: "Isi NIP 18 digit numerik",
        bisaAutoKoreksi: false,
        level: "kritis",
      });
      continue; // tanpa NIP, cek duplikat & spasi tidak bermakna
    }

    // ── 2. NIP BUKAN 18 DIGIT ───────────────────────────────────────────────
    if (!/^\d{18}$/.test(nip)) {
      issues.push({
        nip, nama, kode: "NIP_BUKAN_18_DIGIT",
        field: "nip", fieldLabel: "NIP",
        nilaiLama: nip,
        saranPerbaikan: `NIP harus tepat 18 digit numerik (sekarang: ${nip.length} karakter)`,
        bisaAutoKoreksi: false,
        level: "kritis",
      });
    }

    // ── 3. NIP DUPLIKAT ──────────────────────────────────────────────────────
    if ((nipCount.get(nip) ?? 0) > 1) {
      issues.push({
        nip, nama, kode: "NIP_DUPLIKAT",
        field: "nip", fieldLabel: "NIP",
        nilaiLama: nip,
        saranPerbaikan: "NIP ini muncul di lebih dari satu baris — periksa dan perbaiki secara manual",
        bisaAutoKoreksi: false,
        level: "kritis",
      });
    }

    // ── 4. FIELD WAJIB KOSONG ────────────────────────────────────────────────
    const REQUIRED: Array<{ key: keyof Pegawai; label: string }> = [
      { key: "jabatan",           label: "Jabatan" },
      { key: "golongan",          label: "Golongan" },
      { key: "tgl_mulai_golongan",label: "TMT Golongan" },
      { key: "tgl_lahir",         label: "Tanggal Lahir" },
    ];
    for (const { key, label } of REQUIRED) {
      const val = String((p as any)[key] ?? "").trim();
      if (!val) {
        issues.push({
          nip, nama, kode: "FIELD_WAJIB_KOSONG",
          field: key as string, fieldLabel: label,
          nilaiLama: "-",
          saranPerbaikan: `Isi kolom ${label}`,
          bisaAutoKoreksi: false,
          level: "kritis",
        });
      }
    }

    // ── 5. STATUS TIDAK VALID ────────────────────────────────────────────────
    const status = String(p.status ?? "").trim().toUpperCase();
    const VALID_STATUS = ["ASN", "PPPK", "HONORER", "PENSIUN"];
    if (!VALID_STATUS.includes(status)) {
      issues.push({
        nip, nama, kode: "STATUS_TIDAK_VALID",
        field: "status", fieldLabel: "Status",
        nilaiLama: status || "-",
        saranPerbaikan: "Status harus salah satu dari: ASN, PPPK, HONORER, PENSIUN",
        bisaAutoKoreksi: false,
        level: "tinggi",
      });
    }

    // ── 6. TANGGAL TIDAK STANDAR ─────────────────────────────────────────────
    // Standar SIKANDA: "D Month YYYY" Indonesia misal "8 September 1979".
    // Deteksi: formatDate(raw) berbeda dari raw → belum dalam format standar.
    // Auto-koreksi: simpan formatDate(raw) ke spreadsheet via pegawai_save.
    // (Backend Code.gs dengan fix _applyFields akan menyimpan dalam fmtIndo_()).
    const DATE_CHECKS: Array<{ key: keyof Pegawai; label: string }> = [
      { key: "tgl_lahir",          label: "Tanggal Lahir" },
      { key: "tgl_mulai_golongan", label: "TMT Golongan" },
      { key: "tgl_mulai_jabatan",  label: "TMT Jabatan" },
    ];
    for (const { key, label } of DATE_CHECKS) {
      const raw = String((p as any)[key] ?? "").trim();
      if (!raw) continue; // kosong → sudah ditangani FIELD_WAJIB_KOSONG

      // parseAnyDate bisa membaca berbagai format; jika gagal → tidak bisa auto-fix
      const parsed = parseAnyDate(raw);
      if (!parsed) continue; // tidak terbaca sama sekali → biarkan (informasi manual saja)

      const normalized = formatDate(raw); // "D Month YYYY" Indonesia
      if (normalized === raw) continue;  // sudah dalam format yang benar

      issues.push({
        nip, nama, kode: "TANGGAL_TIDAK_STANDAR",
        field: key as string, fieldLabel: label,
        nilaiLama: raw,
        saranPerbaikan: normalized,
        bisaAutoKoreksi: true,
        level: "tinggi",
      });
    }

    // ── 7. NAMA SPASI GANDA / TRAILING ───────────────────────────────────────
    // Spasi ganda dapat mengganggu name-matching dengan data aset.
    const namaRaw    = String(p.nama ?? "");
    const namaBersih = namaRaw.trim().replace(/\s+/g, " ");
    if (namaBersih !== namaRaw) {
      issues.push({
        nip, nama, kode: "NAMA_SPASI_GANDA",
        field: "nama", fieldLabel: "Nama Lengkap",
        nilaiLama: namaRaw,
        saranPerbaikan: namaBersih,
        bisaAutoKoreksi: true,
        level: "sedang",
      });
    }

    // ── 8. MATCH ASET NONE (informasi) ──────────────────────────────────────
    if (p.match_quality === "none") {
      issues.push({
        nip, nama, kode: "MATCH_ASET_NONE",
        field: "nama", fieldLabel: "Match Aset",
        nilaiLama: nama,
        saranPerbaikan:
          "Tidak ada aset yang cocok — periksa konsistensi ejaan nama di sheet aset",
        bisaAutoKoreksi: false,
        level: "info",
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// buildCorrectionPayload — bangun payload untuk apiService.savePegawai()
// Hanya untuk isu yang bisaAutoKoreksi=true.
// ---------------------------------------------------------------------------
export function buildCorrectionPayload(
  p: Pegawai,
  issue: CleansingIssue
): Partial<Pegawai> | null {
  if (!issue.bisaAutoKoreksi) return null;
  const payload: any = { nip: p.nip };
  payload[issue.field] = issue.saranPerbaikan;
  return payload as Partial<Pegawai>;
}

// ---------------------------------------------------------------------------
// Metadata UI per IssueCode (label tab, warna, ikon)
// ---------------------------------------------------------------------------
export const ISSUE_META: Record<
  IssueCode,
  { label: string; short: string; color: string }
> = {
  NIP_KOSONG:          { label: "NIP Kosong",          short: "NIP",      color: "text-red-600 dark:text-red-400" },
  NIP_BUKAN_18_DIGIT:  { label: "NIP Tidak 18 Digit",  short: "NIP",      color: "text-red-600 dark:text-red-400" },
  NIP_DUPLIKAT:        { label: "NIP Duplikat",         short: "Duplikat", color: "text-red-600 dark:text-red-400" },
  FIELD_WAJIB_KOSONG:  { label: "Field Wajib Kosong",  short: "Kosong",   color: "text-red-600 dark:text-red-400" },
  STATUS_TIDAK_VALID:  { label: "Status Tidak Valid",   short: "Status",   color: "text-orange-600 dark:text-orange-400" },
  TANGGAL_TIDAK_STANDAR:{ label: "Format Tanggal",     short: "Tanggal",  color: "text-amber-600 dark:text-amber-400" },
  NAMA_SPASI_GANDA:    { label: "Spasi Nama",           short: "Spasi",    color: "text-yellow-600 dark:text-yellow-400" },
  MATCH_ASET_NONE:     { label: "Tidak Match Aset",    short: "Aset",     color: "text-blue-600 dark:text-blue-400" },
};

export const LEVEL_META: Record<
  IssueLevel,
  { label: string; badge: string }
> = {
  kritis: { label: "Kritis", badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  tinggi: { label: "Tinggi", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  sedang: { label: "Sedang", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  info:   { label: "Info",   badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
};
