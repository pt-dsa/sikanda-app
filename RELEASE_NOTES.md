# SIKANDA V1.1.12 Secure — Release Notes

Tanggal rilis: 17 Juli 2026 (Asia/Jakarta).

## Aturan agenda berdasarkan status

- Modal profil tidak lagi membuat tiga kartu agenda secara statis untuk setiap pegawai.
- Sumber tunggal `employmentAgendaPolicy()` menetapkan: ASN mendapat KGB/Pangkat/BUP; PPPK Penuh Waktu mendapat KGB; PPPK Paruh Waktu dan Pensiun tidak mendapat agenda aktif.
- PPPK Paruh Waktu menampilkan keterangan eksplisit “Tidak memiliki agenda Buku Penjagaan”, bukan tanggal agenda yang sebenarnya tidak berlaku.
- Mesin Buku Penjagaan, dashboard, laporan, notifikasi, dan Tanya SIKANDA tetap mengikuti kebijakan server yang sama.

## Foto pegawai setelah login

- `whoami` mengembalikan foto pegawai yang sudah di-hydrate menjadi signed URL dari bucket Supabase private.
- NIP pada `app_access` tetap menjadi identitas otorisasi dan tidak ditimpa oleh pencarian foto.
- Jika akun manajer belum mempunyai NIP pegawai, backend boleh mencari foto melalui email yang sama persis dengan email Firebase terverifikasi.
- Header memakai komponen avatar aman yang dapat memperbarui signed URL kedaluwarsa. Inisial hanya menjadi fallback jika foto tidak tersedia atau gagal dimuat.

## Verifikasi V1.1.12

- TypeScript `tsc --noEmit`: lulus.
- Empat belas suite regresi: lulus.
- Build Vite produksi: lulus.
- Sintaks Apps Script: valid.
- Audit dependency production: 0 kerentanan.

## Baseline V1.1.11 yang dipertahankan

## Card kondisi dan keterbacaan

- Data Kendaraan selalu menampilkan `Total Kendaraan`, `Kondisi Baik`, `Kurang Baik`, `Rusak Ringan`, dan `Rusak Berat` dalam urutan tetap.
- Alat & Mesin memakai lima indikator yang sama dengan label total `Total Alat & Mesin`.
- Card kondisi tidak menghilang ketika nilainya nol, sehingga pengguna dapat membaca distribusi yang utuh dan konsisten.
- Tema dibedakan: biru (total), hijau (baik), kuning (kurang baik), oranye (rusak ringan), dan merah (rusak berat).
- Kondisi kosong ditampilkan pada banner audit terpisah yang dapat diklik untuk memfilter record terkait.
- Judul card Data ASN/PPPK, Buku Penjagaan, Dashboard, Data Cleansing, dan ringkasan aset diperbesar dan dipertebal tanpa mengorbankan layout mobile-first.

## Integritas kondisi aset

- Menghapus fallback frontend yang sebelumnya mengubah kondisi kosong menjadi `BAIK` saat data dibaca.
- Menghapus fallback payload yang sebelumnya dapat menulis `BAIK` saat pengguna hanya memperbaiki field lain.
- Menampilkan nilai kosong sebagai `BELUM DIISI` pada Kendaraan, Alat & Mesin, relasi aset pegawai, detail, Peta Sebaran, laporan print, dan CSV.
- Card ringkasan serta filter memakai kunci kondisi yang sama, sehingga angka pada card identik dengan baris yang tampil. Banner `BELUM DIISI` juga menggunakan filter yang sama.
- Badge `KURANG BAIK` diperbaiki agar berwarna peringatan, bukan hijau.

## CRUD dan validasi

- Data baru wajib memilih satu dari empat kondisi resmi.
- Update data lama tanpa kondisi tetap dapat dilakukan; payload tidak menyertakan kondisi sampai pengguna benar-benar memilihnya.
- Backend memvalidasi kondisi secara independen untuk menolak manipulasi request dari browser.
- Alur create/update tetap menulis ke Supabase melalui Apps Script dengan token Firebase, RBAC, field allowlist, dan verifikasi baris hasil mutasi.

## Data Cleansing

- Audit baca-saja mendeteksi seluruh Kendaraan dan Alat & Mesin tanpa kondisi.
- Setiap temuan memiliki tautan langsung ke modal edit record yang tepat.
- Tidak ada auto-fix atau bulk-fix kondisi. Status harus ditentukan melalui pemeriksaan fisik.

## Capture Supabase

- Pesan “SQL snippet ... no longer exists” adalah status tab/query Supabase yang sudah tidak tersedia, bukan kerusakan database. Membuka query baru adalah tindakan yang benar.
- Hasil aktual menunjukkan 133 dari 139 Kendaraan dan 38 dari 40 Alat & Mesin belum memiliki kondisi. V1.1.11 mempertahankan fakta tersebut sampai diverifikasi manual.
- Nama kolom aktif adalah nama Indonesia seperti `no_polisi`, `nama_aset`, dan `pengguna`.

## Keamanan dan kompatibilitas

- RLS, model service-role-only, private storage, Firebase Authentication, backend RBAC, audit log, dan error sanitization dipertahankan.
- Capture grant menunjukkan tidak ada grant tabel langsung untuk `anon`/`authenticated` pada lima tabel inti. Seluruh grant berada pada `service_role`; karena role ini sangat berkuasa dan melewati RLS, key-nya wajib tetap eksklusif di Script Properties Apps Script.
- Tidak ada secret, dependency, SQL, property, trigger, atau migrasi baru.
- TypeScript, 13 suite regresi, build produksi, sintaks Apps Script, audit dependency, dan pemindaian secret lulus.
