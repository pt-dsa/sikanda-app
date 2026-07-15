# SIKANDA V1.1.7 Secure

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah berbasis React/Vite, Firebase Authentication, Google Apps Script, Supabase PostgreSQL/Storage, dan Tanya SIKANDA database-first.

Mulai deployment dari **`00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.7_SECURE.md`**.

Urutan upgrade wajib:

1. Backup Supabase, Apps Script, dan folder foto Google Drive.
2. Jalankan migrasi V1.1.6 bila belum, lalu `supabase/005_sikanda_v1_1_7_storage_and_notifications.sql`.
3. Deploy `apps-script/Code.gs` sebagai **New version**.
4. Jalankan `pasangTriggerSikandaV117()` satu kali.
5. Jalankan `migrasiSemuaFotoPegawaiKeSupabase()` satu kali; proses berlanjut per batch.
6. Deploy frontend V1.1.7.

Pemeriksaan lokal:

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
```

Secret Firebase, Supabase service-role, dan Gemini tidak boleh masuk source/frontend/GitHub.
