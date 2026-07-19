# Deploy Backend SIKANDA V1.1.14

1. Jalankan berurutan `supabase/006_sikanda_v1_1_14_production_hardening.sql` lalu `supabase/007_sikanda_v1_1_14_kib_b_import_gallery.sql` setelah backup.
2. Ganti seluruh `Code.gs` aktif dengan file pada folder ini.
3. Set `ENABLE_BOOTSTRAP_ADMIN=false`, `AI_GENERATIVE_ENABLED=false`, `SUPABASE_PHOTO_BUCKET=pegawai-photos`, `SUPABASE_ASSET_PHOTO_BUCKET=asset-photos`, dan `SUPABASE_ASSET_ATTACHMENT_BUCKET=asset-attachments`.
4. Deploy **New version** pada deployment Web App yang sama.
5. Pastikan `/exec` menampilkan `1.1.14-production`.
6. Jalankan `migrasiSemuaFotoAsetKeSupabase` dari editor Apps Script.

Daftar properti lengkap dan UAT ada di panduan utama pada root paket.
