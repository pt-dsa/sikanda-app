import fs from "node:fs";
import { buildUpcomingBirthdays } from "../src/lib/birthdays";
import { filterEquipmentReport } from "../src/lib/reporting";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const employeeBase: any = {
  jabatan: "Analis", unit_kerja: "Sekretariat", golongan: "III/a", status: "ASN",
  kategori_pppk: "", tgl_mulai_golongan: "2024-01-01", tgl_mulai_jabatan: "2024-01-01",
  tgl_kgb: "", tgl_pangkat: "", tgl_pensiun: "", masa_kerja_tahun: 10, masa_kerja_bulan: 0,
  tingkat: "S-1", pendidikan_jurusan: "Teknik", universitas: "Universitas", tahun_lulus: "2010",
  riwayat_diklat: "", tahun_diklat: "", usia: "", kontak: "", email: "", keterangan: "",
  catatan_mutasi_masuk: "", catatan_mutasi_keluar: "", foto: "", assets: [], assets_kendaraan: [],
  assets_alat_mesin: [], assets_inventaris: [], match_quality: "none",
};

const birthdays = buildUpcomingBirthdays([
  { ...employeeBase, nip: "1", nama: "Hari Ini", tgl_lahir: "1990-07-12" },
  { ...employeeBase, nip: "2", nama: "Tujuh Hari", tgl_lahir: "1992-07-19" },
  { ...employeeBase, nip: "3", nama: "Delapan Hari", tgl_lahir: "1993-07-20" },
], 7, new Date(2026, 6, 12));
assert(birthdays.length === 2, "Notifikasi ulang tahun harus mencakup hari ini sampai tujuh hari mendatang secara inklusif");
assert(birthdays[0].daysUntil === 0 && birthdays[1].daysUntil === 7, "Urutan ulang tahun harus berdasarkan hari terdekat");

const equipment: any[] = [
  { asset_id: "E1", nama_aset: "Printer", merk: "Epson", jenis: "Elektronik", kondisi: "BAIK", tahun: 2024, pengguna: "Andi" },
  { asset_id: "E2", nama_aset: "Pompa", merk: "Honda", jenis: "Mesin", kondisi: "RUSAK BERAT", tahun: 2022, pengguna: "Budi" },
];
assert(filterEquipmentReport(equipment, { search: "pompa", jenis: "Mesin", kondisi: "RUSAK BERAT", tahun: "2022", pengguna: "Budi" }).length === 1, "Filter laporan Alat & Mesin harus mengikuti seluruh filter aktif");

const dashboard = read("src/pages/Dashboard.tsx");
const report = read("src/pages/Laporan.tsx");
const vehicle = read("src/pages/Kendaraan.tsx");
const machine = read("src/pages/AlatMesin.tsx");
const account = read("src/pages/KelolaAkun.tsx");
const shell = read("src/components/layout/AppShell.tsx");
const backend = read("apps-script/Code.gs");

assert(dashboard.includes("Sinkronisasi Data") && dashboard.includes("Terlewat") && dashboard.includes("min-h-[310px]"), "Dashboard harus memiliki sinkronisasi, istilah Terlewat, dan komposisi SDM proporsional");
for (const option of ["Data ASN / PPPK", "Buku Penjagaan", "Data Kendaraan", "Data Alat & Mesin", "Seluruh Data"]) assert(report.includes(option), `Pilihan cetak ${option} harus tersedia`);
assert(report.includes("display:flex") && report.includes("data-columns") && report.includes("table-layout:fixed"), "Kop dan tabel cetak harus memakai layout cetak proporsional");
assert(vehicle.includes("EmployeeAutocomplete") && vehicle.includes("AssetMediaFields") && vehicle.includes("uploadAssetFoto"), "Kendaraan harus memakai pegawai resmi, GPS, kamera/galeri, dan upload foto");
assert(machine.includes("EmployeeAutocomplete") && machine.includes("AssetMediaFields") && machine.includes("uploadAssetFoto"), "Alat & Mesin harus memakai pegawai resmi, GPS, kamera/galeri, dan upload foto");
assert(account.includes("Jabatan Pegawai") && account.includes("selectedEmployee?.jabatan"), "Tambah Akun harus menampilkan Jabatan Pegawai");
assert(shell.includes("buildUpcomingBirthdays") && shell.includes("totalNotif") && shell.includes("Ulang Tahun Hari Ini–7 Hari"), "Lonceng harus menghitung agenda dan ulang tahun yang ditampilkan");
assert(backend.includes("uploadAssetFoto_") && backend.includes("asset.photo.update"), "Backend harus menyimpan foto aset secara aman");
assert(backend.includes("birthdayAnswer_") && backend.includes("employeeCompositionAnswer_") && backend.includes("assetListAnswer_"), "Tanya SIKANDA database-first harus menguasai konteks pegawai dan aset");

console.log("revision-v114-tests: OK");
