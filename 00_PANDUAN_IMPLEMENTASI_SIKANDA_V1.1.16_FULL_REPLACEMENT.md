# Panduan Implementasi SIKANDA V1.1.16 Full Replacement

Tanggal: 23 Juli 2026  
Baseline resmi: SIKANDA V1.1.15, SHA-256 `a9b0316f37e28144386b3251a457c2669c82f1186266e40f448e814e02bc6e7e`

Ikuti panduan ini dari awal sampai akhir. Jangan menggabungkan file V1.1.16 dengan source versi lain dan jangan mengulang migrasi `001–008` bila sebelumnya sudah berhasil.

## 1. Ruang lingkup final

V1.1.16 memuat dua pekerjaan dalam satu full replacement:

1. mengganti Firebase Authentication menjadi Supabase Authentication;
2. menukar nama tampilan modul `Alat & Mesin` dan `Inventaris` secara menyeluruh.

Arsitektur setelah implementasi:

```text
Browser React/Vite
  └─ hanya menghubungi Google Apps Script
       ├─ puzzle CAPTCHA Logo SIKANDA
       ├─ registrasi/login/refresh/logout Supabase Auth
       ├─ verifikasi token + app_access + role
       ├─ seluruh CRUD dan proses bisnis
       └─ Supabase Database dan private Storage memakai service_role
```

Supabase tidak menggantikan Apps Script sebagai backend. Browser tidak memperoleh `SUPABASE_URL`, anon key, service-role key, atau pepper password.

## 2. Alur registrasi dan login

### 2.1 Administrator/Pimpinan menyiapkan akun

Pada menu **Kelola Akun**:

1. pilih pegawai aktif;
2. pastikan NIP 18 digit;
3. masukkan atau periksa email yang akan digunakan untuk registrasi;
4. pilih role `Administrator`, `Pimpinan`, atau `Pegawai`;
5. simpan.

Status awal akun adalah **Siap Registrasi**. Administrator/Pimpinan tidak membuat password.

### 2.2 User registrasi

User membuka tab **Registrasi** dan mengisi:

- NIP;
- email yang telah didaftarkan;
- password minimal 10 karakter, memuat huruf dan angka;
- konfirmasi password;
- slide puzzle Logo SIKANDA.

Apps Script memeriksa NIP aktif, kecocokan NIP–email pada `app_access`, status `ready`, puzzle, rate limit, dan ketiadaan binding lama. Bila seluruhnya valid, Apps Script membuat user Supabase Auth, mengisi `auth_user_id`, mengubah status menjadi `active`, dan membuat sesi.

Tidak ada tahap **Menunggu Aktivasi**. Akun langsung dapat digunakan.

### 2.3 User login

User mengisi NIP, password, dan puzzle Logo SIKANDA. Apps Script memetakan NIP ke email internal, melakukan password grant ke Supabase Auth, lalu memeriksa kembali `auth_user_id`, status, role, dan NIP.

## 3. Isi paket

- `apps-script/Code.gs` — backend penuh V1.1.16;
- `supabase/009A_PRECHECK_SIKANDA_V1.1.16_SUPABASE_AUTH.sql` — pemeriksaan read-only;
- `supabase/009_sikanda_v1_1_16_supabase_auth.sql` — migrasi Auth;
- `src/pages/Login.tsx` — login/registrasi NIP;
- `src/components/auth/LogoSliderCaptcha.tsx` — puzzle jigsaw Logo SIKANDA;
- `src/lib/authSession.ts` — penyimpanan sesi per tab;
- `src/services/authService.ts` dan `backendClient.ts` — gateway autentikasi Apps Script;
- `src/pages/KelolaAkun.tsx` — status akun dan Reset Registrasi;
- `ROLLBACK_SIKANDA_V1.1.16_TO_V1.1.15.md` — rollback operasional;
- `VERIFICATION_REPORT_V1.1.16.md` — hasil verifikasi teknis.

## 4. Backup wajib

Sebelum perubahan, simpan:

1. dump database Supabase;
2. backup objek Storage atau daftar path objek penting;
3. salinan seluruh `Code.gs` V1.1.15;
4. ekspor/catatan Script Properties;
5. ZIP baseline V1.1.15 beserta checksum;
6. konfigurasi Firebase Auth lama untuk rollback;
7. screenshot isi `app_access` dan daftar Supabase Authentication Users.

Jangan menaruh backup service-role key atau pepper dalam repository publik.

## 5. Precheck database — jalankan sebelum migrasi

1. Buka **Supabase → SQL Editor → New query**.
2. Buka file `supabase/009A_PRECHECK_SIKANDA_V1.1.16_SUPABASE_AUTH.sql`.
3. Salin **seluruh isi file**, tempel sebagai satu query, lalu tekan **Run satu kali**.
4. Periksa tabel hasil. Untuk pemeriksaan `01` sampai `05`, status wajib `PASS` dan `issue_count` wajib `0`.
5. Pemeriksaan `06_existing_supabase_auth_users` diharapkan `PASS`. Bila `REVIEW`, jangan lanjut sebelum memastikan user lama bukan sisa percobaan.

Jika precheck gagal, jalankan blok diagnosis yang sesuai secara terpisah—satu blok lalu satu kali **Run**.

### 5.1 Email ganda

```sql
select lower(trim(email)) as normalized_email, count(*)
from public.app_access
where nullif(trim(email), '') is not null
group by lower(trim(email))
having count(*) > 1;
```

### 5.2 NIP ganda

```sql
select regexp_replace(coalesce(nip, ''), '\s+', '', 'g') as normalized_nip, count(*)
from public.app_access
where nullif(regexp_replace(coalesce(nip, ''), '\s+', '', 'g'), '') is not null
group by regexp_replace(coalesce(nip, ''), '\s+', '', 'g')
having count(*) > 1;
```

### 5.3 Email/NIP tidak valid

```sql
select email, nip, nama, role
from public.app_access
where email is null
   or trim(email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
   or regexp_replace(coalesce(nip, ''), '\s+', '', 'g') !~ '^[0-9]{18}$'
order by email;
```

Perbaiki datanya melalui mekanisme yang terkendali. Semua akun—termasuk Administrator dan Pimpinan—wajib memiliki NIP 18 digit untuk registrasi baru.

## 6. Jalankan migrasi 009

Lanjutkan hanya jika precheck sudah benar.

1. Buat query baru di SQL Editor.
2. Buka `supabase/009_sikanda_v1_1_16_supabase_auth.sql`.
3. Salin **seluruh isi file** dari `begin;` sampai `commit;`.
4. Tempel sebagai satu blok dan tekan **Run satu kali**.
5. Jangan menjalankan `001`, `002`, `003`, `004`, `005`, `006`, `007`, atau `008` lagi.

Migrasi `009` menambahkan:

- `auth_user_id uuid` dengan foreign key ke `auth.users.id`;
- `auth_status` dengan nilai `ready`, `active`, atau `disabled`;
- `registered_at`;
- indeks unik email tanpa membedakan kapitalisasi;
- indeks unik NIP dan Auth user;
- validasi format NIP;
- RLS/GRANT yang tetap menutup `app_access` dari browser.

### 6.1 Verifikasi migrasi

Jalankan blok berikut sebagai satu query:

```sql
select auth_status, count(*)
from public.app_access
group by auth_status
order by auth_status;
```

Sebelum ada registrasi, akun aktif lama umumnya tampil sebagai `ready`.

Lalu jalankan:

```sql
select email, nip, role, is_active, auth_status, auth_user_id, registered_at
from public.app_access
order by email;
```

Pastikan email/NIP benar, `auth_user_id` masih kosong, dan tidak ada akun yang salah role.

## 7. Konfigurasi Supabase Authentication

Di Supabase Dashboard:

1. buka **Authentication → Providers → Email**;
2. pastikan provider Email aktif agar password login dapat digunakan;
3. nonaktifkan pendaftaran publik/anonymous sign-up bila opsi tersebut tersedia; user SIKANDA dibuat melalui Admin API Apps Script, bukan endpoint sign-up browser;
4. email confirmation tidak diperlukan untuk alur ini karena Apps Script membuat user dengan `email_confirm=true` setelah NIP–email lolos validasi;
5. jangan mengaktifkan CAPTCHA native Supabase pada password grant V1.1.16; CAPTCHA yang digunakan adalah puzzle Logo SIKANDA di gateway Apps Script;
6. tidak perlu menyiapkan SMTP, magic link, atau OTP email;
7. pertahankan JWT expiry standar sekitar 3.600 detik. Frontend memperbarui sesi melalui Apps Script sebelum kedaluwarsa.

Referensi resmi: [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [Admin createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), dan [getUser untuk validasi otentik](https://supabase.com/docs/reference/javascript/auth-getuser).

## 8. Ganti dan konfigurasi Apps Script

### 8.1 Full replace Code.gs

1. Buka project Google Apps Script backend SIKANDA.
2. Backup isi lama.
3. Hapus isi editor `Code.gs` lama.
4. Salin seluruh isi `apps-script/Code.gs` V1.1.16.
5. Simpan.

### 8.2 Script Properties

Buka **Project Settings → Script Properties**. Pastikan nilai berikut tersedia:

```text
SUPABASE_URL=<Project URL Supabase yang saat ini dipakai SIKANDA>
SUPABASE_ANON_KEY=<anon/publishable key project yang sama>
SUPABASE_SERVICE_ROLE_KEY=<service_role key project yang sama>
AUTH_REGISTRATION_ENABLED=false
AUTH_CAPTCHA_TOLERANCE=3.5
SUPABASE_PHOTO_BUCKET=pegawai-photos
SUPABASE_ASSET_PHOTO_BUCKET=asset-photos
SUPABASE_ASSET_ATTACHMENT_BUCKET=asset-attachments
PHOTO_SIGNED_URL_SECONDS=3600
AI_GENERATIVE_ENABLED=false
```

Keterangan:

- `AUTH_REGISTRATION_ENABLED` sengaja dimulai `false` sampai migrasi dan pepper selesai.
- `AUTH_CAPTCHA_TOLERANCE=3.5` adalah toleransi posisi slider dalam skala 0–100. Jangan memperbesar tanpa pengujian.
- `AUTH_PASSWORD_PEPPER` tidak perlu dibuat manual; fungsi setup akan membuatnya.
- `FIREBASE_API_KEY` tidak digunakan lagi oleh Code V1.1.16. Simpan hanya di backup rollback, bukan di frontend.
- Properti Storage, notifikasi, Gemini, dan health-check yang sudah valid tetap dipertahankan.

### 8.3 Buat pepper satu kali

1. Pada dropdown fungsi di toolbar Apps Script, pilih `buatAuthPasswordPepperV1116`.
2. Tekan **Run**.
3. Berikan otorisasi bila diminta.
4. Buka **Execution log**. Hasil yang benar menyatakan `created: true` atau `created: false` bila pepper sudah tersedia.
5. Kembali ke Script Properties dan pastikan `AUTH_PASSWORD_PEPPER` sudah ada.

Jangan mengubah, menghapus, atau membuat ulang pepper setelah user mulai registrasi. Seluruh password bergantung pada pepper tersebut. Simpan backup Script Properties secara aman.

### 8.4 Aktifkan registrasi

1. Pilih fungsi `aktifkanRegistrasiV1116`.
2. Tekan **Run satu kali**.
3. Fungsi memeriksa kolom migrasi `009` dan pepper, lalu mengubah `AUTH_REGISTRATION_ENABLED=true`.
4. Bila fungsi gagal, jangan mengubah flag secara manual; selesaikan pesan error terlebih dahulu.

### 8.5 Deploy Apps Script

1. Pilih **Deploy → Manage deployments**.
2. Klik ikon **Edit** pada deployment aktif.
3. Pada Version pilih **New version**.
4. Isi deskripsi `SIKANDA V1.1.16 Supabase Auth + Puzzle Logo`.
5. Tekan **Deploy**.
6. Pertahankan URL Web App `/exec` yang sama.
7. Buka URL tersebut di browser. Respons wajib memuat:

```json
{"ok":true,"service":"SIKANDA","version":"1.1.16-production"}
```

## 9. Full replacement di Google AI Studio

Tahap ini wajib dilakukan setelah Apps Script V1.1.16 sudah dideploy.

1. Simpan salinan project/source Google AI Studio yang aktif.
2. Buka project SIKANDA pada Google AI Studio.
3. Import ZIP **SIKANDA V1.1.16 Full Replacement**.
4. Pilih mekanisme **replace/full replacement**, bukan menyalin beberapa file ke source lama.
5. Pastikan environment frontend hanya membutuhkan:

```text
VITE_APPS_SCRIPT_URL=<URL /exec Apps Script V1.1.16>
```

6. Hapus kebutuhan `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, dan `VITE_FIREBASE_MESSAGING_SENDER_ID` dari konfigurasi build aktif.
7. Jangan membuat `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SERVICE_ROLE_KEY`, atau `VITE_AUTH_PASSWORD_PEPPER`.
8. Build/preview dan pastikan halaman menampilkan tab **Masuk**, tab **Registrasi**, serta puzzle Logo SIKANDA.

## 10. GitHub Pages staging

Repository publik hanya memerlukan GitHub Actions Secret:

```text
VITE_APPS_SCRIPT_URL=<URL /exec Apps Script V1.1.16>
```

Langkah:

1. replace source repository dengan isi ZIP V1.1.16;
2. pastikan tidak ada file `.env` berisi nilai aktual;
3. commit dan push;
4. buka **Actions → Deploy SIKANDA ke GitHub Pages (Staging Manual)**;
5. pilih **Run workflow**;
6. pastikan install, TypeScript, seluruh test, audit high, build, dan deploy lulus.

Firebase Hosting tetap dapat digunakan sebagai hosting statis manual di kemudian hari. `FIREBASE_HOSTING_PROJECT_ID` dan service account hosting tidak berkaitan dengan Firebase Authentication dan tidak diperlukan untuk GitHub Pages.

## 11. Registrasi akun pertama

Karena Supabase Authentication awalnya kosong, lakukan ini segera di staging:

1. gunakan NIP dan email salah satu akun Administrator/Pimpinan yang sudah ada di `app_access`;
2. buka tab **Registrasi**;
3. isi NIP, email, password, dan konfirmasi password;
4. geser potongan Logo SIKANDA hingga tepat;
5. tekan **Daftarkan Akun**;
6. aplikasi harus langsung membuka SIKANDA sebagai role yang ditetapkan Administrator/Pimpinan;
7. periksa Supabase **Authentication → Users**: user harus muncul;
8. periksa `app_access`: `auth_status='active'`, `auth_user_id` terisi, dan `registered_at` terisi.

Jangan menambahkan user secara manual melalui tombol **Add user** di Supabase Dashboard kecuali sedang menjalankan prosedur pemulihan terkontrol.

## 12. UAT wajib

### 12.1 CAPTCHA

- logo Kota Tangerang Selatan tampil di dalam puzzle;
- potongan berbentuk jigsaw dan dapat digeser dengan mouse/touch;
- submit ditolak sebelum puzzle selesai;
- challenge lama ditolak setelah dipakai;
- challenge diperbarui setelah gagal;
- challenge kedaluwarsa setelah sekitar dua menit;
- percobaan berulang memicu rate limit.

### 12.2 Registrasi

- NIP tidak terdaftar → ditolak;
- email tidak cocok dengan `app_access` → ditolak;
- password kurang dari 10 karakter atau tidak berisi huruf+angka → ditolak;
- konfirmasi password berbeda → ditolak;
- NIP/email valid dan status `ready` → langsung `active`;
- registrasi kedua pada akun yang sama → ditolak;
- role tidak dapat dipilih/diubah oleh user registrasi.

### 12.3 Login dan sesi

- NIP/password benar → berhasil;
- password salah → pesan umum, tidak membocorkan email;
- reload halaman pada tab yang sama → sesi pulih melalui `whoami`;
- menutup tab/browser → sesi `sessionStorage` berakhir;
- logout → token lokal dibersihkan;
- refresh token berjalan melalui Apps Script;
- akun yang dinonaktifkan ditolak pada request berikutnya walaupun access token lama belum kedaluwarsa.

### 12.4 Role

- Administrator dan Pimpinan: hak manajemen penuh sesuai baseline;
- Pegawai: menu dan hak perubahan tetap mengikuti RBAC SIKANDA;
- akses URL langsung ke menu yang tidak diizinkan tetap ditolak;
- backend menolak mutasi tanpa role yang sesuai.

### 12.5 Kelola Akun

- tambah akun menghasilkan **Siap Registrasi**;
- Edit dapat mengubah role dan mengaktifkan kembali akun;
- Nonaktifkan memutus akses;
- Reset Registrasi menghapus kredensial lama dan mengembalikan status **Siap Registrasi**;
- password lama gagal setelah reset;
- user dapat registrasi ulang dengan password baru;
- akun sendiri tidak dapat dinonaktifkan/reset;
- pengelola aktif terakhir tidak dapat dihilangkan.

### 12.6 Regression proses bisnis

Uji Dashboard, Data ASN/PPPK, Buku Penjagaan, Data Kendaraan, Inventaris, Peta Sebaran, Rekap Laporan, Tanya SIKANDA, Data Cleansing, foto, lampiran, import CSV, QR, notifikasi, dan seluruh CRUD.

Pastikan nama tampilan:

- route/modul aktif `/alat-mesin` tampil sebagai **Inventaris**;
- route/modul V2 `/inventaris` tampil sebagai **Alat & Mesin**;
- nama teknis database tidak berubah.

## 13. Go/No-Go

Status **GO** hanya bila:

- seluruh precheck dan migrasi berhasil;
- minimal dua akun pengelola dapat login untuk menghindari single point of failure;
- registrasi valid langsung aktif;
- kasus negatif registrasi/login ditolak;
- penonaktifan/reset memutus token lama;
- tiga role lulus UAT;
- seluruh regression test/build lulus;
- tidak ada key/pepper/token pada `dist` atau repository;
- backup dan rollback telah dipahami.

Status **NO-GO** bila ada NIP/email ganda, pengelola tanpa NIP, user Auth yatim, token akun nonaktif masih memperoleh data, role salah, puzzle dapat dilewati pada endpoint Apps Script, secret masuk frontend, atau salah satu proses bisnis mengalami regresi.

## 14. Rollback

Gunakan `ROLLBACK_SIKANDA_V1.1.16_TO_V1.1.15.md`.

Ringkasannya:

1. jalankan `nonaktifkanRegistrasiV1116`;
2. deploy kembali `Code.gs` V1.1.15 sebagai New version;
3. pulihkan frontend V1.1.15 dan konfigurasi Firebase Auth lama dari backup;
4. uji tiga role;
5. jangan menghapus kolom `009` atau user/database secara massal saat insiden.

## 15. Catatan keamanan CAPTCHA kustom

Puzzle Logo SIKANDA adalah kontrol pada gateway Apps Script, dilengkapi challenge server-side sekali pakai, masa berlaku, validasi jejak, HMAC untuk identifier rate-limit, dan pembatasan percobaan. Karena CAPTCHA kustom tidak mempunyai jaringan reputasi bot seperti layanan CAPTCHA eksternal, kontrol ini harus dipertahankan bersama rate limit, password kuat, binding `auth_user_id`, tabel bisnis tertutup dari browser, dan monitoring log kegagalan.

Jangan memindahkan proses registrasi atau login langsung ke browser/Supabase JS tanpa desain keamanan baru; langkah tersebut akan melewati puzzle dan gateway yang ditetapkan untuk V1.1.16.
