# LAPORAN VERIFIKASI SIKANDA V1.1.12 SECURE

Tanggal pemeriksaan: 17 Juli 2026  
Target: source lengkap, backend Apps Script, dan build produksi V1.1.12

## Ringkasan

V1.1.12 memperbaiki tampilan agenda PPPK Paruh Waktu dan avatar login dengan tetap mempertahankan model keamanan Firebase → Apps Script → Supabase. Pemeriksaan lokal menyatakan source sebagai **production candidate**; promosi production tetap mensyaratkan UAT live pada akun dan database operasional.

## Hasil otomatis

| Pemeriksaan | Hasil |
|---|---|
| TypeScript `tsc --noEmit` | Lulus |
| Suite regresi | 14/14 lulus |
| Regresi khusus V1.1.12 | Lulus |
| Build Vite production | Lulus |
| Sintaks Apps Script | Valid |
| `npm audit --omit=dev --audit-level=high` | 0 kerentanan |
| `git diff --check` | Lulus |

## Regresi khusus V1.1.12

- PPPK Paruh Waktu menghasilkan nol agenda.
- PPPK Penuh Waktu hanya menghasilkan KGB.
- ASN tetap menghasilkan KGB, kenaikan pangkat, dan BUP.
- Modal profil memakai kebijakan agenda pusat dan tidak lagi membuat kartu statis.
- Header memakai komponen foto pegawai.
- Respons `whoami` membawa signed URL foto dan NIP sumber foto tanpa mengubah NIP otorisasi akun.
- Endpoint health melaporkan `1.1.12-secure`.

## Batas pemeriksaan

Pemeriksaan lokal tidak dapat membuktikan bahwa setiap record `app_access` sudah tertaut ke pegawai yang benar atau bahwa setiap pegawai memiliki foto. Validasi tersebut harus dilakukan pada Supabase live dan melalui login UAT sesuai panduan implementasi.

## Status

**Production candidate — layak UAT live.**
