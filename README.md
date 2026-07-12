# SIKANDA V1.1.3 Secure

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah dengan React/Vite, Firebase Authentication, backend Google Apps Script, Supabase PostgreSQL, Google Drive, dan Tanya SIKANDA.

Mulai implementasi dari:

**`00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.3_SECURE.md`**

PENTING: agar perubahan tampilan muncul, upload/import/replace seluruh source frontend V1.1.3 ke Google AI Studio, klik Apply changes dan Publish, atau push seluruh source ke GitHub. Mengubah secret saja tidak mengubah kode aplikasi.

Untuk upgrade dari V1.1.2, jalankan `supabase/003_sikanda_v1_1_3_revision.sql`, ganti seluruh backend Apps Script, buat deployment version baru, lalu upload/replace frontend V1.1.3 dan publish/deploy ulang.

Pemeriksaan lokal:

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
```

Secret backend tidak boleh berada di source, AI Studio frontend, atau GitHub.
