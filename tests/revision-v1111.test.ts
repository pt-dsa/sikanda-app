import fs from "node:fs";
import {
  ASSET_CONDITION_CARD_DEFINITIONS,
  summarizeAssetConditions,
} from "../src/lib/assetCondition";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

assert(
  ASSET_CONDITION_CARD_DEFINITIONS.map((item) => item.label).join("|") ===
    "Kondisi Baik|Kurang Baik|Rusak Ringan|Rusak Berat",
  "empat card kondisi harus selalu memiliki label dan urutan resmi"
);

const summary = summarizeAssetConditions([
  { kondisi: "BAIK" },
  { kondisi: " baik " },
  { kondisi: "KURANG BAIK" },
  { kondisi: "" },
  { kondisi: null },
]);
assert(summary.items.length === 4, "empat card kondisi harus tetap dibentuk saat sebagian bernilai nol");
assert(summary.items[0].count === 2, "normalisasi kondisi BAIK harus konsisten");
assert(summary.items[1].count === 1, "KURANG BAIK harus dihitung pada card sendiri");
assert(summary.items[2].count === 0 && summary.items[3].count === 0, "card kondisi bernilai nol tidak boleh hilang");
assert(summary.unset === 2, "kondisi kosong harus dihitung terpisah dari empat card resmi");

const vehicle = read("src/pages/Kendaraan.tsx");
const equipment = read("src/pages/AlatMesin.tsx");
const summaryCards = read("src/components/ui/SummaryCards.tsx");
const employee = read("src/pages/Pegawai.tsx");
const watchBook = read("src/pages/BukuPenjagaan.tsx");
const cleansing = read("src/pages/Cleansing.tsx");
const dashboard = read("src/pages/Dashboard.tsx");
const backend = read("apps-script/Code.gs");

for (const [name, source] of [["Kendaraan", vehicle], ["Alat & Mesin", equipment]] as const) {
  assert(source.includes("summarizeAssetConditions(data)"), `${name}: card harus memakai ringkasan kondisi tetap`);
  assert(source.includes("kondisiSummary.unset") && source.includes("ASSET_CONDITION_UNSET"), `${name}: kondisi kosong harus menjadi peringatan/filter terpisah`);
  assert(source.includes("Verifikasi melalui form edit atau Data Cleansing"), `${name}: banner harus memberi jalur perbaikan yang jelas`);
}
assert(vehicle.includes('totalLabel="Total Kendaraan"'), "judul total kendaraan harus eksplisit");
assert(equipment.includes('totalLabel="Total Alat & Mesin"'), "judul total alat & mesin harus eksplisit");
assert(summaryCards.includes("text-sm font-extrabold") && !summaryCards.includes("c.label.toLowerCase()"), "judul card bersama harus lebih besar, tebal, dan mempertahankan ejaan label");
assert(summaryCards.includes("grid grid-cols-2") && summaryCards.includes("lg:grid-cols-5"), "ringkasan lima card harus mobile-first dan menjadi lima kolom di desktop");
assert(vehicle.includes("flex flex-col sm:flex-row") && equipment.includes("flex flex-col sm:flex-row"), "banner kualitas data harus beradaptasi pada layar mobile");
assert(employee.includes("text-sm font-extrabold leading-snug"), "judul card ASN/PPPK harus lebih besar dan tebal");
assert(watchBook.includes("text-sm font-extrabold leading-snug"), "judul card Buku Penjagaan harus lebih besar dan tebal");
assert(cleansing.includes("text-sm font-extrabold") && dashboard.includes("text-base font-extrabold"), "judul card menu lain harus diaudit dan diperjelas");
assert(backend.includes("version: '1.1.13-secure'"), "endpoint backend harus melaporkan versi V1.1.13");

console.log("revision-v1111-tests: OK");
