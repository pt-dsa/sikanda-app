# SIKANDA V1.1.7 Secure — Release Notes

Tanggal rilis: 15 Juli 2026 (Asia/Jakarta).

## Foto Pegawai dan Supabase Storage

- Foto pegawai baru disimpan ke bucket private `pegawai-photos`.
- Browser menerima signed URL sementara; service-role tetap hanya di Apps Script.
- Signed URL dibuat secara batch dan di-cache agar daftar pegawai tidak menghasilkan puluhan request berurutan.
- Avatar memperbarui signed URL satu kali ketika URL kedaluwarsa sebelum memakai fallback inisial.
- Foto diperkecil maksimal 960 px dan dioptimalkan ke WebP bila hasilnya lebih kecil.
- Migrasi Drive berjalan per batch, idempoten, menyimpan status gagal/skipped, dan mempertahankan URL Drive lama sebagai fallback.
- Operasi penambahan viewer Drive dihapus dari jalur baca data.

## Stabilitas dan Dashboard

- Dashboard memakai satu endpoint `dashboard_snapshot`, bukan beberapa cold-start Apps Script.
- Request baca tertentu mempunyai satu retry terbatas dan request ID untuk penelusuran error.
- Timeout dibedakan antara request baca dan mutasi; pesan error menyertakan ID aman.
- Simpan data dan upload foto menjadi tahap terpisah. Kegagalan foto tidak lagi menyatakan bahwa record pegawai gagal dibuat.
- Tanggal disimpan ke database dalam ISO `YYYY-MM-DD`, tetapi tetap ditampilkan dalam format Indonesia.

## Notifikasi dan Trigger

- `healthCheckSupabaseTerjadwal` berjalan setiap 3 hari dan mencatat sukses/gagal di Script Properties.
- Setelah dua kegagalan berurutan, Administrator/Pimpinan mendapat peringatan maksimal sekali per hari.
- Notifikasi Buku Penjagaan dijadwalkan mingguan setiap Senin.
- Email pegawai mulai dikirim ketika agenda masuk jendela 1 bulan sebelum tenggat dan dapat dikirim ulang satu kali setiap minggu sampai tenggat.
- Deduplikasi memakai kombinasi NIP, jenis agenda, tanggal tenggat, dan minggu pengiriman.

## Tanya SIKANDA

- Prompt akses diselaraskan dengan RBAC final: seluruh role membaca data operasional, hak mutasi tetap berbeda.
- Pertanyaan faktual yang belum dikenali tidak diserahkan kepada Gemini untuk dihitung; sistem meminta objek/rentang yang lebih jelas.
- Pertanyaan notifikasi/lonceng dijawab dari feed database yang sama.
- Temperature narasi diturunkan; setiap jawaban membawa timestamp snapshot WIB untuk audit internal.

## RBAC dan CSV

- Ditambahkan action `data.export` hanya untuk Administrator dan Pimpinan.
- Tombol dan fungsi CSV Data ASN/PPPK serta Buku Penjagaan sama-sama memiliki guard role.
- Pegawai tetap tidak dapat membuka Rekap Laporan.
- Seluruh pembatasan CRUD profil/aset V1.1.6 dipertahankan.

## Kompatibilitas

- Seluruh perbaikan V1.1.6 untuk KOP, peta, cleansing, WhatsApp, capture layar, format kontak, dashboard, mobile UI, dan aset dipertahankan.
- Google Drive masih dibaca sebagai fallback selama migrasi; upload pegawai baru tidak lagi memakai Drive.
