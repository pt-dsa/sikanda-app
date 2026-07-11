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
assert(!source.includes("NOTIF_ADMIN_EMAIL"), "Backend tidak boleh memakai alamat rekap manual");

console.log("backend-rules-tests: OK");
