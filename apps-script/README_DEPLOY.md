# Deploy Backend Apps Script SIKANDA V1.1.3

1. Backup database dan deployment Apps Script aktif.
2. Upgrade V1.1.2: Run seluruh `supabase/003_sikanda_v1_1_3_revision.sql` sebagai satu blok.
3. Ganti seluruh `Code.gs` dengan `apps-script/Code.gs` V1.1.3 dan Save.
4. Pastikan Script Properties lengkap: Supabase, Firebase, Gemini, bootstrap admin, dan Drive folder.
5. Opsional: Run `ujiKonfigurasiTanyaSikanda` satu kali untuk pemeriksaan key/model.
6. Deploy > Manage deployments > Edit > New version > Deploy.
7. Buka URL `/exec`; versi sehat adalah `1.1.3-secure`.
8. Jika URL berubah, perbarui `VITE_APPS_SCRIPT_URL` di AI Studio dan GitHub.
9. Wajib import/replace frontend V1.1.3 ke AI Studio, klik Apply changes dan Publish; push source yang sama ke GitHub.

Panduan lengkap: `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.3_SECURE.md`.
