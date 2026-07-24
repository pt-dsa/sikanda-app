import assert from "node:assert/strict";
import fs from "node:fs";
import { scanAssetEmployeeLinks } from "../src/lib/cleansing";
import { normalizeData, toSearchText } from "../src/lib/utils";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const employee = {
  nip: "198001012005011001",
  nama: "BUDI SANTOSO, S.T.",
  jabatan: "Penata Layanan Operasional",
  unit_kerja: "Bidang Umum",
  is_active: true,
  keterangan: "",
} as any;

const issues = scanAssetEmployeeLinks([employee], [
  { sheet: "assets_equipment", assetId: "EQ-1", assetLabel: "Laptop", holderName: "Budi Santoso ST", holderRaw: "Budi Santoso ST" },
  { sheet: "assets_vehicle", assetId: "VEH-1", assetLabel: "B 1234 ABC", holderName: "UMPEG", holderRaw: "UMPEG" },
  { sheet: "assets_equipment", assetId: "EQ-2", assetLabel: "Printer", holderName: employee.nama, holderNip: employee.nip },
]);
assert.equal(issues.length, 2, "relasi NIP yang sudah benar tidak boleh masuk daftar cleansing");
assert.equal(issues[0].matchedNip, employee.nip, "nama yang cocok harus menyarankan NIP pegawai resmi");
assert.equal(issues[1].confidence, "belum", "nama unit/teks asing tidak boleh ditautkan otomatis ke pegawai");
assert.equal(toSearchText(4997421), "4997421", "pencarian harus menerima INDEX numerik tanpa crash");
assert.equal(normalizeData([{ kib_index: "004997421", pengguna_nip: "0198001" }])[0].kib_index, "004997421", "identifier harus tetap berupa teks dan mempertahankan nol awal");
assert.equal(normalizeData([{ kib_index: "004997421", pengguna_nip: "0198001" }])[0].pengguna_nip, "0198001", "NIP relasi tidak boleh dikonversi menjadi angka");

const equipment = read("src/pages/AlatMesin.tsx");
const vehicle = read("src/pages/Kendaraan.tsx");
const importModal = read("src/components/equipment/KibImportModal.tsx");
const autocomplete = read("src/components/ui/EmployeeAutocomplete.tsx");
const cleansing = read("src/pages/Cleansing.tsx");
const backend = read("apps-script/Code.gs");
const migration = read("supabase/008_sikanda_v1_1_15_employee_identity_cleansing.sql");
const firebaseWorkflow = read(".github/workflows/deploy-firebase-hosting.yml");
const pagesWorkflow = read(".github/workflows/deploy.yml");

for (const source of [equipment, vehicle]) {
  assert(source.includes("pengguna_nip") && source.includes("penanggung_jawab_nip"), "form aset harus mengirim NIP pengguna dan penanggung jawab");
  assert(source.includes("Cari nama, NIP, atau jabatan pegawai"), "pencarian pegawai harus menjelaskan nama, NIP, dan jabatan");
}
assert(equipment.includes("Hasil filter:") && equipment.includes("Total: ${data.length}"), "jumlah alat harus dinamis dan membedakan total dengan hasil filter");
assert(equipment.includes("toSearchText(item.kib_index)") || equipment.includes("item.kib_index,") && equipment.includes(".map(toSearchText)"), "INDEX numerik harus dikonversi aman sebelum pencarian");
assert(!equipment.includes("item.kib_index?.toLowerCase()"), "INDEX database tidak boleh langsung dipanggil sebagai string");
assert(importModal.includes(">Import Data<") && importModal.includes("Pilih file dengan format .CSV") && importModal.includes("Pilih File .CSV"), "narasi import harus sederhana dan menyebut .CSV");
assert(!importModal.includes("Import Data KIB B") && !importModal.includes("Kelompok") && !importModal.includes("fingerprint"), "istilah teknis tidak boleh tampil pada modal import");
assert(autocomplete.includes("employee.nip") && autocomplete.includes("employee.jabatan") && autocomplete.includes("employee.unit_kerja"), "hasil pencarian pegawai harus menampilkan identitas yang cukup");
assert(cleansing.includes("linkAssetEmployee") && cleansing.includes("Cleansing Nama Pengguna Aset"), "cleansing harus menautkan pengguna melalui NIP");
assert(backend.includes("asset_link_employee") && backend.includes("activeEmployeeByNip_") && backend.includes("pengguna_match_status: 'matched'"), "backend harus memvalidasi dan menyimpan tautan NIP");
assert(backend.includes("existingIndexes[indexKey]") && backend.includes("row.unit_indexes") && backend.includes("row.jumlah"), "backend import harus memeriksa seluruh INDEX dan sidik data gabungan");
assert(migration.includes("pengguna_raw") && migration.includes("pengguna_nip") && migration.includes("foreign key") && migration.includes("having count(*) = 1"), "migrasi harus menyimpan nama sumber dan hanya auto-match kandidat tunggal");
assert(!firebaseWorkflow.includes("push:\n") && firebaseWorkflow.includes("workflow_dispatch") && firebaseWorkflow.includes("deploy_live"), "Firebase tidak boleh berjalan otomatis sebelum domain resmi siap");
assert(pagesWorkflow.includes("Staging Manual") && pagesWorkflow.includes("workflow_dispatch"), "GitHub Pages harus tetap tersedia sebagai staging manual");
assert(backend.includes("version: '1.1.16-production'"), "backend harus melaporkan versi V1.1.16");

console.log("revision-v1115-production-tests: OK");
