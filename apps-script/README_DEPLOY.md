# Deploy Backend Apps Script SIKANDA

1. Jalankan migrasi `supabase/001_sikanda_v1_security.sql` dan pastikan berhasil.
2. Ganti seluruh isi `Code.gs` pada project Backend SIKANDA dengan `apps-script/Code.gs` dari rilis ini.
3. Isi Script Properties berikut tanpa membagikan nilainya:

| Properti | Keterangan |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | Anon/publishable key project; tidak dipakai untuk otorisasi server |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role/secret key baru, hanya di Apps Script |
| `FIREBASE_API_KEY` | Firebase Web API key untuk verifikasi ID token |
| `GEMINI_API_KEY` | Gemini API key baru, hanya di Apps Script |
| `GEMINI_MODEL` | Model yang diizinkan, default `gemini-2.0-flash` |
| `BOOTSTRAP_ADMIN_EMAIL` | Email admin pertama |
| `DRIVE_FOLDER_NAME` | Contoh `SIKANDA_Foto_Pegawai` |

Hapus properti lama `SPREADSHEET_ID`, `SHARED_SECRET`, dan `ALLOW_LEGACY_SECRET`; backend V1 Secure tidak memakainya.

4. Deploy → **New deployment** → **Web app** → Execute as **Me** → Who has access **Anyone**.
5. Salin URL yang berakhir `/exec` ke `VITE_APPS_SCRIPT_URL` pada frontend.
6. Buka URL `/exec`; respons sehat berisi `ok: true` dan versi `1.1.0-secure`.

Panduan lengkap ada di root proyek: `PANDUAN_IMPLEMENTASI_SIKANDA_V1_SECURE.md`.
