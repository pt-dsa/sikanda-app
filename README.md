# SIKANDA V1.1.13 Secure

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah berbasis React/Vite, Firebase Authentication, Google Apps Script, dan Supabase PostgreSQL/Storage.

Mulai dari **`00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.13_SECURE.md`**. Dokumen tersebut memuat urutan replace full source di AI Studio, deploy backend, UAT enam revisi, quality gate production, keamanan, dan rollback.

## Fokus V1.1.13

- Badge “Perlu Verifikasi” dan Data Cleansing memakai pemindai yang sama.
- Loading menampilkan persentase proses nyata dan bar biru–hijau tanpa animasi berulang palsu.
- Keterangan PPPK Paruh Waktu disederhanakan.
- Dashboard memakai snapshot tunggal, penundaan proses foto, cache lima menit, dan deduplikasi permintaan.
- Tanya SIKANDA memakai fakta agenda yang sama dengan Buku Penjagaan/notifikasi serta memahami pertanyaan terlambat dan pertanyaan lanjutan.
- Diksi teknis internal dihapus dari antarmuka pengguna.
- Seluruh baseline keamanan, CRUD, kondisi aset, koordinat opsional, foto private, sinkronisasi, mobile-first, dan RBAC versi sebelumnya dipertahankan.

## Verifikasi

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
cp apps-script/Code.gs /tmp/sikanda-code.js
node --check /tmp/sikanda-code.js
```

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, atau kredensial backend di source frontend maupun ZIP.

