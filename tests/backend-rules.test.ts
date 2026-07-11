import fs from "node:fs";
import vm from "node:vm";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}

const source = fs.readFileSync(new URL("../apps-script/Code.gs", import.meta.url), "utf8");
const context = vm.createContext({
  console,
  Date,
  Math,
  JSON,
  encodeURIComponent,
  Utilities: {
    formatDate: (date: Date, _tz: string, pattern: string) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return pattern === "dd-MM-yyyy" ? `${d}-${m}-${y}` : `${y}-${m}-${d}`;
    },
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: () => null,
      setProperty: () => undefined,
      deleteProperty: () => undefined,
    }),
  },
});

vm.runInContext(source, context);

const sixMonthsBefore = vm.runInContext(
  "calendarMonthsBefore_(new Date(2027, 0, 31), 6)",
  context,
) as Date;
assert(
  sixMonthsBefore.getFullYear() === 2026 && sixMonthsBefore.getMonth() === 6 && sixMonthsBefore.getDate() === 31,
  "31 Januari harus diingatkan pada 31 Juli tahun sebelumnya",
);

const leapClamp = vm.runInContext(
  "calendarMonthsBefore_(new Date(2028, 7, 31), 6)",
  context,
) as Date;
assert(
  leapClamp.getFullYear() === 2028 && leapClamp.getMonth() === 1 && leapClamp.getDate() === 29,
  "31 Agustus pada tahun kabisat harus diklem ke 29 Februari",
);

assert(
  vm.runInContext("employmentRules_({status:'ASN'}).kgb && employmentRules_({status:'ASN'}).pangkat && employmentRules_({status:'ASN'}).bup", context),
  "ASN harus memperoleh KGB, pangkat, dan BUP",
);
assert(
  vm.runInContext("employmentRules_({status:'PPPK',kategori_pppk:'penuh_waktu'}).kgb && !employmentRules_({status:'PPPK',kategori_pppk:'penuh_waktu'}).pangkat", context),
  "PPPK penuh waktu hanya memperoleh KGB",
);
assert(
  vm.runInContext("!employmentRules_({status:'PPPK',kategori_pppk:'paruh_waktu'}).kgb", context),
  "PPPK paruh waktu tidak memperoleh agenda",
);
assert(vm.runInContext("GEMINI_MODEL", context) === "gemini-2.5-flash", "Model default harus Gemini 2.5 Flash");
assert(
  vm.runInContext("configuredGeminiModels_().indexOf('gemini-2.5-flash-lite') !== -1", context),
  "Fallback stabil Gemini 2.5 Flash-Lite harus tersedia",
);
assert(
  source.indexOf("answerFromDatabase_(actor, question)") < source.indexOf("if (!GEMINI_API_KEY)"),
  "Router database-first harus dijalankan sebelum ketergantungan Gemini",
);
assert(source.includes("NIP pegawai wajib dipilih dari Database Pegawai"), "Tambah akun harus diverifikasi ulang terhadap Database Pegawai");
assert(source.includes("kapasitas_mesin") && source.includes("no_bpkb") && source.includes("harga_pembelian"), "Backend harus menerima field kendaraan lengkap");
assert(!source.includes("NOTIF_ADMIN_EMAIL"), "Backend tidak boleh memakai alamat rekap manual");

vm.runInContext(`
  selectForActor_ = function () {
    return [{ nip:'123456789012345678', nama:'Pegawai Uji', status:'ASN', tgl_mulai_golongan:'2025-01-01' }];
  };
  getPublicConfig_ = function () { return { KGB_CYCLE_YEARS:'2', PANGKAT_CYCLE_YEARS:'4', BUP_USIA:'58' }; };
  nextCycleDate_ = function () { return addCalendarMonths_(startOfDay_(new Date()), 6); };
`, context);
const databaseAnswer = vm.runInContext(
  "answerFromDatabase_({role:'admin',email:'admin@example.go.id'}, 'Siapa saja yang KGB-nya jatuh tempo dalam 6 bulan ke depan?')",
  context,
) as string;
assert(databaseAnswer.includes("Pegawai Uji"), "Pertanyaan KGB harus dijawab database-first tanpa Gemini");

console.log("backend-rules-tests: OK");
