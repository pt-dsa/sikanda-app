# SIKANDA V1.1.10 Secure

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah berbasis React/Vite, Firebase Authentication, Google Apps Script, dan Supabase PostgreSQL/Storage.

Mulai dari **`00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.10_SECURE.md`**. Paket berisi source frontend lengkap, backend Apps Script, build produksi, migrasi Supabase historis, 12 rangkaian pengujian, release notes, dan laporan verifikasi.

## Fokus V1.1.10

- Kondisi `NULL`/kosong tidak lagi ditampilkan atau tersimpan otomatis sebagai **BAIK**.
- Kondisi kosong ditampilkan konsisten sebagai **BELUM DIISI** pada card, tabel, detail, peta, filter, print, dan CSV.
- Tambah Kendaraan/Alat & Mesin wajib memilih kondisi berdasarkan pemeriksaan fisik.
- Edit data legacy tetap dapat menyimpan field lain tanpa mengubah kondisi secara diam-diam.
- Data Cleansing menampilkan aset tanpa kondisi dan menyediakan tombol **Perbaiki** langsung ke formulir terkait.
- Backend membatasi kondisi ke `BAIK`, `RUSAK RINGAN`, `KURANG BAIK`, atau `RUSAK BERAT`.
- Seluruh keamanan, CRUD, sinkronisasi, minimap, favicon, dan layout mobile-first dari V1.1.9 dipertahankan.

## Urutan upgrade

1. Backup source, deployment Apps Script, dan database.
2. Import `SIKANDA_v1.1.10_SECURE_AI_STUDIO_FINAL.zip` ke Google AI Studio.
3. Ganti penuh backend dengan `apps-script/Code.gs`, lalu deploy sebagai **New version** pada deployment Web App yang sama.
4. Deploy frontend ke GitHub Pages.
5. Hard refresh browser dan jalankan UAT pada panduan.

V1.1.10 tidak membutuhkan SQL, Script Property, trigger, atau migrasi foto baru. Jangan mengisi 172 kondisi kosong secara massal sebagai BAIK.

## Verifikasi lokal

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
cp apps-script/Code.gs /tmp/sikanda-code.js
node --check /tmp/sikanda-code.js
```

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, atau kredensial backend di source frontend maupun ZIP.
