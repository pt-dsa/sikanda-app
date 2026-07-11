# SIKANDA V1.1.2 Secure

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah dengan React/Vite, Firebase Authentication, backend Google Apps Script, Supabase PostgreSQL, Google Drive, dan Tanya SIKANDA.

Mulai implementasi dari:

**`00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.2_SECURE.md`**

Untuk upgrade dari V1.1.1, jalankan migrasi `supabase/002_sikanda_v1_1_2_revision.sql`, ganti seluruh backend Apps Script, buat deployment version baru, kemudian deploy frontend V1.1.2.

Pemeriksaan lokal:

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
```

Secret backend tidak boleh berada di source, AI Studio frontend, atau GitHub.
