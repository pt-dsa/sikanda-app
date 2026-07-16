# LAPORAN VERIFIKASI SIKANDA V1.1.9 SECURE

Tanggal: 16 Juli 2026 (Asia/Jakarta)  
Baseline: V1.1.8 Secure  
Target: V1.1.9 Secure

## Kesimpulan

Source V1.1.9 lulus type-check, sebelas suite pengujian, build produksi, audit dependency, pemeriksaan sintaks Apps Script, dan pemindaian secret source. Statusnya **production candidate**; uji transaksi dan responsivitas pada environment live tetap wajib sebelum dinyatakan production-ready.

## Hasil otomatis

| Pemeriksaan | Hasil |
|---|---|
| `tsc --noEmit` | Lulus |
| `npm test` | Lulus, 11/11 suite |
| `vite build` | Lulus, 2.947 modul |
| `node --check < apps-script/Code.gs` | Lulus |
| `npm audit --omit=dev --audit-level=high` | Lulus, 0 kerentanan |
| Pemindaian secret source | Tidak menemukan nilai secret; hanya nama environment/Script Property |

## Cakupan regresi V1.1.9

- normalisasi placeholder dan angka aset;
- payload field-by-field Alat & Mesin/Kendaraan;
- koordinat tidak berubah tidak ditulis ulang;
- metadata `type` lokasi tidak disentuh saat update;
- error database aman;
- tombol Sinkronisasi pada tiga menu;
- format `| Pukul`;
- chart Masa Kerja fill-height;
- card akun mobile, topbar reflow, modal aset/pegawai/detail/konfirmasi/laporan dengan viewport dinamis, safe area, target sentuh, popup peta, dan anti-overflow;
- jalur create frontend → Apps Script → POST Supabase;
- versi backend `1.1.9-secure`.

## Audit keamanan source

- Firebase ID token wajib pada request.
- Email token diverifikasi melalui Firebase Identity Toolkit.
- Role dibaca ulang dari `app_access`.
- Mutasi aset/akun/config manager-only di backend.
- Pegawai hanya dapat mengubah profil sendiri pada field yang diizinkan.
- Generic Supabase mutation endpoint tetap dinonaktifkan.
- Service-role/Gemini key tetap di Apps Script Properties.
- RLS/revoke anon-authenticated tetap dipertahankan oleh migrasi keamanan.
- Upload foto memiliki validasi MIME/ukuran dan storage private untuk foto pegawai.
- Request ID, timeout, retry baca terbatas, audit log, dan rate limit AI tetap tersedia.

## Hal yang memerlukan validasi live

- Skema/constraint Supabase aktual tidak dapat diuji tanpa akses environment produksi.
- Apps Script deployment aktif harus dipastikan benar-benar V1.1.9.
- Uji role, create/update/delete, foto, koordinat, dan cache dilakukan pada data aman.
- Responsivitas harus diperiksa pada perangkat/browser organisasi.
- Supabase Security Advisor, Firebase Authorized Domains, quota Apps Script, backup, dan monitoring harus diperiksa oleh administrator environment.

Detail uji dan rollback tersedia pada `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.9_SECURE.md`.
