# Deploy Backend Apps Script SIKANDA V1.1.7 Secure

1. Backup database, deployment Apps Script, dan folder Drive foto pegawai.
2. Jalankan `supabase/005_sikanda_v1_1_7_storage_and_notifications.sql` setelah migrasi sebelumnya.
3. Ganti seluruh `Code.gs`, Save, lalu Deploy → Manage deployments → Edit → **New version** → Deploy.
4. Pastikan Script Properties lama tetap tersedia dan tambahkan:
   - `SUPABASE_PHOTO_BUCKET=pegawai-photos`
   - `PHOTO_SIGNED_URL_SECONDS=3600`
5. Jalankan `pasangTriggerSikandaV117()` satu kali dan setujui scope trigger/email bila diminta.
6. Jalankan `healthCheckSupabaseTerjadwal()` manual satu kali; periksa Execution Log.
7. Jalankan `migrasiSemuaFotoPegawaiKeSupabase()` satu kali. Fungsi continuation memproses batch berikutnya otomatis.
8. Buka URL `/exec`; versi sehat adalah `1.1.7-secure`.
9. Bila URL deployment berubah, perbarui `VITE_APPS_SCRIPT_URL` lalu deploy frontend V1.1.7.

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, atau secret Firebase di frontend.
