import assert from "node:assert/strict";
import { KIB_B_HEADERS, normalizeKibCode, parseIndonesianMoney, prepareKibImport } from "../src/lib/kibImport";

assert.equal(normalizeKibCode("1.3.2.10.02.03.003"), "132100203003");
assert.equal(normalizeKibCode("132100203003"), "132100203003");
assert.equal(parseIndonesianMoney("1.250.000,50"), 1250000.5);

const row = ["DINAS", "", "1.3.2.10.02.03.003", "Printer", "", "", "2025", "EPSON L5290", "Ink tank", "1.250.000", "ELEKTRONIK", "UMUM", "RUANG 1", "BUDI", "", ""];
const indexed = ["DINAS", "499", "1.3.2.10.02.03.003", "Printer", "", "", "2025", "EPSON L5290", "Ink tank", "1.250.000", "ELEKTRONIK", "UMUM", "RUANG 1", "BUDI", "", ""];
const csv = [KIB_B_HEADERS.join(","), row.join(","), row.join(","), indexed.join(",")].join("\n");
const result = await prepareKibImport(csv, [{ kode_barang: "132100203003", nama_aset: "Printer", merk: "Lama", tahun: "2024" }]);
assert.equal(result.sourceRows, 3);
assert.equal(result.sourceUnits, 3);
assert.equal(result.records.length, 2);
assert.equal(result.records.find((item) => !item.kib_index)?.jumlah, 2);
assert.equal(result.aggregatedRows, 1);
assert.equal(result.codeWarnings, 2);
assert.equal(result.exactDuplicates, 0);
assert.equal(result.invalid.length, 0);
console.log("revision-v1114-kib-import-tests: OK");
