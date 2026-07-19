# SIKANDA V1.1.14 Production Hardening

Paket ini adalah **full replacement** untuk sumber SIKANDA V1.1.13. Jangan mencampur file versi lama dan baru.

Urutan implementasi:

1. Ikuti `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.14_PRODUCTION_HARDENING.md`.
2. Jalankan migrasi Supabase `006_sikanda_v1_1_14_production_hardening.sql`, lalu `007_sikanda_v1_1_14_kib_b_import_gallery.sql`.
3. Ganti seluruh backend dengan `apps-script/Code.gs`, lalu deploy versi baru pada deployment Web App yang sama.
4. Impor seluruh ZIP ke Google AI Studio atau ganti seluruh repository dengan isi paket ini.
5. Isi environment/secrets, jalankan `npm ci && npm run verify`, lalu deploy ke Firebase Hosting.

Konfigurasi aman bawaan:

- sesi dan role selalu diverifikasi backend;
- cache data dibersihkan saat logout/pergantian akun;
- foto pegawai dan aset memakai bucket private serta signed URL;
- AI generatif default **nonaktif** dan tidak menerima data identitas;
- bootstrap admin default **nonaktif**;
- security headers aktif pada Firebase Hosting;
- seluruh GitHub Actions dipin ke commit immutable.
- import CSV KIB B menerjemahkan struktur baku, mengagregasi baris identik tanpa INDEX, dan menjaga total unit;
- galeri multi-lampiran memakai bucket private terpisah;
- filter Tahun, Kategori, INDEX, Bidang, dan Pengguna tersedia pada Alat & Mesin.

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, atau kredensial backend di frontend.
