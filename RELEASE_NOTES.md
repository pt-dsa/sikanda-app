# SIKANDA V1.1.13 Secure — Release Notes

Tanggal rilis: 17 Juli 2026 (Asia/Jakarta)

## Perbaikan utama

- Menyatukan sumber status “Perlu Verifikasi” dengan hasil Data Cleansing sehingga tautan NIP tidak lagi membuka daftar kosong.
- Mengganti loading berulang dengan persentase berdasarkan tahap permintaan data yang benar-benar selesai.
- Menghapus frasa teknis pada keterangan agenda PPPK Paruh Waktu.
- Mempercepat Dashboard melalui satu snapshot, penundaan proses foto, cache metrik/sesi, dan deduplikasi permintaan.
- Memperbaiki Tanya SIKANDA untuk pertanyaan agenda terlambat, kesetaraan dengan lonceng notifikasi, konteks percakapan, retry jaringan, dan pesan gagal yang relevan.
- Membersihkan istilah teknis internal dari tampilan pengguna di profil, form, Data Cleansing, Dashboard, Kelola Akun, dan pesan kesalahan.

## Keamanan

Firebase token verification, app_access, backend RBAC, field allowlist, RLS, Supabase private Storage, audit log, sanitasi error, dan model service-role-only dipertahankan. Tidak ada migrasi SQL atau secret baru.

## Quality gate

- TypeScript: lulus.
- 15 suite regresi: lulus.
- Build produksi: lulus.
- Backend health: `1.1.13-secure`.

UAT pada deployment nyata tetap wajib sebelum promosi production.

