import fs from "node:fs";
import {
  isEmptyAssetField,
  normalizeAssetText,
  optionalAssetNumber,
  validOptionalAssetNumber,
} from "../src/lib/assetFields";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}
const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

assert(isEmptyAssetField("-") && normalizeAssetText("NULL") === "", "placeholder legacy harus dianggap kosong");
assert(optionalAssetNumber("1.250.000") === 1_250_000, "format ribuan Indonesia harus menjadi number database");
assert(optionalAssetNumber("12,5") === 12.5, "desimal koma harus diterima pada angka aset");
assert(optionalAssetNumber(0) === 0, "nilai nol tidak boleh dianggap kosong");
assert(validOptionalAssetNumber("2026", { integer: true, min: 1900, max: 2027 }), "tahun valid harus diterima");
assert(validOptionalAssetNumber("-", { min: 0 }), "placeholder kosong harus tetap valid sebagai field opsional");
assert(!validOptionalAssetNumber("abc", { min: 0 }), "teks nonangka harus ditolak");

const equipment = read("src/pages/AlatMesin.tsx");
const vehicle = read("src/pages/Kendaraan.tsx");
const accounts = read("src/pages/KelolaAkun.tsx");
const appShell = read("src/components/layout/AppShell.tsx");
const dashboard = read("src/pages/Dashboard.tsx");
const service = read("src/services/spreadsheetService.ts");
const api = read("src/services/apiService.ts");
const backend = read("apps-script/Code.gs");
const css = read("src/index.css");
const detailModal = read("src/components/ui/DetailModal.tsx");
const employeeDetailModal = read("src/components/ui/PegawaiDetailModal.tsx");
const employeeFormModal = read("src/components/ui/PegawaiFormModal.tsx");
const confirmModal = read("src/components/ui/ConfirmModal.tsx");
const report = read("src/pages/Laporan.tsx");
const map = read("src/pages/PetaSebaran.tsx");

assert(equipment.includes("normalizeAssetText") && equipment.includes("optionalAssetNumber"), "payload Alat & Mesin harus menormalkan placeholder dan angka legacy");
assert(service.includes('tahun: item.purchase_year ?? item.tahun ?? ""'), "data edit alat tidak boleh memakai tanda minus sebagai nilai tahun");
assert(backend.includes("normalizeAssetNumbers_(table, data)"), "backend harus menormalisasi angka aset sebelum mutasi");
assert(backend.includes("oldLatitude === Number(data.latitude)") && backend.includes("['latitude', 'longitude']"), "koordinat sama tidak boleh menulis ulang metadata lokasi");
assert(backend.includes("databasePublicError_") && backend.includes("22P02"), "error format database harus diterjemahkan secara aman");

for (const [name, source] of [["Kelola Akun", accounts], ["Data Kendaraan", vehicle], ["Alat & Mesin", equipment]] as const) {
  assert(source.includes("Sinkronisasi") && source.includes("RefreshCw"), `${name} harus memiliki tombol Sinkronisasi`);
}

assert(appShell.includes("| Pukul") && !appShell.includes("} - {timeStr"), "format waktu harus memakai pemisah dan kata Pukul");
assert(dashboard.includes("fillHeight") && dashboard.includes('labelClass="w-20 sm:w-24"'), "grafik Masa Kerja harus memenuhi card secara proporsional");
assert(accounts.includes("md:hidden") && accounts.includes("hidden md:block"), "Kelola Akun harus memakai card mobile dan tabel desktop");
assert(appShell.includes("flex-wrap sm:flex-nowrap") && appShell.includes("basis-full"), "topbar harus menyusun ulang pencarian pada mobile");
assert(equipment.includes("max-h-[100dvh]") && vehicle.includes("max-h-[100dvh]"), "modal aset harus mengikuti tinggi viewport mobile");
assert(css.includes("overflow-x: hidden") && css.includes("safe-area-inset-bottom"), "layout global harus mencegah overflow dan mendukung safe area mobile");
for (const [name, source] of [["detail umum", detailModal], ["detail pegawai", employeeDetailModal], ["form pegawai", employeeFormModal]] as const) {
  assert(source.includes("max-h-[100dvh]") && source.includes("p-0 sm:p-4"), `modal ${name} harus memakai viewport dinamis dan panel mobile penuh`);
}
assert(confirmModal.includes("min-h-11") && report.includes("min-h-11"), "aksi modal bersama dan laporan harus memenuhi target sentuh mobile");
assert(map.includes("calc(100vw-3rem)"), "popup peta tidak boleh lebih lebar daripada viewport mobile");

assert(service.includes("apiService.saveAsset('assets_vehicle'") && service.includes("apiService.saveAsset('assets_equipment'"), "create aset harus melewati API backend");
assert(api.includes('action: "asset_save"'), "frontend harus memanggil endpoint asset_save");
assert(backend.includes("supaRequest_('post', table, payload, 'return=representation')"), "backend create aset harus POST langsung ke tabel Supabase");
assert(backend.includes("version: '1.1.14-production'"), "backend terbaru harus mempertahankan endpoint versi produksi");

console.log("revision-v119-tests: OK");
