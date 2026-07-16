# SIKANDA V1.1.10 Secure — Release Notes

Tanggal rilis: 16 Juli 2026 (Asia/Jakarta).

## Integritas kondisi aset

- Menghapus fallback frontend yang sebelumnya mengubah kondisi kosong menjadi `BAIK` saat data dibaca.
- Menghapus fallback payload yang sebelumnya dapat menulis `BAIK` saat pengguna hanya memperbaiki field lain.
- Menampilkan nilai kosong sebagai `BELUM DIISI` pada Kendaraan, Alat & Mesin, relasi aset pegawai, detail, Peta Sebaran, laporan print, dan CSV.
- Card ringkasan serta filter memakai kunci kondisi yang sama, sehingga angka pada card identik dengan baris yang tampil.
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
- Hasil aktual menunjukkan 133 dari 139 Kendaraan dan 39 dari 40 Alat & Mesin belum memiliki kondisi. V1.1.10 mempertahankan fakta tersebut sampai diverifikasi manual.
- Nama kolom aktif adalah nama Indonesia seperti `no_polisi`, `nama_aset`, dan `pengguna`.

## Keamanan dan kompatibilitas

- RLS, model service-role-only, private storage, Firebase Authentication, backend RBAC, audit log, dan error sanitization dipertahankan.
- Tidak ada secret, dependency, SQL, property, trigger, atau migrasi baru.
- TypeScript, 12 suite regresi, build produksi, sintaks Apps Script, audit dependency, dan pemindaian secret lulus.
