import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const shell = read("src/components/layout/AppShell.tsx");
const app = read("src/App.tsx");
const equipmentPage = read("src/pages/AlatMesin.tsx");
const developmentPage = read("src/pages/Inventaris.tsx");
const report = read("src/pages/Laporan.tsx");
const globalSearch = read("src/components/ui/GlobalSearch.tsx");
const map = read("src/pages/PetaSebaran.tsx");
const employeeDetail = read("src/components/ui/PegawaiDetailModal.tsx");
const dashboard = read("src/pages/Dashboard.tsx");
const cleansing = read("src/lib/cleansing.ts");
const condition = read("src/lib/assetCondition.ts");
const media = read("src/lib/media.ts");
const backend = read("apps-script/Code.gs");
const pkg = read("package.json");
const metadata = read("metadata.json");

assert(
  shell.includes('{ icon: Wrench, label: "Inventaris", href: "/alat-mesin", menu: "alat-mesin" }') &&
    shell.includes('{ icon: Package, label: "Alat & Mesin", href: "/inventaris", menu: "inventaris" }'),
  "sidebar harus menukar judul kedua menu tanpa mengubah route dan kunci izin internal",
);

for (const label of [
  "Data Inventaris",
  "Total Inventaris",
  "Detail Inventaris",
  "Foto Inventaris",
  "Edit Inventaris",
  "Tambah Inventaris",
  "Data Inventaris Berhasil Ditambahkan",
]) {
  assert(equipmentPage.includes(label), `modul CRUD aktif harus menggunakan label ${label}`);
}
assert(!equipmentPage.includes("Data Alat & Mesin"), "modul CRUD aktif tidak boleh lagi berjudul Data Alat & Mesin");

assert(
  developmentPage.includes("Menu Alat &amp; Mesin dalam Pengembangan") &&
    !developmentPage.includes("Menu Inventaris dalam Pengembangan"),
  "halaman pengembangan harus berganti judul menjadi Alat & Mesin",
);

assert(
  report.includes('rowsToPrintTable("Data Inventaris"') &&
    report.includes('value="equipment">Data Inventaris') &&
    report.includes("Data_Inventaris_") &&
    !report.includes("Data Alat & Mesin"),
  "filter, cetak, dan nama CSV laporan harus menggunakan Data Inventaris",
);

assert(
  globalSearch.includes('title: "Inventaris", subtitle: "Kelola data inventaris"') &&
    globalSearch.includes('"Data Inventaris"'),
  "pencarian global harus menampilkan modul dan hasil equipment sebagai Inventaris",
);

assert(
  map.includes('type: "Inventaris"') && map.includes('stats[\'Inventaris\']') &&
    !map.includes('type: "Alat & Mesin"'),
  "kategori, filter, marker, dan statistik peta harus menggunakan Inventaris",
);

assert(
  employeeDetail.includes("Inventaris ({pegawai.assets_alat_mesin.length})") &&
    employeeDetail.includes("Alat & Mesin ({pegawai.assets_inventaris.length})"),
  "detail pegawai harus menukar judul kelompok aset secara konsisten",
);

assert(
  dashboard.includes("relasi kendaraan atau inventaris") &&
    cleansing.includes('assets_equipment: "Inventaris"') &&
    condition.includes('kindLabel: "Kendaraan" | "Inventaris"'),
  "dashboard, cleansing, dan ringkasan kondisi harus memakai label Inventaris",
);

assert(
    backend.includes("version: '1.1.16-production'") &&
    backend.includes("type: table === 'assets_vehicle' ? 'Kendaraan' : 'Inventaris'") &&
    backend.includes("/(alat|mesin|peralatan|inventaris)/.test(q)") &&
    backend.includes("Modul Pagu Anggaran, Pemeliharaan, Alat & Mesin, dan Peminjaman masih dikembangkan") &&
    backend.includes("data inventaris"),
  "Apps Script dan Tanya SIKANDA harus mengikuti label baru serta versi V1.1.16",
);

assert(
  app.includes('path="/alat-mesin"') && app.includes('path="/inventaris"') &&
    backend.includes("assets_equipment") && media.includes('["Alat & Mesin", "AlatMesin"]'),
  "route, tabel database, action, dan alias folder foto legacy harus tetap kompatibel",
);

assert(
  pkg.includes('"version": "1.1.16"') && metadata.includes("SIKANDA V1.1.16 Full Replacement"),
  "versi paket dan metadata harus konsisten V1.1.16",
);

console.log("revision-v1116-menu-label-swap-tests: OK");
