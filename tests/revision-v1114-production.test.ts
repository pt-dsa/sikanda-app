import fs from "node:fs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const appShell = read("src/components/layout/AppShell.tsx");
const firebase = read("src/lib/firebase.ts");
const service = read("src/services/spreadsheetService.ts");
const app = read("src/App.tsx");
const backend = read("apps-script/Code.gs");
const migration = read("supabase/006_sikanda_v1_1_14_production_hardening.sql");
const hosting = read("firebase.json");
const workflow = read(".github/workflows/deploy-firebase-hosting.yml");

function functionBody(source: string, name: string, nextName: string) {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  return source.slice(start, end < 0 ? undefined : end);
}

assert(
  !appShell.includes("sikanda_session") && !appShell.includes("readSession") &&
    appShell.includes("useState<AppUser | null>(null)") && appShell.includes("spreadsheetService.clearCache()"),
  "role tidak boleh dipulihkan dari localStorage dan cache wajib dibersihkan pada siklus autentikasi",
);
assert(
  firebase.includes("browserSessionPersistence") && !firebase.includes("browserLocalPersistence") &&
    app.includes("if (loading) return <LoadingState />") && app.includes('if (!user) return <Navigate to="/login" replace />'),
  "sesi wajib session-only dan route terproteksi harus menunggu verifikasi backend",
);
assert(service.includes('sessionStorage.removeItem("sheet_last_updated")'), "logout harus membersihkan seluruh penanda cache");

assert(
  backend.includes("ENABLE_BOOTSTRAP_ADMIN") && backend.includes("ENABLE_BOOTSTRAP_ADMIN && BOOTSTRAP_ADMIN_EMAIL") &&
    backend.includes("ensureManagerContinuity_"),
  "bootstrap admin harus opt-in dan akun pengelola terakhir harus dilindungi",
);
assert(
  backend.includes("AI_GENERATIVE_ENABLED") && backend.includes("scriptProp_('AI_GENERATIVE_ENABLED', 'false')") &&
    backend.includes("gemini-3.5-flash") && backend.includes("gemini-3.1-flash-lite") &&
    backend.includes("'x-goog-api-key': GEMINI_API_KEY") && !backend.includes(":generateContent?key="),
  "AI generatif harus default-off, memakai model aktif, dan API key harus dikirim lewat header",
);
const aiContext = functionBody(backend, "buildAiContext_", "compactAsset_");
assert(
  aiContext.includes("Ringkasan anonim") && !aiContext.includes("p.nip") && !aiContext.includes("p.email") &&
    !aiContext.includes("p.kontak") && !aiContext.includes("p.tgl_lahir"),
  "konteks Gemini tidak boleh memuat identitas atau kontak pegawai",
);

const uploadAsset = functionBody(backend, "uploadAssetFoto_", "migrateAssetPhotos_");
assert(
  uploadAsset.includes("SUPABASE_ASSET_PHOTO_BUCKET") && uploadAsset.includes("foto_storage_path") &&
    !uploadAsset.includes("DriveApp") && !uploadAsset.includes("driveFolder_"),
  "foto aset baru wajib masuk bucket private Supabase, bukan Google Drive",
);
assert(
  migration.includes("asset-photos") && migration.includes("public.sikanda_db_audit") &&
    migration.includes("latitude double precision") && migration.includes("longitude double precision"),
  "migrasi produksi harus menyediakan bucket private, audit transaksional, dan koordinat atomik",
);
assert(
  hosting.includes("Content-Security-Policy") && hosting.includes("frame-ancestors 'none'") &&
    hosting.includes("Strict-Transport-Security") && workflow.includes("FirebaseExtended/action-hosting-deploy@500ac625"),
  "hosting produksi wajib mengirim security headers dan workflow harus dipin ke commit immutable",
);

console.log("revision-v1114-production-tests: OK");
