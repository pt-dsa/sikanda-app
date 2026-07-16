# SIKANDA V1.1.9 Secure

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah berbasis React/Vite, Firebase Authentication, Google Apps Script, Supabase PostgreSQL/Storage, dan Tanya SIKANDA database-first.

Mulai implementasi dari **`00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.9_SECURE.md`**. Paket ini berisi full source frontend, backend Apps Script, skrip Supabase historis, sebelas rangkaian pengujian, build produksi, release notes, dan laporan verifikasi.

## Fokus V1.1.9

- Update nama Pengguna Alat & Mesin tidak lagi gagal karena placeholder/angka kosong legacy atau penulisan ulang metadata lokasi yang tidak berubah.
- Tombol **Sinkronisasi** tersedia di Kelola Akun, Data Kendaraan, dan Alat & Mesin.
- Header waktu memakai format `Kamis,16 Juli 2026 | Pukul 11:27:08 WIB`.
- Grafik Distribusi Masa Kerja memenuhi card secara proporsional.
- Topbar, modal, action bar, card akun, safe area, dan overflow diperbaiki dengan pendekatan mobile-first.
- Create Kendaraan dan Alat & Mesin tetap menulis langsung ke tabel Supabase melalui backend Apps Script dan wajib menerima baris hasil mutasi.

## Urutan upgrade wajib

1. Backup source, deployment Apps Script, dan Supabase.
2. Import/upload ZIP V1.1.9 ke project Google AI Studio.
3. Ganti penuh Apps Script dengan `apps-script/Code.gs`, lalu deploy sebagai **New version** pada deployment lama.
4. Deploy frontend V1.1.9 ke GitHub Pages.
5. Jalankan skenario penerimaan pada panduan.

V1.1.9 tidak membutuhkan SQL, Script Property, trigger, atau migrasi foto baru.

## Pemeriksaan lokal

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
node --check < apps-script/Code.gs
```

Secret Supabase, Gemini, dan kredensial backend tidak boleh masuk frontend, GitHub, atau ZIP.
