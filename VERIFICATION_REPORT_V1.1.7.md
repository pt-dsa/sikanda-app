# Verification Report — SIKANDA V1.1.7 Secure

Tanggal verifikasi lokal: 15 Juli 2026 (Asia/Jakarta).

## Cakupan otomatis

- `npm run verify`: LULUS.
- TypeScript (`tsc --noEmit`): LULUS tanpa error.
- 9 suite pengujian: LULUS seluruhnya.
- Production build Vite: LULUS, 2.945 modul ditransformasi.
- `npm audit --omit=dev --audit-level=high`: 0 kerentanan.
- Pemeriksaan sintaks `apps-script/Code.gs`: LULUS.
- Seluruh regresi V1.1.4–V1.1.6.
- RBAC ekspor CSV.
- Kontrak tanggal ISO/database dan tampilan Indonesia.
- Storage private, signed URL batch, refresh avatar, upload teroptimasi, serta migrasi Drive bertahap.
- Trigger health 3 harian dan notifikasi mingguan satu bulan.
- Snapshot Dashboard, retry request baca, dan request ID.
- Tanya SIKANDA database-first dan penyelarasan scope role.
- Production build Vite dan audit dependensi production.

## Batas validasi lokal

Validasi lokal tidak dapat menjalankan Supabase/Storage milik pengguna, OAuth/Firebase live, DriveApp, MailApp, trigger Apps Script, kamera/GPS, tile basemap, WhatsApp, atau print dialog browser. Item tersebut wajib diuji setelah SQL migration dan deployment terbaru. Migrasi foto tidak menghapus file sumber sehingga rollback tetap tersedia.

## Validasi live wajib

1. Jalankan `supabase/005_sikanda_v1_1_7_storage_and_notifications.sql`, lalu pastikan bucket `pegawai-photos` berstatus private.
2. Deploy Apps Script sebagai versi baru dan jalankan `pasangTriggerSikandaV117()` satu kali.
3. Jalankan migrasi foto melalui `migrasiSemuaFotoPegawaiKeSupabase()` dan pantau status per baris; file Drive lama tidak dihapus.
4. Uji tambah/edit pegawai dengan foto pada Admin, Pimpinan, dan Pegawai di desktop serta perangkat seluler.
5. Uji satu akun Pegawai: semua tombol unduh CSV harus tidak tersedia dan permintaan ekspor langsung harus ditolak backend/UI.
6. Uji notifikasi dengan data tenggat terkontrol: mulai satu bulan sebelum jatuh tempo, maksimum satu kiriman per minggu.
7. Periksa Execution log Apps Script dan Supabase Observability setelah pengujian serentak.
