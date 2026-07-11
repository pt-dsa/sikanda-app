import { buildPenjagaanEvents, nextCycleDate, pensionDate } from "../src/lib/penjagaan";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}

const base = {
  nip: "123456789012345678",
  nama: "Data Uji",
  golongan: "III/a",
  jabatan: "Analis",
  unit_kerja: "Sekretariat",
  status: "ASN",
  tgl_mulai_golongan: "2025-01-01",
  tgl_kgb: nextCycleDate("2025-01-01", 2),
  tgl_pangkat: nextCycleDate("2025-01-01", 4),
  tgl_pensiun: pensionDate("1990-02-28", 58),
};

assert(base.tgl_kgb === "2027-01-01", "KGB pertama harus TMT + 2 tahun");
assert(buildPenjagaanEvents([base]).length === 3, "ASN memperoleh KGB, pangkat, dan BUP");
assert(buildPenjagaanEvents([{ ...base, status: "PPPK", kategori_pppk: "penuh_waktu" }]).length === 1, "PPPK penuh waktu hanya memperoleh KGB");
assert(buildPenjagaanEvents([{ ...base, status: "PPPK", kategori_pppk: "paruh_waktu" }]).length === 0, "PPPK paruh waktu tidak memperoleh agenda");
assert(buildPenjagaanEvents([{ ...base, status: "PPPK", kategori_pppk: "" }]).length === 0, "PPPK belum dikategorikan tidak boleh diasumsikan memperoleh agenda");
assert(pensionDate("2000-02-29", 58) === "2058-02-28", "29 Februari memakai hari terakhir Februari");

console.log("agenda-tests: OK");
