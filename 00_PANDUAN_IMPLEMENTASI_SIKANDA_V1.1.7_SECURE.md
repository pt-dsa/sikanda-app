# Panduan Implementasi SIKANDA V1.1.7 Secure

## Urutan aman

1. Backup database Supabase, Apps Script, frontend V1.1.6, serta folder `SIKANDA_Foto_Pegawai`.
2. Jalankan `supabase/005_sikanda_v1_1_7_storage_and_notifications.sql`.
3. Pastikan bucket `pegawai-photos` terbentuk dengan `public=false`.
4. Deploy Apps Script V1.1.7 sebagai New version.
5. Tambahkan Script Properties `SUPABASE_PHOTO_BUCKET` dan `PHOTO_SIGNED_URL_SECONDS`.
6. Jalankan `pasangTriggerSikandaV117()` satu kali.
7. Jalankan health-check manual, lalu migrasi foto.
8. Deploy frontend V1.1.7 dan lakukan hard refresh/service-worker refresh bila diperlukan.

## Trigger final

- Health-check: setiap 3 hari sekitar pukul 05.00 WIB.
- Notifikasi: setiap Senin sekitar pukul 07.00 WIB.
- Email hanya untuk agenda pada rentang hari ini sampai satu bulan kalender ke depan.
- Satu agenda dapat dikirim paling banyak satu kali per minggu.

Apps Script menjadwalkan trigger secara approximate; keterlambatan beberapa menit adalah perilaku normal platform.

## Migrasi foto

`migrasiSemuaFotoPegawaiKeSupabase()` memproses maksimal 10 record setiap eksekusi. Record sukses mendapat `foto_storage_path`, provider `supabase`, status `ready`, dan waktu migrasi. URL Drive asli tidak dihapus. Record tanpa URL Drive sah mendapat status `skipped`; kegagalan mendapat status `failed` untuk ditinjau.

Verifikasi SQL:

```sql
select foto_provider, foto_migration_status, count(*)
from public.pegawai
group by 1, 2
order by 1, 2;
```

Jangan menghapus file Drive sampai seluruh perangkat/role lolos uji dan backup diverifikasi.

## Checklist live wajib

- Login Administrator, Pimpinan, dan Pegawai pada desktop serta mobile.
- Pastikan foto yang sama tampil pada tabel, kartu mobile, detail, dan form edit.
- Ubah foto dari kamera dan galeri; pastikan path berubah dan foto lama tidak ter-cache.
- Simulasikan signed URL kedaluwarsa; avatar harus meminta URL baru.
- Pastikan Pegawai tidak melihat dan tidak dapat menjalankan ekspor CSV.
- Pastikan Dashboard memuat melalui satu `dashboard_snapshot` dan tidak timeout.
- Bandingkan Tanya SIKANDA dengan lonceng untuk ulang tahun, KGB, pangkat, BUP, dan agenda terlewat.
- Uji notifikasi pada data staging dengan tenggat 1–31 hari dan pastikan dedupe mingguan.
- Cetak seluruh variasi laporan dan periksa KOP serta page break.
- Periksa Peta, foto aset, cleansing, WhatsApp, capture layar, dan scroll mobile.

## Rollback

Frontend dapat dikembalikan ke ZIP V1.1.6 dan deployment Apps Script sebelumnya. Kolom/bucket V1.1.7 tidak perlu dihapus saat rollback. Foto Drive lama tetap tersedia karena migrasi tidak menghapus sumber.
