import fs from "node:fs";
import {
  ASSET_CONDITIONS,
  ASSET_CONDITION_UNSET,
  assetConditionLabel,
  isValidAssetCondition,
  normalizeAssetCondition,
  scanMissingAssetConditions,
} from "../src/lib/assetCondition";
import { filterEquipmentReport, filterVehicleReport } from "../src/lib/reporting";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}
const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

assert(normalizeAssetCondition(" NULL ") === "", "placeholder legacy harus tetap kosong");
assert(assetConditionLabel(undefined) === ASSET_CONDITION_UNSET, "kondisi kosong harus dilabeli BELUM DIISI");
assert(assetConditionLabel(" baik ") === "BAIK", "kondisi valid harus dinormalkan");
assert(ASSET_CONDITIONS.length === 4 && isValidAssetCondition("KURANG BAIK"), "empat kondisi resmi harus didukung");
assert(!isValidAssetCondition("") && !isValidAssetCondition("SEMPURNA"), "nilai kosong/tidak baku harus ditolak untuk data baru");

const vehicles: any[] = [
  { asset_id: "V1", no_polisi: "B 1 ABC", merk: "Toyota", kondisi: "", pengguna: "Andi" },
  { asset_id: "V2", no_polisi: "B 2 ABC", merk: "Honda", kondisi: "BAIK", pengguna: "Budi" },
];
const equipment: any[] = [
  { asset_id: "E1", nama_aset: "Printer", merk: "Epson", kondisi: null, pengguna: "Cici" },
  { asset_id: "E2", nama_aset: "Laptop", merk: "HP", kondisi: "RUSAK RINGAN", pengguna: "Dedi" },
];
const missing = scanMissingAssetConditions(vehicles, equipment);
assert(missing.length === 2, "scanner harus menemukan kondisi kosong tanpa mengubah data");
assert(missing[0].editPath.includes("/kendaraan?edit=V1") && missing[1].editPath.includes("/alat-mesin?edit=E1"), "setiap temuan harus memiliki deep-link edit");
assert(filterVehicleReport(vehicles, { search: "", jenis: "", kondisi: "BELUM DIISI", tahun: "", pengguna: "" }).length === 1, "laporan kendaraan harus dapat memfilter kondisi kosong");
assert(filterEquipmentReport(equipment, { search: "", jenis: "", kondisi: "BELUM DIISI", tahun: "", pengguna: "" }).length === 1, "laporan alat harus dapat memfilter kondisi kosong");

const service = read("src/services/spreadsheetService.ts");
const vehiclePage = read("src/pages/Kendaraan.tsx");
const equipmentPage = read("src/pages/AlatMesin.tsx");
const cleansing = read("src/pages/Cleansing.tsx");
const map = read("src/pages/PetaSebaran.tsx");
const report = read("src/pages/Laporan.tsx");
const badge = read("src/components/ui/Badge.tsx");
const backend = read("apps-script/Code.gs");

assert(!service.includes('item.condition || "BAIK"') && !service.includes('item.kondisi || "BAIK"'), "service tidak boleh memalsukan kondisi kosong menjadi BAIK");
for (const [name, source] of [["Kendaraan", vehiclePage], ["Alat & Mesin", equipmentPage]] as const) {
  assert(source.includes("Kondisi Wajib Dipilih") && source.includes("required={!formData.asset_id}"), `${name}: create harus mewajibkan kondisi`);
  assert(source.includes("if (isValidAssetCondition(normalizedCondition)) payload.kondisi = normalizedCondition"), `${name}: update legacy harus menghilangkan mutasi kondisi semu`);
  assert(source.includes('get("edit")') && source.includes("handledEditIdRef"), `${name}: deep-link cleansing harus membuka edit satu kali`);
}
assert(cleansing.includes("scanMissingAssetConditions") && cleansing.includes("tidak tersedia pengisian otomatis atau massal"), "Data Cleansing harus menampilkan audit kondisi secara aman");
assert(map.includes("assetConditionLabel") && !map.includes('condition: v.kondisi || "BAIK"'), "Peta tidak boleh menganggap kondisi kosong sebagai BAIK");
assert(report.includes("assetConditionLabel"), "ekspor dan print laporan harus memberi label kondisi kosong");
assert(badge.indexOf('s.includes("kurang baik")') < badge.indexOf('s === "baik"'), "KURANG BAIK tidak boleh menerima badge hijau");
assert(backend.includes("VALID_ASSET_CONDITIONS") && backend.includes("normalizeAssetCondition_(data, isNew)"), "backend harus memvalidasi enum kondisi");
assert(backend.includes("delete data.kondisi") && backend.includes("version: '1.1.16-production'"), "backend update legacy harus mempertahankan kondisi kosong dan melaporkan versi terbaru");

console.log("revision-v1110-tests: OK");
