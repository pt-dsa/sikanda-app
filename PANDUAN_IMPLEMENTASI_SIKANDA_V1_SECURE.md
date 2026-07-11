# Panduan Implementasi SIKANDA V1 Secure

## 1. Arsitektur yang dipakai

Keputusan rilis ini ditujukan untuk migrasi yang cepat dan halus:

1. **Firebase Authentication dipertahankan** untuk login Google agar akun yang sudah berjalan tidak perlu dimigrasikan serentak.
2. **Supabase menjadi satu-satunya database**. Tidak ada pembacaan atau fallback ke Google Spreadsheet.
3. **Google Apps Script menjadi backend tepercaya**: memverifikasi Firebase ID token, menerapkan role, mengakses Supabase memakai service role, mengunggah foto, mengirim notifikasi, dan memanggil Gemini.
4. **Google Drive tetap menyimpan foto**. Berkas dibuat privat dan akses dibagikan kepada Admin, Pimpinan, serta pemilik profil.
5. Browser tidak menerima Supabase service-role key atau Gemini API key.

Dokumentasi acuan: [Supabase secure data/RLS](https://supabase.com/docs/guides/database/secure-data), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Firebase API keys](https://firebase.google.com/docs/projects/api-keys), dan [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).

## 2. Tindakan keamanan darurat sebelum implementasi

Capture yang pernah dibagikan memperlihatkan sebagian credential sensitif. Lakukan ini terlebih dahulu:

1. **Rotasi Supabase service-role/secret key**. Setelah mendapat key baru, cabut key lama.
2. **Rotasi Gemini API key** dan hapus key lama dari Apps Script/AI Studio.
3. Jangan memasukkan key baru dalam capture, chat, repository, atau berkas `.env` yang diunggah.
4. Batasi Firebase Web API key melalui Google Cloud API Credentials untuk API yang diperlukan dan domain produksi. Firebase web config memang dikirim ke browser, tetapi pembatasan key tetap wajib.
5. Pastikan repository GitHub tidak pernah memuat key lama. Jika pernah ter-commit, anggap key bocor walaupun commit kemudian dihapus.

## 3. Backup sebelum perubahan

1. Supabase Dashboard → **Database → Backups**. Buat backup/snapshot sesuai paket Anda.
2. Ekspor tabel aktif: `pegawai`, `assets_vehicle`, `assets_equipment`, `asset_locations`, `app_access`, dan `system_config`.
3. Simpan salinan project Apps Script lama atau buat versi deployment lama sebagai rollback.
4. Catat URL deployment frontend yang saat ini stabil.

Jangan lanjut sebelum backup dapat dipulihkan.

## 4. Migrasi skema Supabase

1. Buka Supabase → **SQL Editor**.
2. Buka berkas `supabase/001_sikanda_v1_security.sql` dari paket.
3. Jalankan seluruh script dalam satu eksekusi.
4. Pastikan transaksi selesai tanpa error.
5. Verifikasi:

```sql
select key, value from public.system_config order by key;
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

Hasil penting:

- `KGB_CYCLE_YEARS=2`, `PANGKAT_CYCLE_YEARS=4`, `BUP_USIA=58`.
- Tabel aktif memiliki `is_active` dan metadata audit yang diperlukan.
- Tabel `audit_logs` tersedia.
- RLS aktif dan akses `anon`/`authenticated` langsung dicabut; Apps Script tetap dapat bekerja memakai service role.

Jika pembuatan unique index gagal karena duplikasi email/key, jangan menghapus data sembarang. Ekspor tabel terkait, rapikan duplikat berdasarkan pemilik yang sah, kemudian jalankan migrasi lagi.

## 5. Rapikan data PPPK

Kolom `pegawai.kategori_pppk` menerima:

- `penuh_waktu`: mendapat agenda KGB saja.
- `paruh_waktu`: tidak mendapat KGB, pangkat, atau BUP.
- Kosong: dianggap **belum dikategorikan** dan tidak mendapat agenda sampai Administrator/Pimpinan menetapkan kategori.

ASN mendapat KGB, kenaikan pangkat, dan BUP. Rumus pertama adalah TMT Golongan + siklus; TMT itu sendiri bukan tanggal jatuh tempo.

Setelah aplikasi aktif, buka **Data ASN/PPPK**, edit setiap PPPK, lalu pilih kategori yang benar. Jangan melakukan pengisian massal berdasarkan tebakan.

## 6. Konfigurasi Firebase Authentication

1. Firebase Console → Authentication → **Sign-in method** → aktifkan Google.
2. Authentication → Settings → **Authorized domains**:
   - domain preview Google AI Studio yang benar-benar digunakan;
   - `pt-dsa.github.io` untuk GitHub Pages;
   - domain produksi lain bila ada;
   - hapus domain uji yang tidak lagi diperlukan.
3. Project Settings → ubah Environment type menjadi **Production**.
4. Pastikan support email benar dan hanya pengelola resmi yang menjadi owner/editor project.
5. App Check dapat diaktifkan bertahap setelah uji staging. Pantau dahulu agar login produksi tidak terblokir mendadak.

Empat akun Firebase pada capture lama bukan sumber role. Sumber role aplikasi adalah tabel Supabase `app_access`.

## 7. Pasang backend Google Apps Script

1. Buka project **Backend SIKANDA**.
2. Ganti seluruh isi `Code.gs` dengan `apps-script/Code.gs` dari paket ini.
3. Project Settings → Script Properties. Isi:

| Key | Nilai |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | anon/publishable key project |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role/secret key yang baru |
| `FIREBASE_API_KEY` | Firebase Web API key |
| `GEMINI_API_KEY` | Gemini API key yang baru |
| `GEMINI_MODEL` | default `gemini-2.0-flash`, atau model yang telah diuji |
| `BOOTSTRAP_ADMIN_EMAIL` | email Google Administrator pertama |
| `DRIVE_FOLDER_NAME` | `SIKANDA_Foto_Pegawai` atau nama folder resmi |

4. Hapus `SPREADSHEET_ID`, `SHARED_SECRET`, dan `ALLOW_LEGACY_SECRET`. Rilis ini tidak memiliki fallback Spreadsheet.
5. Deploy → **New deployment** → Web app.
6. Execute as: **Me**. Who has access: **Anyone**. Akses “Anyone” diperlukan agar request masuk, tetapi setiap operasi POST tetap wajib membawa Firebase ID token dan dicocokkan ke `app_access`.
7. Salin URL `/exec`. Jangan memakai URL `/dev`.
8. Buka URL itu. Respons sehat memuat `ok: true`, `service: SIKANDA`, dan versi `1.1.0-secure`.

Setiap perubahan `Code.gs` berikutnya memerlukan **New version** pada deployment, bukan hanya Save.

## 8. Import ZIP ke Google AI Studio

1. Buat backup project AI Studio lama.
2. Import ZIP rilis ini sebagai project baru/staging terlebih dahulu.
3. Di menu Secrets/Environment isi tepat:

```text
VITE_APPS_SCRIPT_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

4. Jangan membuat `VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_GEMINI_API_KEY`, atau secret backend lain. Prefix `VITE_` membuat nilai tersedia di bundle browser.
5. Hapus `GEMINI_API_KEY` dari konfigurasi frontend AI Studio jika pernah dipakai; key tersebut hanya boleh berada di Script Properties Apps Script.
6. Preview, login dengan akun Administrator, dan pastikan URL tidak berhenti pada layar “SIKANDA sedang bersiap”.

Logo aplikasi sekarang menggunakan SVG internal sehingga tidak bergantung pada PNG lama yang rusak. Background login memakai `src/assets/images_landingpage.webp` yang sudah dioptimalkan dan aman untuk base path GitHub Pages.

## 9. Inisialisasi akun dan role

Login pertama dapat memakai email yang sama dengan `BOOTSTRAP_ADMIN_EMAIL`. Setelah masuk:

1. Buka **Kelola Akun**.
2. Daftarkan akun permanen Administrator dan Pimpinan.
3. Admin dan Pimpinan memiliki kewenangan identik: CRUD penuh, approval, konfigurasi, cleansing, dan kelola akun. Label role tetap berbeda untuk audit.
4. Untuk role Pegawai, email harus dihubungkan ke NIP 18 digit yang ada di tabel `pegawai`.
5. Setelah akun admin permanen tersimpan di `app_access`, `BOOTSTRAP_ADMIN_EMAIL` boleh tetap diset sebagai pemulihan terkontrol atau dikosongkan setelah uji pemulihan dilakukan.

Pegawai hanya melihat profil dan aset yang terhubung dengan dirinya. Pegawai tidak dapat membuat/menghapus profil, mengubah NIP, status, kategori PPPK, golongan, TMT, tanggal lahir, KGB, pangkat, atau BUP. Pegawai dapat memperbarui foto, kontak, email, pendidikan, diklat, dan keterangan miliknya sendiri.

## 10. Pengaturan Buku Penjagaan

Administrator/Pimpinan membuka **Buku Penjagaan → Pengaturan Agenda** untuk mengubah:

- siklus KGB (default 2 tahun);
- siklus kenaikan pangkat (default 4 tahun);
- usia BUP (default 58 tahun);
- jendela notifikasi;
- email penerima notifikasi.

Perubahan divalidasi di server dan dicatat ke `audit_logs`. Gunakan nilai selain default hanya atas keputusan administratif resmi.

## 11. Foto Google Drive

1. Saat upload pertama, Apps Script membuat/memakai folder sesuai `DRIVE_FOLDER_NAME`.
2. Beri otorisasi Drive kepada akun pemilik Apps Script saat diminta.
3. Uji satu foto dengan akun pegawai dan satu akun Administrator.
4. Pastikan file tidak berstatus “Anyone with the link”. File harus Private/Restricted.
5. Jangan memindahkan file secara manual tanpa memperbarui URL foto di Supabase.

## 12. Notifikasi otomatis

1. Apps Script → Triggers → Add Trigger.
2. Function: `kirimNotifikasiBukuPenjagaan`.
3. Event source: Time-driven.
4. Pilih jadwal harian di luar jam sibuk.
5. Pastikan timezone project `Asia/Jakarta`.
6. Uji tombol **Kirim Notifikasi** dari aplikasi sebelum mengaktifkan trigger.

Perhatikan kuota email dan URL Fetch Apps Script. Notifikasi memiliki pengaman agar tidak mengirim ulang otomatis pada hari yang sama.

## 13. Modul yang ditunda ke Versi 2

Menu berikut tetap terlihat bagi Admin/Pimpinan, tetapi hanya menampilkan “Menu dalam pengembangan, nantikan pada SIKANDA Versi 2.”:

- Pagu Anggaran;
- Pemeliharaan Kendaraan;
- Inventaris;
- Peminjaman.

Rilis V1 tidak membaca, menulis, menghitung, mencari, memetakan, memasukkan ke laporan, atau mengirim data ke Gemini dari empat modul tersebut.

## 14. Deploy GitHub Pages

1. Push isi proyek tanpa `.env` dan tanpa credential.
2. GitHub → Settings → Secrets and variables → Actions, isi tujuh `VITE_*` yang sama seperti AI Studio.
3. Settings → Pages → Source: GitHub Actions.
4. Workflow `.github/workflows/deploy.yml` akan menjalankan install, TypeScript check, build, dan deploy.
5. Pastikan domain GitHub Pages sudah ada pada Firebase Authorized domains.

## 15. Matriks uji penerimaan wajib

### Administrator dan Pimpinan

- Login berhasil dan role benar.
- Dashboard tampil tanpa permintaan data empat modul Versi 2.
- CRUD Pegawai, Kendaraan, serta Alat & Mesin berhasil.
- Soft delete menyembunyikan data tetapi tidak menghapus permanen.
- Kelola Akun dan Data Cleansing dapat diakses kedua role.
- Pengaturan KGB/Pangkat/BUP tersimpan dan hasil agenda berubah konsisten.
- Tanya SIKANDA dapat menjawab data aktif dan tidak membahas data modul Versi 2.

### Pegawai

- Setelah login langsung diarahkan ke profil sendiri.
- URL manual ke dashboard, akun, aset, laporan, dan konfigurasi ditolak/dialihkan.
- Daftar pegawai hanya berisi profil sendiri.
- Field resmi terkunci; field kontak/pendidikan/diklat/foto/keterangan dapat disimpan.
- Tanya SIKANDA hanya mengetahui data miliknya.

### Keamanan

- Cari bundle `dist` dan repository: tidak ada service-role key atau Gemini API key.
- Request tanpa Firebase ID token ditolak.
- Aksi database generik `supa_insert`, `supa_update`, dan `supa_delete` ditolak.
- Tabel Supabase tidak dapat dibaca memakai anon key.
- Foto Drive tetap Restricted.
- Perubahan penting muncul di `audit_logs`.

### Teknis lokal

```bash
npm ci
npm run lint
npm run build
npx esbuild tests/agenda.test.ts --bundle --platform=node --format=esm --outfile=/tmp/sikanda-agenda-test.mjs
node /tmp/sikanda-agenda-test.mjs
```

Output terakhir harus `agenda-tests: OK`.

## 16. Rollback

Jika staging gagal:

1. Jangan mengganti URL produksi frontend.
2. Kembalikan Apps Script ke deployment version sebelumnya.
3. Pulihkan Supabase dari backup hanya jika migrasi menyebabkan kerusakan data; penambahan kolom pada migrasi ini umumnya tidak memerlukan rollback data.
4. Simpan log error tanpa menampilkan token/key.
5. Perbaiki di staging, ulangi matriks uji, baru promosikan kembali.

## 17. Troubleshooting singkat

- **“Backend belum dikonfigurasi”**: periksa `VITE_APPS_SCRIPT_URL` dan pastikan berakhir `/exec`.
- **Login berhasil tetapi akun ditolak**: cek email, `role`, `nip`, dan `is_active` pada `app_access`.
- **Data lambat**: pastikan tidak memakai Apps Script deployment lama; rilis ini memakai cache 30 detik, deduplikasi request, dan maksimal enam request paralel.
- **Foto tidak tampil**: cek izin Drive Restricted dan pastikan akun yang sedang login menjadi viewer.
- **Tanya SIKANDA gagal**: cek key Gemini baru, nama model, quota, dan Apps Script execution log.
- **Logo/background kosong**: pastikan ZIP diimpor lengkap dan `src/assets/images_landingpage.webp` tersedia; logo tidak membutuhkan file PNG eksternal.
