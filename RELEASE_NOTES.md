# Release Notes — SIKANDA V1.1.16

Tanggal rilis: 23 Juli 2026 (Asia/Jakarta)

## Autentikasi

- Firebase Authentication dan Google Sign-In dihapus dari runtime aplikasi.
- Login menggunakan NIP, password, dan slide puzzle Logo SIKANDA.
- Registrasi menggunakan NIP, email yang ditetapkan Administrator/Pimpinan, password, konfirmasi password, dan puzzle yang sama.
- Apps Script membuat user melalui Supabase Auth Admin API, mengikat `auth.users.id` ke `app_access.auth_user_id`, lalu mengaktifkan akun secara langsung.
- Password pengguna ditransformasikan dengan HMAC-SHA256 dan pepper rahasia di Apps Script sebelum dikirim ke Supabase Auth; pepper tidak pernah berada di frontend.
- Access token dan refresh token Supabase hanya disimpan pada `sessionStorage` browser. Role/nama/NIP tidak dipercaya dari storage dan selalu dimuat ulang melalui `whoami` Apps Script.
- Token diverifikasi melalui endpoint Auth Supabase; `is_active`, `auth_status`, email, NIP, role, dan binding `auth_user_id` diperiksa ulang pada setiap request.
- Reset Registrasi menghapus kredensial Auth lama, membersihkan binding, dan mengembalikan status akun menjadi `ready`.

## CAPTCHA puzzle Logo SIKANDA

- Menggunakan aset resmi `logo_kota_tangerang_selatan.png`.
- Potongan berbentuk jigsaw, posisi/tinggi diacak, mendukung mouse, sentuhan, dan keyboard.
- Challenge berlaku 120 detik, satu kali pakai, terikat ke tujuan login/registrasi dan client key.
- Apps Script memeriksa toleransi posisi, durasi, jumlah posisi unik, jarak gerak, dan posisi akhir.
- Rate limit diterapkan terpisah pada challenge, NIP login, client login, NIP registrasi, dan client registrasi.

## Kelola Akun

- Status akun: `Siap Registrasi`, `Aktif`, dan `Dinonaktifkan`.
- Administrator/Pimpinan menetapkan NIP, email, dan role tanpa membuat password pengguna.
- Tersedia Reset Registrasi dan pencegahan penonaktifan/reset akun sendiri.
- Sistem menjaga minimal satu Administrator/Pimpinan yang sudah aktif.

## Nama modul

- Modul CRUD aset aktif: **Inventaris**.
- Modul V2 yang belum aktif: **Alat & Mesin**.
- Label diselaraskan pada sidebar, halaman, kartu, form, detail, peta, cleansing, pencarian, laporan/cetak/CSV, Dashboard, detail pegawai, notifikasi, dan Tanya SIKANDA.
- Nama teknis `assets_equipment`, action `equipment_*`, route `/alat-mesin`, route `/inventaris`, bucket, dan relasi database tidak diubah.

## Database dan deployment

- Ditambahkan precheck read-only `009A_PRECHECK_SIKANDA_V1.1.16_SUPABASE_AUTH.sql`.
- Ditambahkan migrasi aditif `009_sikanda_v1_1_16_supabase_auth.sql`.
- Frontend hanya memerlukan `VITE_APPS_SCRIPT_URL`.
- Workflow GitHub Pages dan Firebase Hosting tidak lagi meminta environment Firebase Auth.
- Firebase Hosting tetap pilihan hosting statis manual; migrasi ini tidak memaksa perubahan hosting.

