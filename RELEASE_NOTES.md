# SIKANDA V1.1.4 Secure — Release Notes

Baseline: SIKANDA V1.1.3 Secure.

## Perubahan utama

- Dashboard memiliki sinkronisasi data nyata, validasi pegawai aktif, judul tebal, istilah Terlewat, dan Komposisi SDM yang proporsional.
- Pengguna/Penanggung Jawab kendaraan serta alat-mesin memakai autocomplete Database Pegawai dan divalidasi ulang backend.
- GPS otomatis, kamera, galeri, preview, validasi 5 MB, dan upload Google Drive ditambahkan untuk kendaraan serta alat-mesin.
- Popup sukses/gagal diterapkan konsisten pada CRUD aktif.
- Tambah Akun menampilkan Jabatan Pegawai.
- Lonceng menghitung item panel secara akurat dan menambahkan ulang tahun hari ini–7 hari.
- Rekap Laporan menambahkan Alat & Mesin dan dropdown kategori cetak.
- KOP dan tabel print diperbaiki untuk A4 landscape.
- Tanya SIKANDA database-first diperluas dan persona dibuat lebih humanis.

## Kualitas dan keamanan

- Tidak ada SQL baru; skema V1.1.3 digunakan kembali.
- Foto aset hanya dapat diunggah manager melalui backend tervalidasi.
- Nama relasi aset harus cocok dengan pegawai aktif.
- Service-role Supabase dan Gemini backend tetap hanya di Script Properties.
- TypeScript lint, seluruh test lama, test V1.1.4, dan production build lulus.
