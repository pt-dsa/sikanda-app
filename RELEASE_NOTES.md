# SIKANDA V1.1.6 Secure — Release Notes

## Konsistensi fakta dan tanggal

- Apps Script menyediakan `notification_feed` berbasis database aktif dan waktu Asia/Jakarta.
- Lonceng memakai feed backend tersebut; Tanya SIKANDA memakai builder fakta ulang tahun dan agenda yang sama sebelum Gemini dipanggil.
- Parser ulang tahun menerima ISO, Indonesia, Inggris, numerik, dan `DD-MM`/`DD/MM` tanpa tahun.
- Form Pegawai menerima serta menormalisasi tanggal menjadi teks Indonesia. Cleansing hanya menandai tanggal yang benar-benar tidak dapat dibaca, bukan ISO valid dari PostgreSQL.

## Akses dan profil

- Pegawai dapat membuka seluruh menu operasional kecuali Kelola Akun dan Data Cleansing.
- Mutasi profil Pegawai tetap dibatasi pada NIP miliknya dan field pengendali TMT/KGB/Pangkat/Pensiun tetap dilindungi backend.

## Aset, peta, dashboard, dan cetak

- Resolver media bersama menangani URL, path legacy, Google Drive, base64, dan blob tanpa broken preview pada Kendaraan, Alat & Mesin, serta detail aset.
- Peta memisahkan Kode Barang dari Nomor Polisi, menampilkan lokasi/koordinat, dan memperbaiki akses kontrol Basemaps mobile.
- Legenda Distribusi Golongan dirapatkan dan jarak section Komposisi SDM dikurangi.
- KOP cetak memakai layout tiga kolom seimbang: logo kiri, teks di area tengah, dan spacer kanan.

## Data cleansing dan validasi

- Pegawai tanpa aset tidak lagi diperlakukan sebagai masalah cleansing.
- Saran koreksi relasi aset tetap bersumber dari master Pegawai aktif dan kandidat ambigu tidak diubah otomatis.
- Ditambahkan test regresi V1.1.6 untuk feed notifikasi, tanggal Indonesia, RBAC, cleansing, peta, media, dan KOP.
