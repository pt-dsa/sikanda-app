# Deploy Backend Apps Script SIKANDA V1.1.8 Secure

1. Backup `Code.gs` yang aktif dan database Supabase.
2. Buka `apps-script/Code.gs` dari paket V1.1.8.
3. Ganti **seluruh** isi `Code.gs` pada project Backend SIKANDA, lalu simpan.
4. Pilih **Deploy → Manage deployments → Edit → New version → Deploy**.
5. Pertahankan deployment lama agar URL Web App tidak berubah.
6. Buka URL deployment `/exec`; respons sehat menunjukkan versi `1.1.8-secure`.
7. Bila URL berubah, perbarui `VITE_APPS_SCRIPT_URL` dan deploy ulang frontend.

Tidak ada Script Property baru. Pertahankan seluruh nilai V1.1.7, termasuk `SUPABASE_PHOTO_BUCKET=pegawai-photos` dan `PHOTO_SIGNED_URL_SECONDS=3600`.

Untuk upgrade V1.1.8:

- jangan menjalankan ulang SQL `001`–`005`;
- jangan menjalankan ulang `migrasiSemuaFotoPegawaiKeSupabase()`;
- jangan menjalankan ulang `lanjutkanMigrasiFotoPegawai()`;
- jangan menjalankan ulang `pasangTriggerSikandaV117()`.

Uji minimal setelah deploy: update kendaraan dengan koordinat, update kendaraan tanpa koordinat, update alat & mesin tanpa koordinat, dan Terapkan koreksi Perlu Verifikasi dari Data Cleansing.

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, atau secret Firebase di frontend.
