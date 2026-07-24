# Verification Report — SIKANDA V1.1.16 Final Full Replacement

Tanggal verifikasi: 23 Juli 2026 (Asia/Jakarta)  
Baseline resmi: SIKANDA V1.1.15  
SHA-256 baseline: `a9b0316f37e28144386b3251a457c2669c82f1186266e40f448e814e02bc6e7e`

## 1. Ruang lingkup yang diverifikasi

V1.1.16 final memuat dua perubahan yang diterapkan sebagai satu full replacement:

1. Firebase Authentication/Google Sign-In diganti dengan Supabase Authentication, sementara Google Apps Script tetap menjadi satu-satunya backend/gateway aplikasi;
2. label modul aktif `Alat & Mesin` diubah menjadi `Inventaris`, sedangkan halaman V2 `Inventaris` diubah menjadi `Alat & Mesin` pada seluruh tampilan pengguna.

Seluruh CRUD, RBAC, database, private Storage, foto, import, notifikasi, laporan, dan proses bisnis tetap melalui Apps Script. Browser tidak mengakses tabel Supabase atau Auth Admin API secara langsung.

## 2. Hasil verifikasi otomatis final

| Pemeriksaan | Hasil |
|---|---|
| Instalasi bersih `npm ci` | **LULUS**, 233 package; memakai cache `/tmp` terisolasi karena cache npm default runtime rusak |
| TypeScript `tsc --noEmit` | **LULUS** |
| Regression test | **LULUS**, seluruh 21 rangkaian test |
| Test pertukaran label V1.1.16 | **LULUS** |
| Test struktur Supabase Auth V1.1.16 | **LULUS** |
| Test perilaku backend Auth/CAPTCHA | **LULUS** |
| Build produksi Vite | **LULUS**, 2.942 modul |
| Sintaks `apps-script/Code.gs` | **LULUS** |
| `npm audit --omit=dev --audit-level=high` | **LULUS**, 0 kerentanan |
| Pemindaian runtime Firebase Auth | **LULUS**, tidak ditemukan |
| Pemindaian nama secret/dummy pada `dist` | **LULUS**, tidak ditemukan |
| Pemindaian pola nilai key/JWT pada source | **LULUS**, tidak ditemukan |

Build final dijalankan tanpa URL Apps Script uji. Nilai `TEST_SIKANDA_V1116`, konfigurasi Firebase Auth, key Supabase, service-role key, pepper, `GEMINI_API_KEY`, dan `BOOTSTRAP_ADMIN_EMAIL` tidak terdapat pada bundle produksi.

## 3. Verifikasi autentikasi

| Kontrol | Hasil source/test |
|---|---|
| Registrasi melalui Apps Script | `auth_register` tersedia dan memerlukan NIP, email, password, serta bukti puzzle |
| Aktivasi langsung | Registrasi valid mengisi `auth_user_id` dan mengubah `auth_status` dari `ready` menjadi `active` tanpa status pending |
| Role | Selalu diambil dari `app_access`; tidak diterima dari form registrasi atau metadata user |
| Login NIP | Apps Script memetakan NIP ke email internal lalu menjalankan password grant Supabase |
| Password | Minimal 10 karakter, huruf+angka; ditransformasikan HMAC-SHA256 dengan pepper rahasia dan NIP sebelum dikirim ke Supabase |
| Token | Access token diverifikasi melalui endpoint `/auth/v1/user` Supabase |
| Otorisasi per request | `auth_user_id`, email, NIP, `is_active`, `auth_status`, dan role diperiksa server-side |
| Penonaktifan | Status akses dibaca ulang dari `app_access` pada setiap request; token lama langsung kehilangan akses data |
| Reset Registrasi | User Auth lama dihapus, binding dibersihkan, status kembali `ready`, dan password lama tidak dapat dipakai |
| Sesi browser | Hanya access/refresh token di `sessionStorage`; profil/role tidak dipulihkan dari storage |
| Refresh | Dijalankan melalui Apps Script dan diserialkan di frontend untuk mencegah refresh paralel |
| Secret | `SUPABASE_SERVICE_ROLE_KEY`, anon key, URL Supabase, dan pepper hanya digunakan Apps Script |

Test perilaku mengeksekusi fungsi autentikasi Apps Script dalam VM dengan mock terkontrol dan membuktikan:

- kredensial turunan berbeda untuk password sama pada NIP berbeda;
- password lemah ditolak;
- CAPTCHA challenge hanya dapat digunakan sekali;
- akun `disabled` dan akun `ready` ditolak dari data bisnis;
- registrasi valid mengaktifkan akun secara langsung;
- role hasil registrasi berasal dari `app_access`.

## 4. Verifikasi CAPTCHA puzzle Logo SIKANDA

- aset yang dipakai adalah `src/assets/logo_kota_tangerang_selatan.png`, sama dengan logo identitas SIKANDA;
- potongan menggunakan path jigsaw, bukan kotak biasa;
- posisi horizontal dan vertikal challenge diacak;
- slider mendukung pointer/touch dan keyboard melalui input range;
- challenge berlaku 120 detik, terikat ke tujuan `login`/`register` dan client key, lalu dihapus sebelum validasi agar sekali pakai;
- backend memeriksa toleransi posisi, durasi browser dan server, jumlah posisi unik, rentang/jarak gerak, serta posisi akhir;
- rate limit tersedia untuk pembuatan challenge, NIP login, client login, NIP registrasi, dan client registrasi;
- submit UI dinonaktifkan sebelum puzzle dinyatakan selesai.

CAPTCHA ini adalah kontrol kustom sesuai kebutuhan SIKANDA, bukan layanan reputasi bot eksternal. Karena koordinat visual harus tersedia untuk menggambar lubang puzzle, perlindungan tidak boleh hanya bergantung pada puzzle; implementasi juga mempertahankan rate limit, password kuat, gateway Apps Script, binding Auth, dan penutupan tabel dari browser.

## 5. Verifikasi migrasi database

`009A_PRECHECK_SIKANDA_V1.1.16_SUPABASE_AUTH.sql` bersifat read-only dan memeriksa:

- duplikasi email tanpa membedakan kapitalisasi;
- duplikasi NIP;
- email/NIP tidak valid;
- NIP akun yang tidak terhubung ke pegawai aktif;
- keberadaan user Supabase Auth lama yang perlu ditinjau.

Migrasi aditif `009_sikanda_v1_1_16_supabase_auth.sql` menambahkan `auth_user_id`, `auth_status`, `registered_at`, indeks unik email/NIP/Auth user, foreign key ke `auth.users`, serta mempertahankan pencabutan privilege `anon` dan `authenticated` pada `app_access`.

SQL telah diaudit secara statis tetapi tidak dijalankan terhadap database produksi dari lingkungan verifikasi ini. Precheck, backup, eksekusi migrasi, dan pemeriksaan hasil live tetap wajib mengikuti panduan.

## 6. Konsistensi pertukaran label

| Area | Hasil |
|---|---|
| Sidebar | `/alat-mesin` tampil sebagai **Inventaris**; `/inventaris` tampil sebagai **Alat & Mesin** |
| Modul CRUD aktif | Judul, total, detail, tambah/edit, foto, pesan sukses, dan ringkasan memakai **Inventaris** |
| Modul V2 | Halaman pengembangan memakai **Alat & Mesin** |
| Laporan | Kartu, pilihan cetak, isi cetak, dan nama CSV memakai **Data Inventaris** |
| Pencarian/Peta | Data `assets_equipment` ditampilkan sebagai **Inventaris** |
| Detail Pegawai | Relasi aktif berjudul **Inventaris**; relasi V2 berjudul **Alat & Mesin** |
| Dashboard/Cleansing/Tanya SIKANDA | Istilah tampilan telah diselaraskan |

Identitas teknis `assets_equipment`, `equipment_*`, `alat_mesin`, route, bucket, alias folder media, dan nama komponen internal sengaja dipertahankan untuk kompatibilitas data dan integrasi.

## 7. Audit UI responsif

Audit statis pada komponen memastikan:

- form autentikasi menggunakan lebar responsif, padding mobile, dan satu kolom;
- field NIP memakai input numerik dan batas 18 digit;
- password dapat ditampilkan/disembunyikan serta memakai autocomplete yang sesuai;
- kanvas puzzle mengikuti lebar container dengan tinggi tetap;
- Kelola Akun memakai kartu mobile dan tabel desktop;
- modal akun menggunakan `100dvh`, area scroll internal, dan tombol sentuh minimal 44 px.

Screenshot browser headless tidak dapat dibuat karena runtime verifikasi tidak menyediakan binary Chromium. Kondisi ini dicatat sebagai keterbatasan lingkungan; UAT visual nyata pada Chrome/Edge desktop dan Android/iOS tetap merupakan gerbang **GO**.

## 8. Batas verifikasi dan status rilis

Verifikasi lokal membuktikan source dapat dipasang dari lockfile, dikompilasi, diuji, dibangun, dan dipindai tanpa temuan otomatis. Verifikasi ini belum membuktikan:

- precheck/migrasi pada database live;
- Script Properties aktual;
- deploy Apps Script `/exec`;
- perilaku Supabase Auth project aktual;
- CAPTCHA pada perangkat nyata;
- UAT role Administrator, Pimpinan, dan Pegawai;
- rollback aktual ke V1.1.15.

Kesimpulan: paket V1.1.16 final **lulus verifikasi lokal dan siap masuk staging/UAT terkontrol**. Status produksi tetap **NO-GO sampai seluruh checklist pada panduan lulus**, khususnya backup, migrasi live, registrasi pengelola pertama, pengujian penonaktifan token, tiga role, browser mobile/desktop, dan regression proses bisnis.
