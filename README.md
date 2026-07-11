# SIKANDA V1.1.1 Secure

Rilis ini memakai `sikanda_v1.zip` sebagai baseline dan menjalankan arsitektur berikut:

- React/Vite untuk antarmuka Google AI Studio dan GitHub Pages.
- Firebase Authentication untuk login Google.
- Google Apps Script sebagai backend terautentikasi dan pemegang secret.
- Supabase PostgreSQL sebagai satu-satunya database aplikasi.
- Google Drive untuk foto pegawai.
- Gemini hanya dipanggil dari Apps Script; konteks disusun server sesuai role.

Mulai implementasi dari [00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.1_SECURE.md](00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.1_SECURE.md). Jalankan migrasi [supabase/001_sikanda_v1_security.sql](supabase/001_sikanda_v1_security.sql) sebelum memasang backend baru.

## Pemeriksaan lokal

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
```

Jangan pernah memasukkan Gemini API key atau Supabase service-role key ke source, AI Studio frontend secrets berawalan `VITE_`, maupun GitHub repository.
