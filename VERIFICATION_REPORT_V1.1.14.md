# Verification Report — SIKANDA V1.1.14 Production Hardening

Tanggal verifikasi: 19 Juli 2026 (Asia/Jakarta)

## Pemeriksaan otomatis

- `npm run lint`: **LULUS** — TypeScript tanpa error.
- `npm run test`: **LULUS** — seluruh regression test V1.1.14 dan test KIB B.
- `npm run build`: **LULUS** — bundle production dan `404.html` berhasil dibuat.
- `npm audit --omit=dev --audit-level=high`: **LULUS** — 0 vulnerability.
- Pemeriksaan sintaks `apps-script/Code.gs`: **LULUS**.

## Uji CSV acuan KIB B 2025

Parser produksi diuji langsung terhadap `Inventarisasi KIB B Pertahun sd 2025 (1).xlsx - 2025.csv`:

- baris sumber: **1.477**;
- total unit sebelum agregasi: **1.477**;
- kelompok aset setelah agregasi: **223**;
- baris identik tanpa INDEX yang digabung: **1.254**;
- baris invalid: **0**;
- total unit setelah agregasi: **1.477**.

Dengan demikian agregasi tidak mengurangi jumlah fisik. Baris yang mempunyai INDEX tetap dipertahankan sebagai unit tersendiri; baris identik tanpa INDEX menjadi satu kelompok dengan `jumlah` yang sesuai.

## Kontrol yang diverifikasi

- Header CSV baku, BOM, spasi, delimiter, quoted multiline, dan rupiah Indonesia ditangani parser.
- Kode Barang dinormalisasi dengan/tanpa titik untuk peringatan kesamaan klasifikasi.
- Duplikat pasti ditentukan dari INDEX atau fingerprint; Kode Barang saja tidak memblokir import.
- INDEX ganda, kondisi tidak dikenal, tahun/harga invalid, dan header berubah memblokir import sebelum penyimpanan.
- Kolom lama, koordinat, foto utama, QR, metadata, dan audit tetap dipertahankan.
- Lampiran disimpan di bucket private terpisah dan dibuka melalui URL sementara.

Catatan: kelulusan teknis ini tidak menggantikan UAT pada project Supabase, Apps Script, Firebase, dan akun produksi milik instansi. Ikuti panduan implementasi serta rollback yang disertakan.
