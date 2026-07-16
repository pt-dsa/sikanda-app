# SIKANDA V1.1.8 Secure

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah berbasis React/Vite, Firebase Authentication, Google Apps Script, Supabase PostgreSQL/Storage, dan Tanya SIKANDA database-first.

Mulai implementasi dari **`00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.8_SECURE.md`**. Paket ini berisi full source frontend, backend Apps Script, skrip Supabase historis, pengujian, hasil build, dan laporan verifikasi.

## Fokus V1.1.8

- Label antarmuka `FUZZY` menjadi **Perlu Verifikasi** dan dapat membuka item koreksi yang tepat di Data Cleansing.
- Create/update Kendaraan dan Alat & Mesin tetap dapat disimpan tanpa koordinat.
- Koordinat lama dibaca otomatis dan menghasilkan minimap pada form edit.
- ID aset legacy, fallback `asset_locations`, validasi mutasi backend, dan toast duplikat diperbaiki.
- CRUD seluruh modul utama diaudit dan dilindungi dari status berhasil palsu.
- Subtitle PPPK Penuh Waktu dan favicon tab browser diperbaiki.

## Urutan upgrade wajib

1. Backup source, deployment Apps Script, dan Supabase.
2. Import/upload ZIP V1.1.8 ke project Google AI Studio.
3. Ganti penuh Apps Script dengan `apps-script/Code.gs`, lalu deploy sebagai **New version** pada deployment lama.
4. Deploy frontend V1.1.8 ke GitHub Pages.
5. Jalankan skenario validasi pada panduan.

V1.1.8 tidak membutuhkan migrasi SQL, Script Property, trigger, atau migrasi foto baru. Jangan menjalankan ulang migrasi V1.1.7 hanya untuk memasang versi ini.

## Pemeriksaan lokal

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
```

Secret Firebase, Supabase service-role, dan Gemini tidak boleh masuk source/frontend/GitHub.
