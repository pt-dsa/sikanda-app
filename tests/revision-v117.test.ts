import fs from "node:fs";
import vm from "node:vm";
import { can } from "../src/lib/rbac";
import { toStorageDate } from "../src/lib/utils";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}
const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const backend = read("apps-script/Code.gs");
const backendClient = read("src/services/backendClient.ts");
const service = read("src/services/spreadsheetService.ts");
const api = read("src/services/apiService.ts");
const employeePage = read("src/pages/Pegawai.tsx");
const guardPage = read("src/pages/BukuPenjagaan.tsx");
const avatar = read("src/components/ui/PegawaiDetailModal.tsx");
const form = read("src/components/ui/PegawaiFormModal.tsx");
const migration = read("supabase/005_sikanda_v1_1_7_storage_and_notifications.sql");

assert(can("admin", "data.export") && can("pimpinan", "data.export") && !can("pegawai", "data.export"), "CSV hanya boleh untuk Administrator/Pimpinan");
assert(employeePage.includes('can(user?.role, "data.export")') && guardPage.includes('can(user?.role, "data.export")'), "Semua tombol CSV aktif harus memakai guard RBAC");
assert(backend.includes("version: '1.1.16-production'") && backend.includes("SUPABASE_PHOTO_BUCKET"), "Backend terbaru harus mempertahankan bucket foto private");
assert(backend.includes("signedEmployeePhotoUrls_") && backend.includes("paths: missing"), "Signed URL foto harus dibuat secara batch");
assert(backend.includes("migrateEmployeePhotos_") && backend.includes("migrasiSemuaFotoPegawaiKeSupabase"), "Migrasi Drive harus tersedia dan dapat dilanjutkan bertahap");
assert(backend.includes("everyDays(3)") && backend.includes("everyWeeks(1)") && backend.includes("collectOneMonthWeeklyReminder_"), "Trigger health 3 harian dan notifikasi mingguan satu bulan harus tersedia");
assert(!backend.includes("ensureActorPhotoAccess_"), "Jalur baca tidak boleh mengubah permission Drive");
assert(backend.includes("dashboardSnapshot_") && service.includes("primeDashboardSnapshot"), "Dashboard harus memakai satu snapshot request");
assert(backendClient.includes("requestId") && backendClient.includes("attempts = retryable.has(action) ? 2 : 1"), "Request baca harus memiliki ID dan retry terbatas");
assert(api.includes("optimizeEmployeePhoto") && form.includes("apiService.uploadFoto"), "Foto baru harus dikompresi dan dikirim melalui endpoint foto aman");
assert(!form.includes("apiService.savePegawai({ nip: String(formData.nip), foto: uploadRes.viewUrl }"), "Upload foto tidak boleh menulis signed URL dua kali");
assert(avatar.includes("getEmployeePhotoUrl") && avatar.includes("refreshAttempted"), "Avatar harus memperbarui signed URL saat gagal");
assert(migration.includes("public = false") && migration.includes("foto_storage_path"), "Bucket harus private dan path tersimpan terpisah");
assert(toStorageDate("13 Juli 1992") === "1992-07-13", "Tanggal database harus ISO meskipun UI Indonesia");

const context = vm.createContext({
  console, Date, Math, JSON, encodeURIComponent,
  Utilities: {
    getUuid: () => "uuid",
    formatDate: (date: Date, _tz: string, pattern: string) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return pattern === "dd-MM-yyyy" ? `${d}-${m}-${y}` : `${y}-${m}-${d}`;
    },
  },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
});
vm.runInContext(backend, context);
const inside = vm.runInContext(`
  (function () {
    var out = [];
    var today = startOfDay_(new Date(2026, 6, 15));
    collectOneMonthWeeklyReminder_(out, {nip:'123456789012345678',email:'p@example.go.id'}, 'Pegawai', 'KGB', 'KGB', new Date(2026, 7, 1), today, weekStartKey_(today));
    return out;
  })()
`, context) as any[];
assert(inside.length === 1 && inside[0].eventKey.split("|").length === 4, "Agenda dalam satu bulan harus menghasilkan event mingguan");
const outside = vm.runInContext(`
  (function () {
    var out = [];
    var today = startOfDay_(new Date(2026, 6, 15));
    collectOneMonthWeeklyReminder_(out, {nip:'123456789012345678'}, 'Pegawai', 'KGB', 'KGB', new Date(2026, 8, 1), today, weekStartKey_(today));
    return out;
  })()
`, context) as any[];
assert(outside.length === 0, "Agenda di luar satu bulan tidak boleh dikirim");

console.log("revision-v117-tests: OK");
