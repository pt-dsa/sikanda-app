# SIKANDA V1.1.5 Secure — Release Notes

Baseline: SIKANDA V1.1.4 Secure.

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
- Tanya SIKANDA kini memakai pegawai aktif sebagai sumber tunggal, membaca tanggal Indonesia/Inggris, membedakan ulang tahun hari ini, tujuh hari, dan bulan berjalan, serta menjawab jumlah PPPK dari query database saat itu.
- Semua item lonceng membuka profil pegawai tepat berdasarkan NIP; panel mobile memakai viewport dinamis agar tidak terpotong.
- Komposisi SDM dinaikkan sebelum kartu kelengkapan dan angka legenda golongan dirapatkan ke label.
- Pratinjau foto lama kendaraan/alat-mesin menangani path legacy dan broken image tanpa crash.
- Peta tidak lagi mengisi nomor polisi dari kode barang, menampilkan data aset lebih lengkap, dan menormalkan nama Pengguna/Penanggung Jawab ke Database Pegawai.
- Basemap peta mobile diubah dari hover menjadi tombol tap, ukuran Leaflet disinkronkan saat viewport berubah, dan layer kontrol ditempatkan di bawah sidebar.
- Checkbox serta bulk selection di tabel Kendaraan dan Alat & Mesin dihilangkan dari UI.
- Halaman Data ASN/PPPK mobile menggunakan scroll halaman normal sampai data terakhir.
- Data Cleansing hanya menyarankan nama baku dari Database Pegawai dan menolak kandidat ambigu.

## Kualitas dan keamanan

- Tidak ada SQL baru; skema V1.1.3/V1.1.4 digunakan kembali.
- Foto aset hanya dapat diunggah manager melalui backend tervalidasi.
- Nama relasi aset harus cocok dengan pegawai aktif.
- Service-role Supabase dan Gemini backend tetap hanya di Script Properties.
- TypeScript lint, seluruh test lama, test V1.1.5, dan production build lulus.
