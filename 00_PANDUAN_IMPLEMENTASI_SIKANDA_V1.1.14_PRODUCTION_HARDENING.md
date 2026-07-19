# Panduan Implementasi SIKANDA V1.1.14

Gunakan urutan ini. Jangan langsung menimpa production sebelum backup selesai.

## 1. Backup

- Unduh backup database Supabase dan catat waktu backup.
- Salin project Google Apps Script aktif dan catat deployment V1.1.13.
- Simpan ZIP/release frontend V1.1.13 yang sedang live.
- Pastikan minimal dua akun pengelola (`admin` atau `pimpinan`) aktif.

## 2. Upgrade Supabase

1. Buka Supabase **SQL Editor**.
2. Salin seluruh isi `supabase/006_sikanda_v1_1_14_production_hardening.sql`.
3. Jalankan sebagai satu blok dan pastikan status berhasil.
4. Setelah berhasil, salin dan jalankan seluruh isi `supabase/007_sikanda_v1_1_14_kib_b_import_gallery.sql`.
5. Pastikan bucket `pegawai-photos`, `asset-photos`, dan `asset-attachments` berstatus **private**.
6. Jangan mengimpor CSV sebelum migrasi `007` selesai.

## 3. Upgrade Backend Apps Script

1. Buka project backend SIKANDA.
2. Ganti **seluruh** isi `Code.gs` dengan `apps-script/Code.gs` dari paket ini.
3. Isi Script Properties berikut:

```text
SUPABASE_URL=<URL project Supabase>
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
FIREBASE_API_KEY=<Firebase Web API key>
SUPABASE_PHOTO_BUCKET=pegawai-photos
SUPABASE_ASSET_PHOTO_BUCKET=asset-photos
SUPABASE_ASSET_ATTACHMENT_BUCKET=asset-attachments
PHOTO_SIGNED_URL_SECONDS=3600
ENABLE_BOOTSTRAP_ADMIN=false
BOOTSTRAP_ADMIN_EMAIL=
AI_GENERATIVE_ENABLED=false
GEMINI_MODEL=gemini-3.5-flash
GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite
GEMINI_API_KEY=
```

4. Pilih **Deploy → Manage deployments → Edit → New version → Deploy**. Pertahankan deployment lama agar URL `/exec` tidak berubah.
5. Buka URL Web App. Respons sehat harus memuat `"version":"1.1.14-production"`.
6. Jalankan fungsi manual `migrasiSemuaFotoAsetKeSupabase`. Fungsi melanjutkan batch otomatis sampai foto Drive lama selesai dipindahkan. File Drive lama tidak otomatis dihapus.

AI generatif boleh diaktifkan hanya setelah instansi memakai layanan berbayar yang sesuai, perjanjian pemrosesan data telah disetujui, dan penanggung jawab keamanan memberi izin. Fitur database-first tetap berfungsi saat `AI_GENERATIVE_ENABLED=false`.

## 4. Full Replacement di Google AI Studio

1. Ekstrak ZIP ini atau pilih fungsi **import/upload ZIP** pada app SIKANDA di Google AI Studio.
2. Ganti seluruh source project; jangan hanya menyalin folder `src`.
3. Pastikan file `package.json`, `apps-script`, `supabase`, `firebase.json`, dan `.github` ikut masuk.
4. Isi environment frontend:

```text
VITE_APPS_SCRIPT_URL=<URL Web App /exec V1.1.14>
VITE_FIREBASE_API_KEY=<Firebase Web API key>
VITE_FIREBASE_AUTH_DOMAIN=<auth domain>
VITE_FIREBASE_PROJECT_ID=<project id>
VITE_FIREBASE_APP_ID=<app id>
VITE_FIREBASE_STORAGE_BUCKET=<storage bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender id>
```

5. Jalankan build/preview. Jangan publikasikan preview sebagai production sebelum UAT selesai.

## 5. Firebase dan Hosting Production

- Aktifkan Google Sign-In di Firebase Authentication.
- Tambahkan domain Firebase Hosting production ke **Authorized domains**.
- Tambahkan GitHub Secrets yang namanya sama dengan environment di atas.
- Tambahkan `FIREBASE_SERVICE_ACCOUNT_SIKANDA` dari service account khusus Firebase Hosting.
- Push ke branch `main`. Workflow `deploy-firebase-hosting.yml` menjalankan lint, seluruh test, build, audit dependensi, lalu deploy.
- GitHub Pages hanya disediakan sebagai fallback manual; gunakan Firebase Hosting untuk security headers production.

## 6. UAT Wajib

Uji dengan akun `admin`, `pimpinan`, dan `pegawai`:

- login, refresh, logout, tutup browser, dan pergantian akun;
- penolakan akun yang tidak terdaftar/nonaktif;
- baca/tambah/ubah/nonaktifkan pegawai dan aset sesuai role;
- upload foto pegawai dan aset, lalu buka ulang gambarnya;
- pastikan pengelola terakhir tidak dapat dinonaktifkan;
- Dashboard, Buku Penjagaan, Cleansing, laporan, peta, dan Tanya SIKANDA;
- ekspor CSV/PDF, kamera, geolocation, serta capture layar;
- cek `audit_logs` setelah satu perubahan pegawai dan satu perubahan aset.

### UAT khusus Alat & Mesin / KIB B

1. Buka **Alat & Mesin → Import Data** dan pilih CSV dengan struktur baku:
   `OPD, INDEX, KODE BARANG, NAMA BARANG, REGISTER, KONDISI, TAHUN, NAMA UMUM, SPESIFIKASI, HARGA PEROLEHAN, KATEGORI, BIDANG, RUANG/LOKASI, NAMA PEMEGANG, MUTASI, DOKUMENTASI`.
2. Pastikan pratinjau menampilkan jumlah baris sumber, total unit, kelompok hasil agregasi, peringatan kode, dan duplikat.
3. Untuk berkas contoh 2025 yang menjadi acuan pengembangan, hasil validasi adalah **1.477 baris/unit → 223 kelompok**, dengan **1.254 baris tergabung** dan 0 baris invalid.
4. Import hanya dapat dilanjutkan bila tidak ada baris invalid. Kode Barang yang pernah dipakai menjadi peringatan, bukan penolakan.
5. Buka satu hasil agregasi tanpa INDEX, lalu isi **Daftar INDEX per Unit** melalui Edit. Pastikan INDEX ganda ditolak dan jumlah INDEX tidak melebihi jumlah barang.
6. Uji filter **Tahun, Kategori, INDEX, Bidang, Pengguna**, serta pencarian gabungan.
7. Tambah data manual dan pastikan OPD, INDEX, Register, Spesifikasi, Kategori, Bidang, Nama Pemegang, Mutasi, koordinat GPS, foto utama, QR, dan Lampiran & Galeri tetap tersedia.
8. Unggah gambar dan PDF ke Galeri, buka kembali, lalu hapus satu lampiran. Bucket harus tetap private dan URL baca bersifat sementara.

## 7. Keputusan Go-Live

SIKANDA boleh dipindahkan ke production hanya bila:

- migrasi SQL `006` dan `007`, test, build, dan audit dependensi sukses;
- backup dapat dipulihkan;
- minimal dua pengelola aktif;
- tidak ada secret di source/ZIP;
- UAT tiga role ditandatangani pemilik proses;
- pemantauan error dan jadwal backup Supabase Storage sudah aktif.

Jika terjadi masalah, rollback deployment Apps Script ke V1.1.13, pulihkan release frontend sebelumnya, dan restore database dari backup bila migrasi data menyebabkan kegagalan.
