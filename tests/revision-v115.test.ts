import fs from "node:fs";
import { buildUpcomingBirthdays } from "../src/lib/birthdays";
import { scanAssetNameMismatches } from "../src/lib/cleansing";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}
const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const employee: any = {
  nip: "198001012010011001", nama: "RISMA DAMAYANTI, S.KOM", jabatan: "Analis",
  status: "ASN", golongan: "III/a", tgl_lahir: "12 JULY 1980", assets: [],
};
const reminders = buildUpcomingBirthdays([employee], 7, new Date(2026, 6, 12));
assert(reminders.length === 1 && reminders[0].daysUntil === 0, "Ulang tahun berformat bulan Inggris harus terbaca sebagai hari ini");

const suggestions = scanAssetNameMismatches([employee], [{
  sheet: "assets_vehicle", assetId: "V1", assetLabel: "B 1234 ABC", holderName: "Risma Damayanti",
}]);
assert(suggestions.length === 1 && suggestions[0].matchedNama === employee.nama, "Saran cleansing harus memakai nama baku Database Pegawai");

const shell = read("src/components/layout/AppShell.tsx");
const dashboard = read("src/pages/Dashboard.tsx");
const vehicle = read("src/pages/Kendaraan.tsx");
const equipment = read("src/pages/AlatMesin.tsx");
const map = read("src/pages/PetaSebaran.tsx");
const media = read("src/components/ui/AssetMediaFields.tsx");
const service = read("src/services/spreadsheetService.ts");

assert(shell.includes("/pegawai?profile=") && shell.includes("max-h-[calc(100dvh"), "Notifikasi harus membuka profil tepat dan muat pada viewport mobile");
assert(dashboard.includes('className="order-3"') && dashboard.includes('className="order-4"'), "Komposisi SDM harus berada sebelum kelengkapan data");
assert(!vehicle.includes("selectable={true}") && !equipment.includes("selectable={true}"), "Checkbox tabel aset harus dihapus");
assert(map.includes("setBasemapOpen") && map.includes("touch-manipulation") && map.includes("MapResizeSync"), "Basemap mobile harus menggunakan klik/tap dan sinkronisasi ukuran peta");
assert(map.includes("canonicalEmployeeName") && map.includes('"Penanggung Jawab"'), "Detail peta harus memakai nama pegawai baku dan field lengkap");
assert(media.includes("SafeImage") && media.includes("resolveStoredPhoto"), "Pratinjau foto edit harus memiliki URL legacy dan fallback aman");
assert(service.includes('item.plate_number || item.no_polisi || ""'), "Nomor polisi tidak boleh mengambil fallback kode barang");

console.log("revision-v115-tests: OK");
