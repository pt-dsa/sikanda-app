# Verification Report — SIKANDA V1.1.6 Secure

Tanggal verifikasi lokal: 14 Juli 2026 (Asia/Jakarta).

## Hasil otomatis

| Pemeriksaan | Hasil |
|---|---|
| TypeScript `npm run lint` | Lulus |
| Test agenda kepegawaian | Lulus |
| Test backend/RBAC/database-first | Lulus |
| Test laporan dan filter | Lulus |
| Test regresi V1.1.4 dan V1.1.5 | Lulus |
| Test regresi baru V1.1.6 | Lulus |
| Test regresi final RBAC/form/media/peta/cleansing/KOP | Lulus |
| Production build Vite | Lulus |
| Modul yang ditransformasi pada build final | 2.945 |
| Render visual acuan dan kandidat KOP | Lulus - logo/judul satu kelompok, garis ganda utuh |
| Audit dependensi production (`npm audit --omit=dev --audit-level=high`) | Lulus - 0 kerentanan |
| Pemeriksaan sintaks backend Apps Script | Lulus |

## Validasi logika yang tercakup

- Ulang tahun format Indonesia, Inggris, ISO, dan numerik diparse secara konsisten.
- Tanggal ISO valid tidak memicu isu Data Cleansing.
- Pegawai tanpa relasi aset tidak dihitung sebagai masalah cleansing.
- Backend memiliki feed fakta tunggal untuk lonceng dan helper yang sama bagi Tanya SIKANDA.
- Pegawai membaca seluruh data pegawai/aset, melihat menu operasional selain Rekap Laporan, dan tetap diblokir dari Kelola Akun/Data Cleansing.
- Aksi CRUD aset Pegawai disembunyikan di desktop/mobile dan tetap ditolak backend.
- Profil sendiri dapat mengubah field personal; seluruh field struktural yang ditentukan tetap terkunci.
- Tanggal mempunyai kalender, suggestion format, validasi langsung, serta normalisasi Indonesia.
- Library suggestion kampus/jurusan dan opsi tambah manual tervalidasi.
- Peta memisahkan field Kode Barang dan Nomor Polisi serta menolak kode yang sama dengan nomor polisi.
- KOP menggunakan aset teks SVG berdasarkan PDF acuan dan mengelompokkan logo/teks dalam grid cetak tetap; tabel tetap fixed-layout.
- Resolver foto mendukung Drive/AppSheet/URL/data/blob, fallback bertahap, dan pemulihan hak baca privat untuk akun aktif.
- Cleansing mengirim identifier tabel aset yang sama dengan backend.
- Peta memenuhi area halaman dan menghindari pembuatan ulang ikon untuk setiap marker.
- Nomor `08...` dikonversi ke `628...` pada read, form, backend, dan migrasi data eksisting.
- Ikon WhatsApp hanya tampil untuk Administrator/Pimpinan dan nonaktif bila nomor tidak valid.
- Capture area layar hanya tampil untuk Administrator, memakai izin browser, dan mendukung salin/bagikan/simpan PNG secara lokal.
- KPI inventaris Dashboard memakai relasi aset yang sama dengan Data ASN/PPPK; jumlah dengan + tanpa inventaris sama dengan total pegawai.
- Grafik Distribusi Golongan memakai donut 210 px dengan radius 82 dan layout legend adaptif.

## Batas validasi lokal

Build lokal tidak dapat memverifikasi data hidup Supabase, autentikasi Firebase, deployment Apps Script, email/WhatsApp aktual, dialog izin capture browser, GPS/kamera perangkat, izin Drive lama, tile basemap eksternal, maupun hasil raster dialog print browser. Semua pemeriksaan tersebut wajib dilakukan sesuai checklist pada `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.6_SECURE.md` setelah deploy.
