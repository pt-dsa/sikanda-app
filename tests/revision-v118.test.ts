import fs from "node:fs";
import {
  coordinatePairFromRow,
  optionalCoordinatePayload,
  validateCoordinatePair,
} from "../src/lib/coordinates";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}
const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const empty = validateCoordinatePair(undefined, null);
assert(empty.valid && empty.empty, "koordinat kosong harus valid dan opsional");
assert(validateCoordinatePair(" ", "-").valid, "nilai kosong legacy tidak boleh memblokir update");
assert(!validateCoordinatePair("-6.3", "").valid, "koordinat parsial harus ditolak");
assert(!validateCoordinatePair("-91", "106.7").valid, "latitude di luar rentang harus ditolak");
const comma = validateCoordinatePair("-6,3001", "106,7002");
assert(comma.valid && comma.latitude === -6.3001 && comma.longitude === 106.7002, "desimal koma harus dinormalisasi");
const legacy = coordinatePairFromRow({ gps_latitude: "-6.301", location_longitude: "106.701" });
assert(legacy.latitude === -6.301 && legacy.longitude === 106.701, "nama kolom koordinat legacy harus terbaca");
const noCoordinatePayload = optionalCoordinatePayload("NULL", undefined);
assert(noCoordinatePayload.pair.valid && Object.keys(noCoordinatePayload.payload).length === 0, "payload kosong tidak boleh menghapus koordinat lama");

const employeePage = read("src/pages/Pegawai.tsx");
const employeeDetail = read("src/components/ui/PegawaiDetailModal.tsx");
const cleansing = read("src/pages/Cleansing.tsx");
const mediaFields = read("src/components/ui/AssetMediaFields.tsx");
const dashboard = read("src/pages/Dashboard.tsx");
const service = read("src/services/spreadsheetService.ts");
const backend = read("apps-script/Code.gs");
const index = read("index.html");
const toast = read("src/components/ui/Toast.tsx");

assert(employeeDetail.includes("Perlu Verifikasi") && !employeeDetail.includes("> FUZZY<"), "badge harus memakai istilah Perlu Verifikasi");
assert(employeePage.includes("openMatchVerification") && employeePage.includes("/cleansing?nip="), "badge harus membuka verifikasi pegawai yang tepat");
assert(cleansing.includes('searchParams.get("nip")') && cleansing.includes("asset-verification-section"), "Data Cleansing harus memfilter dan menyorot NIP dari deep-link");
assert(mediaFields.includes("Minimap lokasi tersimpan") && mediaFields.includes("osmMiniMapUrl"), "form aset harus menampilkan minimap dari koordinat tersimpan");
assert(dashboard.includes('subtitle="Pegawai Pemerintah Penuh Waktu"'), "subtitle PPPK Penuh Waktu harus sesuai revisi");
assert(index.includes('rel="icon"') && index.includes("logo_kota_tangerang_selatan.png"), "favicon SIKANDA harus terhubung melalui HTML build");
assert(service.includes('fetchFromSheet("asset_locations")') && service.includes("coordinatePairFromRow"), "koordinat harus dibaca dari tabel aset dan fallback lokasi");
assert(service.includes("item.asset_id || item.id"), "ID legacy harus dikenali agar edit tidak berubah menjadi create");
assert(backend.includes("requireMutationRows_") && backend.includes("normalizeAssetCoordinates_"), "backend harus memverifikasi baris update dan koordinat opsional");
assert(backend.includes("syncAssetCoordinates_") && backend.includes("asset_locations"), "backend harus menyimpan koordinat pada skema aktif maupun lokasi legacy");
assert(toast.includes("prev.filter") && toast.includes("item.description === newToast.description"), "toast identik tidak boleh menumpuk");

console.log("revision-v118-tests: OK");
