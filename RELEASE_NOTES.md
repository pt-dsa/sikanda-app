# SIKANDA V1.1.8 Secure — Release Notes

Tanggal rilis: 16 Juli 2026 (Asia/Jakarta).

## Verifikasi kecocokan pegawai–aset

- Istilah teknis `FUZZY` tidak lagi ditampilkan kepada pengguna dan diganti menjadi **Perlu Verifikasi**.
- Administrator/Pimpinan dapat mengklik badge pada kartu, tabel, atau detail pegawai.
- Klik tersebut membuka Data Cleansing dengan filter NIP dan menggulir langsung ke item pegawai–aset yang sesuai.
- Status internal `match_quality = fuzzy` dipertahankan sebagai kontrak data sehingga tidak memerlukan migrasi database.

## CRUD dan koordinat aset

- Kendaraan serta Alat & Mesin mengenali `asset_id` dan ID legacy agar edit tidak salah diproses sebagai create.
- Form edit memuat koordinat dari kolom aktif atau fallback `asset_locations`.
- Koordinat valid langsung membentuk minimap OpenStreetMap.
- Latitude dan longitude kini benar-benar opsional: keduanya boleh kosong pada create maupun update.
- Input parsial atau di luar rentang tetap ditolak; format koma desimal dinormalisasi.
- Payload kosong tidak menghapus koordinat lama secara tidak sengaja.
- Backend dapat menyinkronkan koordinat ke `asset_locations` bila tabel aset tidak memiliki kolom koordinat.
- Toast identik dideduplikasi agar error tidak menumpuk ketika tombol Simpan ditekan berulang.

## Ketahanan mutasi backend

- Create/update/delete pegawai, kendaraan, alat & mesin, akun, konfigurasi, serta foto memeriksa baris hasil Supabase.
- Respons kosong tidak lagi dilaporkan sebagai sukses.
- Update akun menggunakan patch terhadap akun yang benar-benar ada.
- Validasi field wajib dan koordinat diterapkan kembali di backend tanpa menghalangi update parsial Data Cleansing.

## Antarmuka

- Subtitle Card PPPK (Penuh Waktu) menjadi **Pegawai Pemerintah Penuh Waktu**.
- Logo Kota Tangerang Selatan dipasang sebagai favicon dan Apple Touch Icon.
- Peta Sebaran menggunakan normalisasi koordinat yang sama dengan form aset.

## Kompatibilitas dan deployment

- Arsitektur keamanan, RBAC, private Storage foto pegawai, trigger, dan migrasi V1.1.7 tetap dipertahankan.
- Tidak ada SQL, Script Property, trigger, atau migrasi foto baru.
- Frontend dan `apps-script/Code.gs` harus sama-sama diperbarui agar revisi bekerja lengkap.
