# Deploy Backend Apps Script SIKANDA V1.1.12 Secure

Backend V1.1.12 wajib dideploy bersama frontend agar avatar login dan kebijakan agenda berlaku konsisten di sisi server.

1. Backup `Code.gs` aktif dan catat deployment V1.1.11 untuk rollback.
2. Salin **seluruh** isi `apps-script/Code.gs` V1.1.12 ke project Backend SIKANDA.
3. Simpan lalu pilih **Deploy → Manage deployments → Edit → New version → Deploy**.
4. Edit deployment lama agar URL Web App tetap sama.
5. Buka URL `/exec`; respons sehat memuat `"version":"1.1.12-secure"`.
6. Jika URL berubah, perbarui `VITE_APPS_SCRIPT_URL` pada AI Studio dan GitHub Actions Secrets, lalu build ulang frontend.

Tidak ada Script Property, SQL, trigger, atau migrasi foto baru. Jangan menjalankan ulang migrasi 001–005 hanya untuk upgrade ini.

Uji minimal setelah deploy:

- tambah Kendaraan tanpa memilih kondisi: harus ditolak;
- tambah Kendaraan dengan kondisi: harus tersimpan di `assets_vehicle`;
- edit Pengguna pada aset legacy tanpa kondisi: field pengguna tersimpan dan kondisi tetap kosong;
- pilih kondisi dari tombol Perbaiki Data Cleansing: hanya record tersebut yang berubah;
- login ulang dan konfirmasi foto header sesuai data pegawai;
- buka profil PPPK Paruh Waktu dan pastikan tidak ada kartu agenda;
- konfirmasi `/exec` tetap menunjukkan `1.1.12-secure`.

Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, atau kredensial backend di frontend.
