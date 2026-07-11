# SIKANDA V1.1.1 Secure — Release Notes

Baseline awal: `sikanda_v1.zip` (SHA-256 `a0cdba5fc271209323dc2e5e66e13df6dd119e42ca830dea1cb86638ec9a4a24`).

## Koreksi V1.1.1

- Logo sementara diganti dengan `logo_kota_tangerang_selatan.png` asli yang dibundel melalui Vite.
- Instruksi Firebase Environment type yang sudah tidak relevan dihapus.
- Notifikasi diubah menjadi satu kali pada ambang enam bulan kalender, dengan ledger `notification_logs`.
- Email individual hanya ke pegawai terkait; rekap otomatis ke Administrator/Pimpinan aktif tanpa alamat manual.
- Opsi form menjadi ASN, PPPK (Penuh Waktu), PPPK (Paruh Waktu), dan Pensiun.
- PPPK penuh waktu memperoleh KGB saja; PPPK paruh waktu tidak memperoleh agenda.
- Empat halaman Versi 2 menampilkan nama menu masing-masing dalam pesan pengembangan.
- Rekap Laporan hanya berisi Data ASN/PPPK, Buku Penjagaan, dan Data Kendaraan.
- Tanya SIKANDA memakai default `gemini-2.5-flash`, retry terbatas untuk 429/5xx, dan pesan error yang lebih spesifik.
- Berkas netral `src/lib/supabase.ts` menimpa file lama penyebab GitHub Actions gagal tanpa membuka akses database dari browser.
- GitHub Actions memakai Node.js 22 dan menjalankan typecheck, test, audit produksi, serta build sebelum deploy.
- Panduan implementasi disatukan dan diperbarui untuk import bersih, staging, production, rollback, dan troubleshooting.

## Arsitektur dan keamanan yang dipertahankan

- Supabase adalah database tunggal; Firebase Authentication tetap untuk login Google.
- Apps Script memverifikasi Firebase ID token dan menegakkan RBAC di server.
- Service-role key Supabase serta Gemini API key hanya berada di Script Properties.
- Foto tetap disimpan Restricted di Google Drive.
- Admin dan Pimpinan memiliki izin identik; Pegawai terbatas pada profil sendiri.
- Endpoint CRUD Supabase generik tetap dinonaktifkan.
- Modul Inventaris, Pagu Anggaran, Pemeliharaan Kendaraan, dan Peminjaman tidak memproses data pada V1.

Ikuti `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.1_SECURE.md` dari awal dan lakukan rotasi key sebelum production/public.
