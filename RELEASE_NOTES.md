# SIKANDA V1.1.3 Secure - Release Notes

Baseline: SIKANDA V1.1.2 Secure.

## Perubahan

- Edit Profile aktif dan terikat pada NIP akun login; RBAC backend tetap menjadi sumber kebenaran.
- Dashboard membedakan PPPK Penuh Waktu dan Paruh Waktu serta memakai card yang lebih proporsional.
- PPPK lama tanpa kategori dinormalisasi sebagai Penuh Waktu.
- Form Pegawai memakai dropdown masa kerja dan tingkat pendidikan.
- Bidang memakai data eksisting Buku Penjagaan, menerima nilai baru, dan memiliki filter.
- Label serta filter status Data ASN/PPPK dan Buku Penjagaan diperbarui.
- Tambah Akun menampilkan Status Pegawai.
- Cetak Halaman memakai kop resmi dengan logo, garis ganda, dan layout A4 landscape.
- CRUD Alat & Mesin diperluas sesuai kolom database dan tidak membuat ID lokal semu.
- Migrasi idempoten `003_sikanda_v1_1_3_revision.sql` ditambahkan.

## Keamanan dan kualitas

- Service-role Supabase dan Gemini backend tetap hanya berada di Apps Script Properties.
- Semua mutasi profil/aset diverifikasi Apps Script dan dicatat pada audit log.
- RLS dan pencabutan akses browser dipertahankan.
- TypeScript, pengujian agenda/backend/laporan, production build, dan npm audit produksi lulus.
