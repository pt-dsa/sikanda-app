import fs from "node:fs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Gagal: ${message}`);
}

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const shell = read("src/components/layout/AppShell.tsx");
const dashboard = read("src/pages/Dashboard.tsx");
const employee = read("src/pages/Pegawai.tsx");
const form = read("src/components/ui/PegawaiFormModal.tsx");
const accounts = read("src/pages/KelolaAkun.tsx");
const equipment = read("src/pages/AlatMesin.tsx");
const report = read("src/pages/Laporan.tsx");
const migration = read("supabase/003_sikanda_v1_1_3_revision.sql");

assert(shell.includes("openOwnProfile") && shell.includes("PegawaiFormModal") && !shell.includes("Edit Profile clicked"), "Edit Profile harus membuka profil akun login");
assert(dashboard.includes("PPPK (Penuh Waktu)") && dashboard.includes("PPPK (Paruh Waktu)"), "Dashboard harus memisahkan dua kategori PPPK");
assert(employee.includes("filterBidang") && employee.includes("PPPK_PENUH_WAKTU") && employee.includes("employmentStatusLabel"), "Data ASN/PPPK harus memiliki filter Bidang dan status lengkap");
assert(form.includes("WORK_YEAR_OPTIONS") && form.includes("WORK_MONTH_OPTIONS") && form.includes("EDUCATION_OPTIONS") && form.includes("pegawai-bidang-options"), "Form Pegawai harus memakai dropdown yang diminta");
assert(accounts.includes("Status Pegawai") && accounts.includes("employmentStatusLabel"), "Tambah Akun harus menampilkan status pegawai");
for (const field of ["kode_barang", "lokasi", "latitude", "longitude", "harga_pembelian", "foto", "qr_url"]) {
  assert(equipment.includes(field), `Form Alat & Mesin harus memuat ${field}`);
}
assert(report.includes("PEMERINTAH KOTA TANGERANG SELATAN") && report.includes("letterhead-lines") && report.includes("logoKota"), "Cetak Halaman harus memuat kop resmi");
assert(migration.includes("kategori_pppk = 'penuh_waktu'") && migration.includes("assets_equipment"), "Migrasi harus menormalkan PPPK dan melengkapi Alat & Mesin");

console.log("revision-ui-tests: OK");
