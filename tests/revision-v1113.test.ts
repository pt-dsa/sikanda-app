import fs from "node:fs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const loading = read("src/components/ui/LoadingState.tsx");
const progress = read("src/lib/loadingProgress.ts");
const client = read("src/services/backendClient.ts");
const service = read("src/services/spreadsheetService.ts");
const completeness = read("src/lib/kelengkapan.ts");
const modal = read("src/components/ui/PegawaiDetailModal.tsx");
const dashboard = read("src/pages/Dashboard.tsx");
const tanya = read("src/pages/TanyaSikanda.tsx");
const backend = read("apps-script/Code.gs");
const pkg = read("package.json");
const metadata = read("metadata.json");

assert(
  loading.includes("useSyncExternalStore") && loading.includes("{progress}%") &&
  loading.includes("#2563eb") && loading.includes("#22c55e") && !loading.includes("repeat: Infinity"),
  "loading harus menampilkan persentase nyata dengan bar biru ke hijau tanpa pengulangan palsu",
);
assert(
  progress.includes("beginLoadingTask") && progress.includes("updateLoadingTask") && progress.includes("completeLoadingTask") &&
  client.includes('updateLoadingTask(requestId, 72, "Memproses data")') && client.includes('updateLoadingTask(requestId, 92, "Menyiapkan tampilan")'),
  "kemajuan harus mengikuti tahap permintaan data yang nyata",
);
assert(
  service.includes("const reviewNips = buildFuzzyNipSet(mapped, unifiedAssets)") &&
  service.includes('if (reviewNips.has(nip)) return { ...pegawai, match_quality: "fuzzy" as const }') &&
  !completeness.includes('p.match_quality !== "fuzzy"'),
  "badge Perlu Verifikasi dan deep-link Data Cleansing harus memakai sumber keputusan yang sama",
);
assert(
  !modal.includes("berdasarkan aturan status kepegawaian SIKANDA") &&
  !modal.includes("Google Sheets") && !modal.includes("holder") &&
  modal.includes("Belum ada aset yang tercatat atas nama"),
  "profil pegawai harus memakai diksi nonteknis dan ringkas",
);
assert(
  dashboard.includes("sikanda_dashboard_metrics_v1113") && dashboard.includes("readDashboardCache") &&
  !dashboard.includes("clearCache();\n    void load(false);"),
  "Dashboard harus memakai snapshot singkat dan tidak menghapus cache pada setiap akses",
);
assert(
  backend.includes("function overdueAgendaAnswer_") &&
  backend.includes("if (item.days >= 0) return false") && backend.includes("getNotificationFeed_") &&
  backend.includes("buildAgendaFacts_(actor, today, employees)") &&
  backend.includes("selectForActor_(actor, 'pegawai', [], { skipPhotoUrls: true })"),
  "Tanya SIKANDA dan notifikasi harus memakai fakta agenda yang sama serta jalur baca ringan",
);
assert(
  client.includes('"ai_ask"') && tanya.includes(".replace(/\\s*\\(ID:") &&
  tanya.includes("Saya belum berhasil memproses jawaban karena: ${msg}") &&
  !tanya.includes("Coba sebutkan bagian datanya"),
  "Tanya SIKANDA harus dapat mengulang koneksi aman dan tidak menyamarkan kesalahan sebagai jawaban",
);
assert(
  pkg.includes('"version": "1.1.13"') && metadata.includes("V1.1.13 Secure") &&
  backend.includes("version: '1.1.13-secure'"),
  "versi frontend, metadata, dan backend harus konsisten V1.1.13",
);

console.log("revision-v1113-tests: OK");
