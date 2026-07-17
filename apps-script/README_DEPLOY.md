# Deploy Backend Apps Script SIKANDA V1.1.13 Secure

Backend V1.1.13 wajib dideploy sebelum frontend agar optimasi Dashboard, konsistensi notifikasi, dan perbaikan Tanya SIKANDA aktif.

1. Backup `Code.gs` aktif dan catat deployment V1.1.12.
2. Salin seluruh isi `apps-script/Code.gs` V1.1.13 ke project Backend SIKANDA.
3. Simpan lalu pilih **Deploy → Manage deployments → Edit → New version → Deploy**.
4. Gunakan deployment lama agar URL Web App tetap sama.
5. Buka URL `/exec`; respons sehat harus memuat `"version":"1.1.13-secure"`.
6. Jika URL berubah, perbarui `VITE_APPS_SCRIPT_URL` di AI Studio dan GitHub Actions Secrets, lalu build ulang frontend.

Tidak ada Script Property, SQL, trigger, atau migrasi baru.

Uji minimal setelah deploy:

- klik pegawai “Perlu Verifikasi” dan pastikan temuan Data Cleansing tampil;
- buka profil PPPK Paruh Waktu dan pastikan teks singkat tanpa frasa teknis;
- bandingkan M. HOLILI/agenda terlambat pada notifikasi, Buku Penjagaan, dan Tanya SIKANDA;
- uji pertanyaan lanjutan Tanya SIKANDA;
- buka Dashboard dua kali dan pastikan kunjungan kedua memakai hasil sesi yang masih segar;
- pastikan Data ASN/PPPK tetap menampilkan foto ketika menunya dibuka;
- uji CRUD Kendaraan dan Alat & Mesin serta konfirmasi hasilnya di Supabase.

Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, atau kredensial backend di frontend.

