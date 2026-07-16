# LAPORAN VERIFIKASI SIKANDA V1.1.8 SECURE

Tanggal pemeriksaan: 16 Juli 2026 (Asia/Jakarta)  
Baseline: V1.1.7 Secure  
Target: V1.1.8 Secure

## Kesimpulan

Source V1.1.8 lulus pemeriksaan TypeScript, sepuluh rangkaian pengujian otomatis, build produksi Vite, dan pemeriksaan sintaks backend Apps Script. Pemeriksaan otomatis membuktikan kontrak source dan jalur logika revisi; uji transaksi terhadap data produksi tetap harus dilakukan setelah frontend dan Apps Script V1.1.8 dideploy.

## Hasil pemeriksaan otomatis

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` / `tsc --noEmit` | Lulus, tanpa error TypeScript |
| `npm test` | Lulus, 10 dari 10 suite |
| `npm run build` | Lulus, 2.946 modul ditransformasi |
| `node --check < apps-script/Code.gs` | Lulus, tanpa error sintaks JavaScript |
| `npm audit --omit=dev --audit-level=high` | Lulus, 0 kerentanan ditemukan |

Suite yang lulus: agenda, backend rules, reporting, revision UI, V1.1.4, V1.1.5, V1.1.6, V1.1.6 final, V1.1.7, dan V1.1.8.

## Matriks audit CRUD

| Modul | Tambah | Baca/Edit | Update | Hapus/Nonaktif | Kontrol utama V1.1.8 |
|---|---:|---:|---:|---:|---|
| Data ASN/PPPK | Diaudit | Diaudit | Diperketat | Diperketat | Hasil mutasi wajib mengandung baris; RBAC dan field profil dipertahankan |
| Buku Penjagaan | Diaudit | Diaudit | Diaudit | Diaudit | Tidak ditemukan regresi pada kontrak mutasi |
| Data Kendaraan | Diperbaiki | Diperbaiki | Diperbaiki | Diperketat | ID legacy, koordinat opsional, fallback lokasi, minimap, hasil mutasi |
| Alat & Mesin | Diperbaiki | Diperbaiki | Diperbaiki | Diperketat | ID legacy, koordinat opsional, fallback lokasi, minimap, hasil mutasi |
| Inventaris | Belum aktif | Tampilan V2 | Belum aktif | Belum aktif | Tidak ada CRUD aktif pada baseline; tidak diubah menjadi CRUD semu |
| Pagu Anggaran | Belum aktif | Tampilan V2 | Belum aktif | Belum aktif | Tidak ada CRUD aktif pada baseline; tidak diubah menjadi CRUD semu |
| Pemeliharaan | Belum aktif | Tampilan V2 | Belum aktif | Belum aktif | Tidak ada CRUD aktif pada baseline; tidak diubah menjadi CRUD semu |
| Peminjaman | Belum aktif | Tampilan V2 | Belum aktif | Belum aktif | Tidak ada CRUD aktif pada baseline; tidak diubah menjadi CRUD semu |
| Data Cleansing | Tidak berlaku | Diperbaiki | Diperketat | Tidak berlaku | Deep-link NIP dan update holder wajib menemukan baris aset |
| Kelola Akun | Diperketat | Diaudit | Diperketat | Diperketat | Patch akun yang ada, validasi tautan pegawai, hasil mutasi |
| Konfigurasi Sistem | Tidak berlaku | Diaudit | Diperketat | Tidak berlaku | Upsert wajib menghasilkan baris |

## Skenario revisi yang dicakup

1. Label pengguna **Perlu Verifikasi** dan tidak ada label `FUZZY` pada UI.
2. Badge pegawai membuka `/cleansing?nip=...` untuk Administrator/Pimpinan.
3. Data Cleansing memfilter dan menggulir ke item verifikasi yang sesuai.
4. Kedua koordinat kosong dianggap valid dan tidak memblokir Simpan.
5. Hanya satu koordinat atau nilai di luar rentang ditolak.
6. Alias koordinat legacy dan `asset_locations` dibaca saat edit.
7. Koordinat valid membentuk minimap.
8. `asset_id` maupun `id` legacy dikenali sebagai record update.
9. Backend menolak status sukses palsu saat Supabase tidak mengembalikan baris.
10. Toast identik tidak menumpuk.
11. Subtitle PPPK Penuh Waktu dan favicon tervalidasi pada source/build.

## Uji penerimaan produksi yang tetap wajib

Setelah deployment, lakukan uji dengan akun Administrator/Pimpinan pada salinan data aman atau record yang memang perlu diperbaiki:

- Terapkan satu item **Perlu Verifikasi**, lalu konfirmasi badge hilang setelah sinkronisasi.
- Edit kendaraan yang memiliki koordinat; pastikan field dan minimap muncul serta koordinat tetap tersimpan.
- Edit/tambah kendaraan tanpa koordinat; pastikan Simpan berhasil.
- Edit/tambah alat & mesin tanpa koordinat; pastikan Simpan berhasil.
- Uji satu CRUD representatif untuk Pegawai, Buku Penjagaan, dan Akun sesuai RBAC. Inventaris, Pagu, Pemeliharaan, serta Peminjaman tetap merupakan menu pengembangan V2 pada baseline dan belum menyediakan CRUD aktif untuk diuji.
- Buka deployment pada tab baru dan lakukan hard refresh untuk memeriksa favicon.

Langkah rinci, rollback, dan troubleshooting tersedia di `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.8_SECURE.md`.
