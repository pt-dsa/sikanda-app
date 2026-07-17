# SIKANDA V1.1.12 Secure

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah berbasis React/Vite, Firebase Authentication, Google Apps Script, dan Supabase PostgreSQL/Storage.

Mulai dari **`00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.12_SECURE.md`**. Paket berisi source frontend lengkap, backend Apps Script, build produksi, migrasi Supabase historis, 14 rangkaian pengujian, release notes, dan laporan verifikasi.

## Fokus V1.1.12

- PPPK (Paruh Waktu) tidak lagi menampilkan kartu KGB, kenaikan pangkat, atau BUP pada modal profil.
- Aturan agenda kini berasal dari satu fungsi kebijakan yang juga dipakai pembentuk Buku Penjagaan; ASN mendapat tiga agenda, PPPK Penuh Waktu hanya KGB, sedangkan PPPK Paruh Waktu dan Pensiun tidak mendapat agenda aktif.
- Header setelah login menampilkan foto pegawai dari Supabase Storage private. Relasi utama memakai NIP `app_access`; email Firebase terverifikasi hanya menjadi fallback foto untuk akun manajer yang belum tertaut NIP.
- URL foto ditandatangani di backend. `SUPABASE_SERVICE_ROLE_KEY` tetap tidak pernah dikirim ke browser.
- Inisial tetap tersedia sebagai fallback aman ketika data foto tidak ada, relasi akun belum benar, atau gambar gagal dimuat.

## Baseline yang dipertahankan dari V1.1.11

- Data Kendaraan dan Alat & Mesin selalu menampilkan lima card tetap: **Total**, **Kondisi Baik**, **Kurang Baik**, **Rusak Ringan**, dan **Rusak Berat**, termasuk ketika nilainya `0`.
- Setiap kondisi mempunyai tema warna yang berbeda; card dapat diklik sebagai filter.
- Data kondisi kosong dipisahkan ke banner kualitas data yang dapat diklik, sehingga tidak menjadi card kondisi dan tidak disamarkan sebagai BAIK.
- Judul card pada Data ASN/PPPK, Buku Penjagaan, Dashboard, Data Cleansing, dan ringkasan aset diperbesar serta dipertebal.
- Kondisi `NULL`/kosong tidak lagi ditampilkan atau tersimpan otomatis sebagai **BAIK**.
- Kondisi kosong ditampilkan konsisten sebagai **BELUM DIISI** pada banner audit, tabel, detail, peta, filter, print, dan CSV.
- Tambah Kendaraan/Alat & Mesin wajib memilih kondisi berdasarkan pemeriksaan fisik.
- Edit data legacy tetap dapat menyimpan field lain tanpa mengubah kondisi secara diam-diam.
- Data Cleansing menampilkan aset tanpa kondisi dan menyediakan tombol **Perbaiki** langsung ke formulir terkait.
- Backend membatasi kondisi ke `BAIK`, `RUSAK RINGAN`, `KURANG BAIK`, atau `RUSAK BERAT`.
- Seluruh keamanan, CRUD, sinkronisasi, minimap, favicon, dan layout mobile-first dari V1.1.10 dipertahankan.

## Urutan upgrade

1. Backup source, deployment Apps Script, dan database.
2. Import `SIKANDA_v1.1.12_SECURE_AI_STUDIO_FINAL.zip` ke Google AI Studio.
3. Ganti penuh backend dengan `apps-script/Code.gs`, lalu deploy sebagai **New version** pada deployment Web App yang sama.
4. Deploy frontend ke GitHub Pages.
5. Hard refresh browser dan jalankan UAT pada panduan.

V1.1.12 tidak membutuhkan SQL, Script Property, trigger, atau migrasi foto baru. Agar avatar tampil, pastikan `app_access.nip` sama dengan `pegawai.nip`, atau email akun manajer sama persis dengan `pegawai.email`, serta record pegawai memiliki `foto_storage_path`/`foto`.

## Verifikasi lokal

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
cp apps-script/Code.gs /tmp/sikanda-code.js
node --check /tmp/sikanda-code.js
```

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, atau kredensial backend di source frontend maupun ZIP.
