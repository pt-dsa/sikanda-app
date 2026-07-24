# SIKANDA V1.1.16 Full Replacement

Rilis final V1.1.16 dibangun dari baseline resmi V1.1.15 dan memuat dua perubahan yang harus diterapkan sebagai satu paket:

1. autentikasi Firebase diganti menjadi Supabase Auth, tetapi seluruh registrasi, login, refresh token, verifikasi sesi, RBAC, CRUD, database, foto, notifikasi, dan proses bisnis tetap melalui Google Apps Script;
2. label modul aktif `Alat & Mesin` diubah menjadi `Inventaris`, sedangkan halaman `Inventaris` yang masih dikembangkan diubah menjadi `Alat & Mesin` pada seluruh tampilan pengguna.

Alur akun:

`Administrator/Pimpinan menetapkan NIP + email + role → user registrasi dengan password dan puzzle Logo SIKANDA → data valid → akun langsung Aktif → login menggunakan NIP + password + puzzle.`

Tidak ada status menunggu aktivasi. Browser hanya mengetahui URL Apps Script. URL/key Supabase, `service_role`, pepper password, dan operasi Auth Admin tidak berada di frontend.

Mulai implementasi dari `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.16_FULL_REPLACEMENT.md`. Jangan mengulang migrasi `001–008` bila sebelumnya sudah berhasil.

