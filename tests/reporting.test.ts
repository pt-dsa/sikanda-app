import { filterAgendaReport, filterPegawaiReport, filterVehicleReport } from "../src/lib/reporting";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}

const employees: any[] = [
  { nip: "1", nama: "Andi", status: "ASN", kategori_pppk: "", golongan: "III/a", unit_kerja: "Sekretariat", jabatan: "Analis", email: "andi@example.go.id" },
  { nip: "2", nama: "Budi", status: "PPPK", kategori_pppk: "penuh_waktu", golongan: "IX", unit_kerja: "UPTD", jabatan: "Operator", email: "budi@example.go.id" },
];
assert(filterPegawaiReport(employees, { search: "budi", status: "PPPK", kategoriPppk: "penuh_waktu", golongan: "", unitKerja: "" }).length === 1, "Filter pegawai harus menggabungkan pencarian dan status");

const agenda: any[] = [
  { nip: "1", nama: "Andi", jabatan: "Analis", bidang: "Sekretariat", kategori: "KGB", tanggal: "2026-08-01", selisihHari: 21 },
  { nip: "2", nama: "Budi", jabatan: "Operator", bidang: "UPTD", kategori: "PANGKAT", tanggal: "2027-01-01", selisihHari: 174 },
  { nip: "3", nama: "Cici", jabatan: "Analis", bidang: "UPTD", kategori: "BUP", tanggal: "2026-01-01", selisihHari: -20 },
];
assert(filterAgendaReport(agenda, { search: "", kategori: "", rentang: "le6", unitKerja: "", tanggalMulai: "", tanggalSelesai: "" }).length === 2, "Rentang agenda enam bulan harus mengecualikan keterlambatan");
assert(filterAgendaReport(agenda, { search: "", kategori: "BUP", rentang: "terlambat", unitKerja: "", tanggalMulai: "", tanggalSelesai: "" }).length === 1, "Filter agenda terlambat harus tepat");

const vehicles: any[] = [
  { asset_id: "V1", no_polisi: "B 1 ABC", nama_aset: "Kendaraan Roda 4", merk: "Toyota", jenis_kendaraan: "Roda 4", kondisi: "BAIK", tahun: "2020", pengguna: "Andi" },
  { asset_id: "V2", no_polisi: "B 2 ABC", nama_aset: "Kendaraan Roda 2", merk: "Honda", jenis_kendaraan: "Roda 2", kondisi: "RUSAK RINGAN", tahun: "2021", pengguna: "Budi" },
];
assert(filterVehicleReport(vehicles, { search: "honda", jenis: "Roda 2", kondisi: "RUSAK RINGAN", tahun: "", pengguna: "" }).length === 1, "CSV kendaraan harus mengikuti seluruh filter aktif");

console.log("reporting-tests: OK");
