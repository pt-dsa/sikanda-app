# SIKANDA V1.1.6 Secure — Release Notes

## Revisi final lanjutan - 14 Juli 2026

- Peta menolak `asset_code` yang identik dengan nomor polisi. Kode alternatif yang valid dipilih bila tersedia; jika tidak, popup menampilkan `Belum diisi` agar data salah tidak disamarkan sebagai kode barang.
- KOP disusun ulang dari acuan `KOP_SIKANDA.pdf`: logo dan teks resmi kini satu kelompok visual tetap. Teks KOP memakai aset SVG terukur sehingga posisi tidak berubah karena skala browser atau jumlah kolom laporan.
- Nomor kontak dinormalisasi menjadi `628...` pada pembacaan data, form tambah/edit, dan backend. Migrasi `supabase/004_sikanda_v1_1_6_contact_normalization.sql` disediakan untuk data `08...` yang sudah tersimpan.
- Card `Aset Fuzzy Match` diganti menjadi `Perlu Penyelarasan`; seluruh judul card ringkasan Data ASN/PPPK dibuat tebal.
- Administrator dan Pimpinan mendapat ikon WhatsApp per pegawai. Nomor tidak valid menghasilkan tombol nonaktif dan tidak pernah diarahkan ke pegawai yang salah.
- Administrator mendapat Capture Layar lokal: pilih tab, seleksi area, salin, bagikan, atau simpan PNG tanpa upload otomatis ke server.
- Dashboard menambah KPI `Pegawai Dengan Inventaris` dan `Pegawai Tanpa Inventaris` (inventaris = kendaraan + alat/mesin), mengisi ruang kosong pada section kelengkapan, dan memperbesar grafik Distribusi Golongan agar proporsional.

## Konsistensi fakta dan tanggal

- Apps Script menyediakan `notification_feed` berbasis database aktif dan waktu Asia/Jakarta.
- Lonceng memakai feed backend tersebut; Tanya SIKANDA memakai builder fakta ulang tahun dan agenda yang sama sebelum Gemini dipanggil.
- Parser ulang tahun menerima ISO, Indonesia, Inggris, numerik, dan `DD-MM`/`DD/MM` tanpa tahun.
- Form Pegawai menerima serta menormalisasi tanggal menjadi teks Indonesia. Cleansing hanya menandai tanggal yang benar-benar tidak dapat dibaca, bukan ISO valid dari PostgreSQL.

## Akses dan profil

- Pegawai membaca seluruh data pegawai dan aset operasional yang sama dengan Administrator.
- Menu Pegawai memuat seluruh modul operasional kecuali Rekap Laporan; Kelola Akun dan Data Cleansing tetap khusus Administrator/Pimpinan.
- Tombol CRUD aset disembunyikan dari Pegawai dan endpoint backend tetap menolak mutasi aset/config.
- Pegawai dapat memperbarui Nama, Tanggal Lahir, Foto, Pendidikan, Diklat, Kontak, Email, dan Keterangan pada profil sendiri.
- NIP, Status, Jabatan, Bidang, Masa Kerja, Golongan, TMT Golongan/Jabatan, serta Catatan Mutasi tetap terkunci di UI dan backend.

## Form Data ASN/PPPK

- Input tanggal mempunyai kalender native, contoh format, normalisasi Indonesia, dan status valid/invalid langsung.
- Golongan, Jabatan, Jurusan, Universitas/Sekolah, dan Tahun Lulus memakai suggestion yang tetap menerima nilai baru.
- Ditambahkan library lokal institusi dan jurusan Indonesia dengan referensi direktori resmi pendidikan; nilai database eksisting otomatis digabungkan.

## Aset, peta, dashboard, dan cetak

- Resolver media bersama menangani URL, path legacy AppSheet (`Alat & Mesin` dan `AlatMesin`), Google Drive, base64, dan blob serta mencoba URL fallback sebelum menampilkan status gagal.
- Foto Drive tetap privat, tetapi akses baca diberikan kepada seluruh akun SIKANDA aktif. File lama dipulihkan izinnya secara on-demand saat dibaca Pegawai.
- Peta memakai lebar/tinggi penuh tanpa batas `max-width`, `ResizeObserver` untuk mengisi container, ikon marker ter-cache, tile idle-update, dan Radar nonaktif secara default untuk mengurangi beban.
- Grafik Distribusi Golongan diperbesar dan legendanya menyesuaikan ukuran card.
- KOP cetak memakai logo dan teks resmi sebagai satu kelompok berdasarkan dokumen acuan, bukan posisi absolut terpisah.

## Data cleansing dan validasi

- Pegawai tanpa aset tidak lagi diperlakukan sebagai masalah cleansing.
- Saran koreksi relasi aset tetap bersumber dari master Pegawai aktif dan kandidat ambigu tidak diubah otomatis.
- Bug tombol Terapkan pada kecocokan nama aset diperbaiki: frontend dan backend kini memakai nama tabel `assets_vehicle`/`assets_equipment` yang sama.
- Ditambahkan test regresi V1.1.6 untuk feed notifikasi, tanggal Indonesia, RBAC, cleansing, peta, media, dan KOP.
