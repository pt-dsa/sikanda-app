// ---------------------------------------------------------------------------
// SIKANDA — Pembangun Konteks Data untuk "Tanya SIKANDA" (v2 — Kompres)
// ---------------------------------------------------------------------------
// Versi ini meminimalkan jumlah token yang dikirim ke Groq API:
//   • Format ringkas: tab-separated, header sekali di depan, bukan per baris
//   • Penjagaan: HANYA event terlambat + akan datang ≤24 bulan (bukan semua)
//   • Jabatan/unit dipotong 50 karakter
//   • Pendidikan diringkas (tingkat saja, tanpa nama jurusan panjang)
//   • Target: ≤8.000 token (sebelumnya ~18.000) → aman di semua model Groq
//
// PRINSIP: data NYATA saja — tidak ada data dummy. NIP selalu string.
// ---------------------------------------------------------------------------

import { buildPenjagaanEvents, sisaWaktuLabel } from "@/lib/penjagaan";
import { formatDate } from "@/lib/utils";
import type { Pegawai } from "@/types";

/** Nilai singkat: kosong → "-", potong maksimal `max` karakter. */
const S = (v: any, max = 0): string => {
  const s = String(v ?? "").trim();
  if (!s) return "-";
  return max > 0 && s.length > max ? s.slice(0, max) + "…" : s;
};

/** Ringkas tingkat pendidikan ke label pendek. */
function pendidikanPendek(tingkat: string): string {
  const t = String(tingkat || "").trim().toUpperCase();
  if (t.includes("STRATA II") || t === "S2" || t === "S-2") return "S2";
  if (t.includes("STRATA I") || t === "S1" || t === "S-1") return "S1";
  if (t.includes("DIPLOMA IV") || t === "D4" || t === "D-IV") return "D4";
  if (t.includes("DIPLOMA III") || t === "D3" || t === "D-III") return "D3";
  if (t.includes("DIPLOMA") || t === "D2" || t === "D1") return "D2";
  if (t.includes("SLTA") || t.includes("SMA") || t.includes("SMK")) return "SLTA";
  if (t.includes("SLTP") || t.includes("SMP")) return "SLTP";
  return t.slice(0, 6) || "-";
}

export function buildDataContext(
  pegawai: Pegawai[],
  vehicles: any[],
  equipment: any[],
  inventory: any[],
  config: Record<string, any> | null,
  question: string = ""
): string {
  const L: string[] = [];
  const today = new Date();
  
  // HEURISTIC RAG: Hanya sertakan tabel yang relevan dengan pertanyaan untuk menghemat kuota token Gemini.
  const q = question.toLowerCase();
  
  // Deteksi topik dari pertanyaan
  const isGeneral = q === "" || q.includes("ringkas") || q.includes("rekap") || q.includes("semua") || q.includes("total");
  const wantsPegawai = isGeneral || q.includes("pegawai") || q.includes("asn") || q.includes("pppk") || q.includes("siapa") || q.includes("pangkat") || q.includes("golongan") || q.includes("jabatan") || q.includes("nama") || q.includes("pensiun") || q.includes("kgb") || q.includes("bup") || q.includes("umur") || q.includes("tahun");
  const wantsVehicles = isGeneral || q.includes("kendaraan") || q.includes("motor") || q.includes("mobil") || q.includes("stnk") || q.includes("pajak") || q.includes("plat") || q.includes("nopol");
  const wantsEquipment = isGeneral || q.includes("alat") || q.includes("mesin") || q.includes("laptop") || q.includes("komputer") || q.includes("pc") || q.includes("printer") || q.includes("kondisi");
  const wantsInventory = isGeneral || q.includes("inventaris") || q.includes("meja") || q.includes("kursi") || q.includes("lemari") || q.includes("ruangan") || q.includes("aset");
  const wantsPenjagaan = isGeneral || q.includes("kgb") || q.includes("pensiun") || q.includes("bup") || q.includes("pangkat") || q.includes("waktu dekat") || q.includes("jatuh tempo") || q.includes("akan");

  // ── Meta ringkas (1 baris) ───────────────────────────────────────────────
  const tgl = today.toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
  const bup = config?.BUP_USIA ?? 58;
  L.push(
    `[SIKANDA] ${tgl} | Dinas Cipta Karya & Tata Ruang Tangsel | BUP ${bup}th` +
    ` | ${pegawai.length} pegawai | ${vehicles.length} kend / ${equipment.length} alat / ${inventory.length} inv`
  );

  // ── Pegawai — 10 kolom kompak, tab-separated ────────────────────────────
  if (wantsPegawai) {
    L.push("\nPEGAWAI [nama|nip|gol|tmt_gol|jabatan|status|lahir|pddk|kontak|email|n_aset]:");
    for (const p of pegawai) {
      L.push(
        [
          S(p.nama, 40),
          S(p.nip),
          S(p.golongan),
          S(formatDate(p.tgl_mulai_golongan)),
          S(p.jabatan, 50),
          S(p.status),
          S(formatDate(p.tgl_lahir)),
          pendidikanPendek(p.tingkat),
          S(p.kontak, 15),
          S(p.email, 30),
          String(p.assets?.length ?? 0),
        ].join("|")
      );
    }
  }

  // ── Buku Penjagaan — HANYA terlambat + ≤24 bulan ke depan ─────────────
  if (wantsPenjagaan) {
    const HARI_24BLN = 730;
    const events = buildPenjagaanEvents(pegawai)
      .filter((e) => e.isOverdue || e.selisihHari <= HARI_24BLN)
      .sort((a, b) => a.selisihHari - b.selisihHari);

    if (events.length > 0) {
      L.push("\nBUKU PENJAGAAN [kategori|nama|jabatan|bidang|tanggal|waktu] (terlambat + ≤24 bln):");
      for (const e of events) {
        L.push([e.kategori, S(e.nama, 35), S(e.jabatan, 40), S(e.bidang, 20), S(formatDate(e.tanggal)), sisaWaktuLabel(e)].join("|"));
      }
    }
  }

  // ── Kendaraan ────────────────────────────────────────────────────────────
  if (wantsVehicles) {
    L.push("\nKENDARAAN [id|kendaraan|nopol|pengguna|kondisi]:");
    for (const v of vehicles) {
      const kend = `${S(v.merk)} ${String(v.tipe ?? "").trim()}`.trim();
      L.push([S(v.asset_id), S(kend, 25), S(v.no_polisi), S(v.pengguna, 35), S(v.kondisi)].join("|"));
    }
  }

  // ── Alat & Mesin ─────────────────────────────────────────────────────────
  if (wantsEquipment && equipment.length > 0) {
    L.push("\nALAT_MESIN [id|nama|pengguna|kondisi|lokasi]:");
    for (const eq of equipment) {
      L.push([S(eq.asset_id), S(eq.nama_aset, 30), S(eq.pengguna, 35), S(eq.kondisi), S(eq.lokasi, 25)].join("|"));
    }
  }

  // ── Inventaris ────────────────────────────────────────────────────────────
  if (wantsInventory && inventory.length > 0) {
    L.push("\nINVENTARIS [id|nama|pengguna|kondisi|lokasi]:");
    for (const iv of inventory) {
      L.push([S(iv.asset_id), S(iv.nama_aset, 30), S(iv.pengguna, 35), S(iv.kondisi), S(iv.lokasi_ruangan || iv.lokasi, 25)].join("|"));
    }
  }

  return L.join("\n");
}
