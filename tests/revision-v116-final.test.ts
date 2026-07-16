import fs from "node:fs";
import { canEditField, visibleMenus, type AppUser } from "../src/lib/rbac";
import { INDONESIAN_INSTITUTIONS, INDONESIAN_STUDY_PROGRAMS, mergeSuggestionOptions } from "../src/lib/educationOptions";
import { resolveAssetPhotoCandidates } from "../src/lib/media";
import { scanAssetNameMismatches } from "../src/lib/cleansing";
import { normalizeIndonesianPhoneNumber } from "../src/lib/contact";
import { resolveVehicleItemCode } from "../src/lib/assetIdentity";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}
const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const employeeUser: AppUser = { email: "pegawai@example.go.id", role: "pegawai", nip: "198001012010011001" };
const employeeMenus = visibleMenus("pegawai");
assert(employeeMenus.includes("dashboard") && employeeMenus.includes("pegawai") && employeeMenus.includes("peta"), "Pegawai harus melihat menu operasional utama");
assert(!employeeMenus.includes("laporan") && !employeeMenus.includes("kelola-akun") && !employeeMenus.includes("cleansing"), "Pegawai tidak boleh melihat Rekap Laporan dan menu tata kelola manajer");
assert(canEditField(employeeUser, employeeUser.nip, "nama") && canEditField(employeeUser, employeeUser.nip, "tgl_lahir"), "Pegawai harus dapat mengubah data personal akun sendiri");
for (const locked of ["nip", "status", "jabatan", "unit_kerja", "masa_kerja_tahun", "masa_kerja_bulan", "golongan", "tgl_mulai_golongan", "tgl_mulai_jabatan", "catatan_mutasi_masuk", "catatan_mutasi_keluar"]) {
  assert(!canEditField(employeeUser, employeeUser.nip, locked), `${locked} harus tetap terkunci untuk pegawai`);
}
assert(!canEditField(employeeUser, "199001012020011002", "nama"), "Pegawai tidak boleh mengubah profil pegawai lain");

assert(INDONESIAN_INSTITUTIONS.length >= 60 && INDONESIAN_STUDY_PROGRAMS.length >= 50, "Library kampus dan jurusan Indonesia harus tersedia secara lokal");
assert(mergeSuggestionOptions(["Universitas Indonesia"], ["universitas indonesia", "Kampus Baru"]).length === 2, "Suggestion harus menggabungkan data library, database, dan input baru tanpa duplikasi");

const driveCandidates = resolveAssetPhotoCandidates("https://drive.google.com/file/d/FILE_ID_123/view", "alat_mesin");
assert(driveCandidates.length === 2 && driveCandidates[0].includes("thumbnail") && driveCandidates[1].includes("export=view"), "Foto Drive harus memiliki sumber utama dan fallback");
const appSheetCandidates = resolveAssetPhotoCandidates("AlatMesin_Images/foto 1.jpg", "alat_mesin");
assert(appSheetCandidates[0].includes("tableName=Alat%20%26%20Mesin") && appSheetCandidates[1].includes("tableName=AlatMesin"), "Foto AppSheet alat/mesin harus mencoba kedua nama tabel legacy");

const match = scanAssetNameMismatches([{ nip: employeeUser.nip!, nama: "BUDI SANTOSO, S.T." } as any], [{
  sheet: "assets_equipment", assetId: "EQ-1", assetLabel: "Pompa", holderName: "Budi Santoso",
}]);
assert(match[0]?.sheet === "assets_equipment", "Cleansing harus mempertahankan nama tabel backend yang dikenali");

const backend = read("apps-script/Code.gs");
const form = read("src/components/ui/PegawaiFormModal.tsx");
const api = read("src/services/apiService.ts");
const map = read("src/pages/PetaSebaran.tsx");
const shell = read("src/components/layout/AppShell.tsx");
const report = read("src/pages/Laporan.tsx");
const vehicle = read("src/pages/Kendaraan.tsx");
const equipment = read("src/pages/AlatMesin.tsx");
const safeImage = read("src/components/ui/SafeImage.tsx");
const employeePage = read("src/pages/Pegawai.tsx");
const dashboard = read("src/pages/Dashboard.tsx");
const capture = read("src/components/ui/ScreenCaptureTool.tsx");

assert(!backend.includes("query.push('nip=eq.' + encodeURIComponent(actor.nip))") && !backend.includes("ensureActorPhotoAccess_"), "Backend pegawai harus membaca seluruh data tanpa operasi izin Drive pada jalur baca");
assert(backend.includes("'nama', 'tgl_lahir', 'kontak'") && backend.includes("signedEmployeePhotoUrls_") && backend.includes("foto_storage_path"), "Backend harus membatasi profil personal dan melayani foto private melalui signed URL");
assert(form.includes('type="date"') && form.includes("Tanggal belum valid") && form.includes("SuggestionField"), "Form harus memiliki kalender, validasi langsung, dan suggestion yang dapat diketik");
assert(form.includes("INDONESIAN_INSTITUTIONS") && form.includes("INDONESIAN_STUDY_PROGRAMS") && form.includes("GRADUATION_YEAR_OPTIONS"), "Form harus memakai library pendidikan dan suggestion tahun lulus");
assert(api.includes('table !== "assets_vehicle"') && api.includes('action: "asset_fix_holder", table'), "Cleansing harus mengirim nama tabel yang dikenali backend");
assert(map.includes("ResizeObserver") && map.includes("markerIcons") && map.includes("useState(false)") && map.includes("updateWhenIdle"), "Peta harus memenuhi container dan mengurangi beban marker/tile");
assert(shell.includes('isMapPage ? "h-full max-w-none p-0"'), "Peta harus melewati batas max-width halaman biasa");
assert(vehicle.includes("canWriteAssets") && equipment.includes("canWriteAssets"), "Aksi CRUD aset harus disembunyikan dari role baca-saja");
assert(safeImage.includes("fallbackSrcs") && safeImage.includes("sourceIndex"), "Image preview harus mencoba fallback sebelum menampilkan status gagal");
assert(report.includes("letterhead-inner") && report.includes("column-gap:0") && report.includes("letterhead-text") && report.includes("imagesReady") && !report.includes("left:42px"), "Logo dan judul KOP harus menjadi satu kelompok yang ditunggu hingga siap sebelum print");
assert(normalizeIndonesianPhoneNumber("081234567890") === "6281234567890", "Kontak harus dinormalisasi ke 628");
assert(resolveVehicleItemCode({ no_polisi: "B 1 ABC", asset_code: "B 1 ABC" }) === "", "Kode kendaraan yang menduplikasi pelat harus ditolak");
assert(employeePage.includes("Perlu Verifikasi") && !employeePage.includes("Aset Fuzzy Match"), "Istilah kecocokan aset harus mudah dipahami pengguna umum");
assert(employeePage.includes("WhatsAppButton") && employeePage.includes('user?.role === "admin"') && employeePage.includes("ScreenCaptureTool"), "Admin/Pimpinan harus memiliki WhatsApp dan Administrator memiliki capture layar");
assert(capture.includes("getDisplayMedia") && capture.includes("ClipboardItem") && capture.includes("navigator.share"), "Capture harus mendukung pilih area, salin, simpan, dan bagikan");
assert(dashboard.includes("Pegawai Dengan Inventaris") && dashboard.includes("Pegawai Tanpa Inventaris") && dashboard.includes("outerRadius={82}"), "Dashboard harus mengisi ruang card dan memperbesar grafik golongan");

console.log("revision-v116-final-tests: OK");
