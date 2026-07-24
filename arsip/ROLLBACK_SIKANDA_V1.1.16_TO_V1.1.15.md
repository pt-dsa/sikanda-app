# Rollback SIKANDA V1.1.16 ke V1.1.15

Gunakan prosedur ini hanya bila UAT autentikasi V1.1.16 gagal dan layanan harus segera dikembalikan.

1. Di Apps Script, jalankan fungsi `nonaktifkanRegistrasiV1116`.
2. Ganti seluruh `Code.gs` dengan backup V1.1.15 dan deploy sebagai **New version** pada deployment yang sama.
3. Pulihkan source frontend dari ZIP baseline V1.1.15 yang SHA-256-nya:
   `a9b0316f37e28144386b3251a457c2669c82f1186266e40f448e814e02bc6e7e`.
4. Pulihkan environment Firebase Auth V1.1.15 hanya dari backup konfigurasi yang sudah dimiliki; jangan menyalin secret ke source.
5. Jalankan UAT login Firebase untuk Administrator, Pimpinan, dan Pegawai.
6. Biarkan kolom migrasi `009` tetap berada di `app_access`. V1.1.15 tidak membacanya, sehingga tidak perlu menjalankan `DROP COLUMN`, menghapus user Auth, atau mengulang migrasi `001–008` saat insiden.
7. Setelah layanan stabil, analisis kegagalan V1.1.16 di staging sebelum mencoba cutover kembali.

Rollback database penuh hanya dilakukan bila terdapat kerusakan data yang sudah dibuktikan dan backup telah diverifikasi. Jangan menghapus `auth.users` atau tabel bisnis secara massal sebagai langkah rollback rutin.
