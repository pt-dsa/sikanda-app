# Deploy Backend Apps Script SIKANDA V1.1.9 Secure

Backend V1.1.9 wajib dideploy bersama frontend. Mengunggah ZIP frontend saja tidak memperbaiki update Pengguna Alat & Mesin.

1. Backup `Code.gs` dan catat versi deployment V1.1.8 untuk rollback.
2. Buka `apps-script/Code.gs` dari paket V1.1.9.
3. Ganti **seluruh** isi `Code.gs` pada project Backend SIKANDA.
4. Simpan, lalu pilih **Deploy → Manage deployments → Edit → New version → Deploy**.
5. Pertahankan deployment lama agar URL Web App tidak berubah.
6. Buka URL `/exec`; respons sehat menampilkan `1.1.9-secure`.
7. Bila URL berubah, perbarui `VITE_APPS_SCRIPT_URL` pada AI Studio dan GitHub Actions Secrets.

Tidak ada Script Property, SQL, trigger, atau migrasi foto baru. Jangan menjalankan ulang migrasi 001–005, `pasangTriggerSikandaV117()`, atau migrasi foto hanya untuk upgrade ini.

Uji minimal setelah deploy:

- ubah hanya Pengguna pada satu Alat & Mesin yang memiliki koordinat;
- tambah satu alat tanpa harga/koordinat;
- tambah satu kendaraan tanpa koordinat;
- klik Sinkronisasi pada ketiga menu baru;
- konfirmasi `/exec` tetap menunjukkan `1.1.9-secure`.

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, atau kredensial backend di frontend.
