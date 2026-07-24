# Deploy Apps Script — SIKANDA V1.1.16

1. Backup `Code.gs` V1.1.15 dan seluruh Script Properties.
2. Jalankan precheck SQL `009A`, perbaiki seluruh `FAIL`, lalu jalankan migrasi `009` sebagai satu blok.
3. Ganti seluruh isi `Code.gs` dengan file versi ini.
4. Pastikan Script Properties wajib tersedia:

   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AUTH_REGISTRATION_ENABLED=false`
   - `AUTH_CAPTCHA_TOLERANCE=3.5`
   - `SUPABASE_PHOTO_BUCKET=pegawai-photos`
   - `SUPABASE_ASSET_PHOTO_BUCKET=asset-photos`
   - `SUPABASE_ASSET_ATTACHMENT_BUCKET=asset-attachments`
   - `PHOTO_SIGNED_URL_SECONDS=3600`

5. Pilih fungsi `buatAuthPasswordPepperV1116`, lalu tekan **Run** satu kali. Jangan pernah mengganti/menghapus pepper setelah user mulai registrasi.
6. Pilih fungsi `aktifkanRegistrasiV1116`, lalu tekan **Run** satu kali. Fungsi ini hanya berhasil jika migrasi `009` dan pepper sudah tersedia.
7. Pilih **Deploy → Manage deployments → Edit → New version → Deploy**. Pertahankan URL `/exec` yang sama.
8. Buka URL Web App. Respons yang benar memuat `"version":"1.1.16-production"`.

Untuk menghentikan registrasi baru tanpa mematikan akun aktif, jalankan `nonaktifkanRegistrasiV1116`.

Semua endpoint data tetap memerlukan access token Supabase yang diverifikasi dan binding aktif di `app_access`. `SUPABASE_SERVICE_ROLE_KEY` dan `AUTH_PASSWORD_PEPPER` tidak boleh dipindahkan ke Google AI Studio, GitHub Secrets frontend, atau source publik.
