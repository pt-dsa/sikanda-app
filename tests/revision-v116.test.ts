import fs from "node:fs";
import { scanPegawai } from "../src/lib/cleansing";
import { parseAnyDate, toIndonesianDateText } from "../src/lib/utils";
import { normalizeIndonesianPhoneNumber, whatsappChatUrl } from "../src/lib/contact";
import { resolveVehicleItemCode } from "../src/lib/assetIdentity";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}
const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

assert(!!parseAnyDate("16 Juli 2026") && !!parseAnyDate("16 July 2026") && !!parseAnyDate("16/07/2026"), "Parser frontend harus menerima format Indonesia, Inggris, dan numerik");
assert(toIndonesianDateText("1992-07-13") === "13 Juli 1992", "Tanggal ISO harus tampil sebagai format Indonesia");
assert(normalizeIndonesianPhoneNumber("0812-3456-7890") === "6281234567890", "Nomor 08 harus otomatis menjadi 628");
assert(whatsappChatUrl("0812 3456 7890") === "https://wa.me/6281234567890", "Tautan WhatsApp harus memakai nomor ternormalisasi");
assert(resolveVehicleItemCode({ plate_number: "B 6912 NQA", asset_code: "B 6912 NQA", kode_barang: "1.3.02.01" }) === "1.3.02.01", "Kode barang valid harus dipilih terpisah dari nomor polisi");
assert(resolveVehicleItemCode({ plate_number: "B 6912 NQA", asset_code: "B 6912 NQA" }) === "", "Nomor polisi tidak boleh ditampilkan sebagai kode barang");

const employee: any = {
  nip: "199207132025212027", nama: "Uji Tanggal", jabatan: "Analis", golongan: "III/a", status: "ASN",
  tgl_lahir: "1992-07-13", tgl_mulai_golongan: "2025-06-01", tgl_mulai_jabatan: "1 Juni 2025",
  assets: [], assets_kendaraan: [], assets_alat_mesin: [], assets_inventaris: [], match_quality: "none",
};
const dateIssues = scanPegawai([employee]).filter((item) => item.kode === "TANGGAL_TIDAK_STANDAR");
assert(dateIssues.length === 0, "Tanggal sah dari form/database tidak boleh menjadi false positive cleansing");
assert(!scanPegawai([employee]).some((item) => item.kode === "MATCH_ASET_NONE"), "Pegawai tanpa aset bukan masalah cleansing");

const backend = read("apps-script/Code.gs");
const shell = read("src/components/layout/AppShell.tsx");
const rbac = read("src/lib/rbac.ts");
const form = read("src/components/ui/PegawaiFormModal.tsx");
const map = read("src/pages/PetaSebaran.tsx");
const report = read("src/pages/Laporan.tsx");
const media = read("src/lib/media.ts");

assert(backend.includes("getNotificationFeed_") && backend.includes("buildBirthdayFacts_") && backend.includes("buildAgendaFacts_"), "Backend harus menyediakan source fakta tunggal notifikasi dan Tanya SIKANDA");
assert(backend.includes("jakartaToday_") && backend.includes("parseBirthdayDate_"), "Backend harus memakai WIB dan mendukung ulang tahun tanpa tahun");
assert(shell.includes("getNotificationFeed") && !shell.includes("buildUpcomingBirthdays"), "Lonceng harus memakai feed backend tunggal");
assert(rbac.includes("pegawai: EMPLOYEE_MENUS") && rbac.includes('menu !== "laporan"'), "Pegawai harus dapat melihat menu operasional kecuali Rekap Laporan");
assert(form.includes("IndonesianDateField") && form.includes("Contoh: 13 Juli 1992"), "Form pegawai harus memasukkan tanggal dalam format Indonesia");
assert(map.includes('"Kode Barang": v.kode_barang') && map.includes('"No. Polisi": v.no_polisi'), "Peta harus memisahkan kode barang dan nomor polisi");
assert(report.includes("letterhead-inner") && report.includes("grid-template-columns:106px 700px") && report.includes("kopHeaderText"), "KOP cetak harus mengunci logo dan teks sebagai satu kelompok presisi");
assert(media.includes("resolveAssetPhotoUrl") && media.includes("data:|blob:"), "Resolver foto harus aman untuk URL, data URL, dan blob");

console.log("revision-v116-tests: OK");
