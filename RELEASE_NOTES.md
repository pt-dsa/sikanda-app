# SIKANDA V1 Secure — Release Notes

Baseline: `sikanda_v1.zip` (SHA-256 `a0cdba5fc271209323dc2e5e66e13df6dd119e42ca830dea1cb86638ec9a4a24`).

Perubahan utama:

- Supabase menjadi database tunggal; fallback Spreadsheet dihapus.
- Firebase Auth dipertahankan dan seluruh request backend wajib Firebase ID token.
- Admin dan Pimpinan memiliki izin identik; Pegawai dibatasi pada profil sendiri.
- Endpoint CRUD Supabase generik dinonaktifkan; tulis memakai endpoint khusus dan audit log.
- KGB/Pangkat/BUP dapat dikonfigurasi dari Buku Penjagaan.
- Aturan ASN, PPPK penuh waktu, dan PPPK paruh waktu diterapkan konsisten.
- Tanya SIKANDA menyusun konteks di server sesuai role dan mengecualikan modul Versi 2.
- Foto tetap di Google Drive dengan pembatasan tipe, ukuran, dan sharing.
- Logo rusak diganti SVG internal; background dioptimalkan dari sekitar 6,6 MB menjadi sekitar 86 KB pada build.
- Inventaris, Pagu Anggaran, Pemeliharaan Kendaraan, dan Peminjaman dibekukan untuk Versi 2 tanpa pemrosesan data V1.
- Cache, deduplikasi request, batas paralel, timeout, dan code splitting dipertahankan/ditingkatkan.

Validasi rilis:

- TypeScript `tsc --noEmit`: lulus.
- Vite production build: lulus.
- Sintaks Apps Script (`node --check`): lulus.
- Pengujian aturan agenda ASN/PPPK dan leap year: lulus.
- Pemindaian credential pada source dan build: lulus.
- Pemindaian aset gambar rusak pada build: lulus.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerability.

Ikuti `PANDUAN_IMPLEMENTASI_SIKANDA_V1_SECURE.md` dari awal; jangan langsung mengganti produksi tanpa staging dan backup.
