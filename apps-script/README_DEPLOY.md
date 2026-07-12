# Deploy Backend Apps Script SIKANDA V1.1.5

1. Backup database dan deployment Apps Script V1.1.4.
2. Tidak ada SQL baru untuk upgrade V1.1.4 → V1.1.5.
3. Ganti seluruh `Code.gs` dengan `apps-script/Code.gs` V1.1.5 dan Save.
4. Pastikan Script Properties Supabase, Firebase, Gemini, bootstrap admin, dan Drive folder tetap lengkap.
5. Opsional: Run `ujiKonfigurasiTanyaSikanda` satu kali. Jangan Run fungsi pengiriman notifikasi untuk pengujian.
6. Deploy → Manage deployments → Edit → New version → Deploy.
7. Setujui scope Google Drive bila diminta.
8. Buka URL `/exec`; versi sehat adalah `1.1.5-secure`.
9. Bila URL berubah, perbarui `VITE_APPS_SCRIPT_URL` pada AI Studio dan GitHub.
10. Import/replace frontend V1.1.5, klik Apply changes dan Publish; push source yang sama ke GitHub.

Panduan lengkap: `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.5_SECURE.md`.
