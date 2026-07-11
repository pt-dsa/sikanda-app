# SIKANDA V1.1.2 Secure — Release Notes

Baseline: `SIKANDA_v1.1.1_SECURE_AI_STUDIO_FINAL_REV1_2026-07-11.zip`.

## Perubahan V1.1.2

- Form Tambah/Edit Kendaraan diperluas dan Nomor Polisi tidak lagi menimpa Kode Barang.
- Backend kendaraan mendukung field lokasi, penanggung jawab, dokumen, teknis, koordinat, harga, dan foto.
- Tambah Akun memakai autocomplete Database Pegawai; Nama, NIP, dan Email terisi otomatis.
- Backend memverifikasi ulang akun baru ke tabel pegawai dan menolak duplikasi NIP/email.
- Deskripsi kewenangan Pimpinan dan Pegawai diselaraskan dengan RBAC resmi.
- Tanya SIKANDA memakai database-first untuk agenda/jumlah, fallback model stabil, retry, dan fungsi pemeriksaan konfigurasi.
- Pesan pembuka dan kendala Tanya SIKANDA dibuat lebih humanis serta tidak menggandakan detail teknis.
- Rekap Laporan memperoleh filter per kategori, CSV berdasarkan filter, nama file informatif, serta halaman cetak bertabel.
- Halaman login menampilkan petunjuk pemilihan email; panduan branding OAuth ditambahkan.
- Card Komposisi SDM dibuat ringkas, seimbang, dan responsif.
- Ditambahkan `reporting-tests` dan migrasi Supabase V1.1.2.

## Keamanan

- Service-role key Supabase dan Gemini API key tetap hanya berada di Apps Script Properties.
- `GEMINI_API_KEY` bawaan AI Studio boleh tetap ada tetapi tidak pernah dibaca frontend.
- Akun baru tidak mempercayai email/NIP dari browser.
- Endpoint mutasi generik tetap dinonaktifkan.
- CSV/cetak melakukan escaping dan hanya tersedia pada route manager.
- Administrator dan Pimpinan tetap setara; Pegawai tetap dibatasi pada data sendiri.
