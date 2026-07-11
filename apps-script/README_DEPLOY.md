# Deploy Backend Apps Script SIKANDA V1.1.2

1. Upgrade V1.1.1: jalankan seluruh `supabase/002_sikanda_v1_1_2_revision.sql` sebagai satu blok.
2. Ganti seluruh `Code.gs` dengan `apps-script/Code.gs` V1.1.2.
3. Pastikan Script Properties lengkap, termasuk:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FIREBASE_API_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-2.5-flash`
   - `GEMINI_FALLBACK_MODELS=gemini-2.5-flash-lite`
   - `BOOTSTRAP_ADMIN_EMAIL`
   - `DRIVE_FOLDER_NAME`
4. Pilih `ujiKonfigurasiTanyaSikanda` lalu Run satu kali. Fungsi ini hanya memeriksa key/model dan tidak mengubah data.
5. Deploy → Manage deployments → Edit → New version → Deploy.
6. Buka `/exec`; versi sehat adalah `1.1.2-secure`.
7. Pastikan hanya satu trigger harian `kirimNotifikasiBukuPenjagaan` aktif.

Panduan lengkap: `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.2_SECURE.md`.
