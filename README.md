# SIKANDA V1.1.6 Secure

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah dengan React/Vite, Firebase Authentication, backend Google Apps Script, Supabase PostgreSQL, Google Drive, dan Tanya SIKANDA.

Mulai implementasi dari:

**`00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.6_SECURE.md`**

PENTING: agar perubahan tampilan muncul, upload/import/replace seluruh source frontend V1.1.6 ke Google AI Studio, klik Apply changes dan Publish, atau push seluruh source ke GitHub. Mengubah secret saja tidak mengubah kode aplikasi.

Upgrade final dari V1.1.5 ke V1.1.6 memakai satu migrasi data idempoten: `supabase/004_sikanda_v1_1_6_contact_normalization.sql`. Migrasi ini tidak mengubah struktur tabel; hanya menormalkan kontak `08...` menjadi `628...`. Setelah itu ganti backend Apps Script, buat deployment version baru, lalu upload/replace frontend V1.1.6 dan publish/deploy ulang.

Pemeriksaan lokal:

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
```

Secret backend tidak boleh berada di source, AI Studio frontend, atau GitHub.
