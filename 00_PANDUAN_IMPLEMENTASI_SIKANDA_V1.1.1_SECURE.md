# Panduan Implementasi SIKANDA V1.1.1 Secure

Panduan ini adalah satu-satunya panduan implementasi untuk ZIP final V1.1.1. Ikuti urutan dari awal dan jangan mencampur berkas dengan rilis lama.

## 1. Arsitektur final

| Komponen | Layanan | Keputusan |
|---|---|---|
| Frontend | React/Vite di Google AI Studio dan GitHub Pages | Tidak menyimpan secret backend |
| Login | Firebase Authentication — Google | Dipertahankan agar migrasi cepat dan halus |
| Database | Supabase PostgreSQL | Satu-satunya database aplikasi |
| Backend API | Google Apps Script Web App | Verifikasi Firebase token, RBAC, akses Supabase, Gemini, Drive, dan email |
| Foto pegawai | Google Drive | Tetap Restricted, bukan Supabase Storage |
| Tanya SIKANDA | Gemini melalui Apps Script | API key dan konteks data tidak berada di browser |

Supabase Auth, Storage, dan Edge Functions tidak digunakan pada V1.1.1. Browser juga tidak mengimpor `@supabase/supabase-js` dan tidak menerima service-role key.

## 2. Aturan bisnis yang diterapkan

### Role

- **Administrator** dan **Pimpinan**: kewenangan sama—approval dan CRUD penuh, konfigurasi, akun, serta cleansing.
- **Pegawai**: hanya melihat profil sendiri; dapat memperbarui foto, kontak, email, pendidikan, diklat, universitas, tahun lulus, dan keterangan miliknya.
- Pegawai tidak dapat mengubah NIP, nama, status, golongan, jabatan, TMT, tanggal lahir, KGB, pangkat, atau BUP.

### Agenda kepegawaian

| Status di formulir | Penyimpanan | Hak agenda |
|---|---|---|
| ASN | `status=ASN` | KGB, kenaikan pangkat, dan BUP |
| PPPK (Penuh Waktu) | `status=PPPK`, `kategori_pppk=penuh_waktu` | KGB saja |
| PPPK (Paruh Waktu) | `status=PPPK`, `kategori_pppk=paruh_waktu` | Tidak mendapat agenda |
| Pensiun | `status=PENSIUN` | Tidak mendapat agenda aktif |

- KGB default setiap 2 tahun dari TMT Golongan.
- Kenaikan pangkat default setiap 4 tahun dari TMT Golongan.
- BUP default usia 58 tahun.
- Administrator/Pimpinan dapat menyesuaikan tiga nilai tersebut pada Pengaturan Agenda.
- PPPK lama yang belum memiliki kategori wajib diklasifikasikan sebelum disimpan kembali.

### Notifikasi

- Pengingat dikirim satu kali saat agenda memasuki **enam bulan kalender** sebelum jatuh tempo.
- Email individual hanya dikirim ke alamat email pada profil pegawai terkait.
- Rekap otomatis dikirim ke seluruh akun aktif ber-role Administrator/Pimpinan pada `app_access`, ditambah `BOOTSTRAP_ADMIN_EMAIL` bila belum terdaftar.
- Tidak ada kolom alamat rekap manual.
- Tabel `notification_logs` mencegah pengiriman ganda berdasarkan NIP, jenis agenda, dan tanggal jatuh tempo.
- Trigger yang sempat gagal akan mengejar tanggal yang terlewat sejak eksekusi sukses terakhir tanpa mengirim ulang agenda yang sudah tercatat.

## 3. Sebelum mulai

1. Ekspor/backup tabel Supabase aktif: `pegawai`, `assets_vehicle`, `assets_equipment`, `asset_locations`, `app_access`, dan `system_config`.
2. Simpan versi deployment Apps Script lama untuk rollback.
3. Simpan salinan project AI Studio/GitHub yang sedang berjalan.
4. Gunakan project AI Studio baru atau folder repository bersih. Jangan menimpa rilis lama secara overlay.
5. Rotasi Supabase service-role key dan Gemini API key wajib dilakukan sebelum dipromosikan menjadi production/public. Sesuai keputusan saat ini, rotasi boleh dilakukan setelah uji staging, tetapi jangan melewati langkah tersebut saat go-live.

## 4. Import ZIP secara bersih

### Google AI Studio

1. Buat project baru/staging.
2. Import ZIP final ini ke project baru.
3. Pastikan file explorer memuat `src`, `apps-script`, `supabase`, `tests`, `.github`, dan panduan ini.
4. Jangan menyalin file lama ke project baru.

Jika terpaksa memakai project lama, hapus dahulu file lama yang tidak ada di ZIP. Khususnya, pastikan `src/lib/supabase.ts` berisi berkas netral dari rilis ini dan tidak mengimpor `@supabase/supabase-js`.

Logo runtime resmi berada di `src/assets/logo_kota_tangerang_selatan.png`. Background berada di `src/assets/images_landingpage.webp`. Keduanya diimpor sebagai module Vite agar path tetap benar pada AI Studio dan GitHub Pages.

## 5. Jalankan migrasi Supabase

1. Supabase Dashboard → SQL Editor.
2. Buka `supabase/001_sikanda_v1_security.sql`.
3. Jalankan seluruh isi file dalam satu eksekusi.
4. Script bersifat idempoten dan aman dijalankan kembali setelah migrasi V1.1.0.
5. Hasil normal: **Success. No rows returned**.

Jalankan pemeriksaan berikut **satu per satu**, bukan sekaligus:

```sql
select key, value
from public.system_config
order by key;
```

Nilai awal yang harus ada: KGB 2, pangkat 4, BUP 58. Key notifikasi lama sudah dihapus karena ambangnya kini tetap enam bulan kalender.

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Semua tabel aplikasi, termasuk `notification_logs`, harus menunjukkan `rowsecurity=true`.

```sql
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='notification_logs'
order by ordinal_position;
```

Jangan menjalankan kembali SQL lama yang membuka akses `anon` atau mematikan RLS. Akses database aplikasi hanya melalui Apps Script menggunakan service role.

## 6. Pasang backend Apps Script

1. Buka project **Backend SIKANDA**.
2. Ganti seluruh isi `Code.gs` dengan `apps-script/Code.gs` dari ZIP ini.
3. Project Settings → Script Properties. Isi:

| Key | Isi |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | anon/publishable key; bukan otorisasi backend |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role/secret key; hanya di Apps Script |
| `FIREBASE_API_KEY` | Firebase Web API key |
| `GEMINI_API_KEY` | Gemini API key; hanya di Apps Script |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `BOOTSTRAP_ADMIN_EMAIL` | email Administrator pertama |
| `DRIVE_FOLDER_NAME` | misalnya `SIKANDA_Foto_Pegawai` |

Hapus properti lama yang tidak dipakai: `SPREADSHEET_ID`, `SHARED_SECRET`, `ALLOW_LEGACY_SECRET`, `NOTIF_ADMIN_EMAIL`, `NOTIF_WINDOW_HARI`, dan `NOTIF_COOLDOWN_DAYS`.

4. Deploy → Manage deployments → Edit/New deployment → Web app.
5. Execute as: **Me**.
6. Who has access: **Anyone**. Semua operasi POST tetap memerlukan Firebase ID token dan role aktif di `app_access`.
7. Buat **New version**, lalu Deploy.
8. Buka URL yang berakhir `/exec`. Respons sehat harus memuat versi `1.1.1-secure`.

Setiap perubahan `Code.gs` memerlukan versi deployment baru; menekan Save saja tidak memperbarui Web App aktif.

## 7. Konfigurasi trigger notifikasi

1. Apps Script → Triggers → Add Trigger.
2. Function: `kirimNotifikasiBukuPenjagaan`.
3. Event source: Time-driven.
4. Pilih **Day timer**, satu kali per hari di luar jam sibuk.
5. Timezone project: `Asia/Jakarta`.
6. Pastikan pegawai memiliki email valid pada tabel `pegawai`.
7. Pastikan akun Administrator/Pimpinan memiliki email valid, role benar, dan `is_active=true` pada `app_access`.

Tombol **Kirim Notifikasi** memproses agenda yang memasuki ambang hari ini. Ledger mencegah email ganda. Untuk uji staging, gunakan data uji khusus dengan jatuh tempo tepat enam bulan kalender dari tanggal uji; jangan mengubah data pegawai produksi hanya untuk pengujian.

## 8. Konfigurasi Firebase Authentication

1. Authentication → Sign-in method → aktifkan **Google**.
2. Jika aplikasi hanya memakai Google, nonaktifkan Email/Password untuk memperkecil permukaan serangan.
3. Authentication → Settings → Authorized domains, sisakan hanya domain yang dipakai:
   - domain preview/publish Google AI Studio;
   - `pt-dsa.github.io`;
   - domain produksi resmi;
   - `localhost` hanya bila masih diperlukan untuk pengembangan.
4. Tidak perlu mencari atau mengubah **Environment type menjadi Production**. Langkah itu tidak dipakai dalam rilis ini dan dapat tidak muncul pada tampilan Firebase saat ini.
5. Pastikan support email dan pemilik project benar.
6. App Check dapat diterapkan bertahap setelah staging stabil; pantau dahulu agar login tidak terblokir.

Firebase hanya membuktikan identitas. Role aplikasi tetap berasal dari Supabase `app_access`.

## 9. Secrets frontend AI Studio

Isi hanya tujuh variabel berikut:

```text
VITE_APPS_SCRIPT_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

- `VITE_APPS_SCRIPT_URL` wajib berakhir `/exec`, bukan `/dev`.
- Jangan membuat `VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_GEMINI_API_KEY`, atau secret backend lain.
- `GEMINI_API_KEY` pada panel frontend tidak diperlukan. Hapus bila masih muncul dari project lama.
- Nilai berawalan `VITE_` masuk ke bundle browser; karena itu hanya konfigurasi frontend yang boleh memakai prefix tersebut.

Setelah Apply changes, refresh preview dan login ulang dengan Google.

## 10. Inisialisasi akun

1. Login memakai email yang sama dengan `BOOTSTRAP_ADMIN_EMAIL`.
2. Buka Kelola Akun.
3. Daftarkan Administrator, Pimpinan, dan Pegawai secara permanen.
4. Untuk Pegawai, email harus terhubung ke NIP 18 digit yang benar.
5. Nonaktifkan akun yang tidak lagi berhak.

`BOOTSTRAP_ADMIN_EMAIL` boleh dipertahankan sebagai jalur pemulihan terkontrol atau dikosongkan setelah skenario pemulihan diuji.

## 11. Foto Google Drive

1. Upload pertama akan membuat/memakai folder sesuai `DRIVE_FOLDER_NAME`.
2. Berikan izin Drive dan Mail kepada Apps Script saat diminta.
3. Uji foto dari akun Administrator dan satu Pegawai.
4. Pastikan file Drive berstatus Restricted, bukan “Anyone with the link”.
5. Jangan memindahkan/menghapus foto langsung di Drive tanpa memperbarui URL pada profil.

## 12. Validasi fungsi aplikasi

### Logo dan login

- Logo Kota Tangerang Selatan tampil pada landing page dan sidebar.
- Background login tampil pada AI Studio serta GitHub Pages.
- Login Google berhasil tanpa mode pengembangan.

### Data pegawai dan PPPK

- Form menampilkan ASN, PPPK (Penuh Waktu), PPPK (Paruh Waktu), dan Pensiun.
- PPPK penuh waktu menghasilkan KGB saja.
- PPPK paruh waktu tidak menghasilkan KGB, pangkat, atau BUP.
- Pegawai hanya melihat profil sendiri dan hanya field yang diizinkan dapat diedit.

### Buku Penjagaan

- Pengaturan hanya memuat siklus KGB, siklus pangkat, dan usia BUP.
- Tidak ada kolom email penerima manual.
- Email pegawai terkirim satu kali pada ambang enam bulan kalender.
- Rekap otomatis masuk ke email Administrator/Pimpinan aktif.
- Baris berhasil tercatat pada `notification_logs`.

### Menu Versi 2

- Inventaris: “Menu Inventaris dalam Pengembangan…”.
- Pagu Anggaran: “Menu Pagu Anggaran dalam Pengembangan…”.
- Pemeliharaan Kendaraan: “Menu Pemeliharaan Kendaraan dalam Pengembangan…”.
- Peminjaman: “Menu Peminjaman dalam Pengembangan…”.
- Menu tersebut hanya terlihat bagi Administrator/Pimpinan; data terkait tidak diproses pada V1.

### Rekap Laporan

Hanya ada tiga ekspor: Data ASN/PPPK, Buku Penjagaan, dan Data Kendaraan. Alat & Mesin serta empat modul Versi 2 tidak masuk ke halaman ini.

### Tanya SIKANDA

- `GEMINI_MODEL=gemini-2.5-flash`.
- Administrator/Pimpinan dapat bertanya dalam lingkup seluruh data aktif.
- Pegawai hanya mendapat jawaban dari profil/aset miliknya.
- Jika quota sementara penuh, aplikasi memberi pesan ramah dan backend mencoba ulang untuk 429/5xx.

## 13. Deploy GitHub Pages

1. Gunakan isi ZIP ini sebagai isi repository—jangan hanya menambahkan file di atas repository lama.
2. Pastikan tidak ada `.env`, service-role key, Gemini API key, atau key lain dalam commit.
3. GitHub → Settings → Secrets and variables → Actions. Isi tujuh `VITE_*` yang sama dengan AI Studio.
4. Settings → Pages → Source: GitHub Actions.
5. Push ke branch `main`.
6. Workflow akan memakai Node.js 22, menjalankan TypeScript, test agenda/backend, audit dependensi produksi, build, lalu deploy.

Jika pernah mendapat error `Cannot find module '@supabase/supabase-js'`:

- pastikan `src/lib/supabase.ts` adalah berkas netral dari ZIP ini;
- jangan menambah `@supabase/supabase-js` karena browser memang tidak boleh mengakses Supabase langsung;
- pastikan commit terbaru benar-benar menimpa file lama;
- jalankan ulang workflow.

## 14. Pemeriksaan lokal

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
```

Hasil wajib:

- TypeScript lulus;
- `agenda-tests: OK`;
- `backend-rules-tests: OK`;
- build produksi lulus;
- tidak ada vulnerability tingkat high/critical.

## 15. Keamanan sebelum production

- Rotasi Supabase service-role key yang pernah terlihat pada capture.
- Rotasi Gemini API key yang pernah terlihat pada capture.
- Perbarui hanya Script Properties; jangan memasukkannya ke AI Studio/GitHub.
- Periksa riwayat GitHub dengan secret scanning.
- Batasi Firebase Web API key pada Google Cloud Credentials sesuai API/domain yang diperlukan.
- Pastikan RLS aktif dan `anon`/`authenticated` tidak memiliki hak langsung ke tabel aplikasi.
- Pastikan foto Drive Restricted.
- Tinjau `audit_logs` dan `notification_logs`.

## 16. Promosi staging menjadi production

Versi staging dapat menjadi production tanpa menulis ulang aplikasi:

1. Selesaikan seluruh matriks uji.
2. Rotasi key yang tertunda.
3. Gunakan deployment Apps Script versi V1.1.1 yang sudah diuji.
4. Pastikan Secrets GitHub/AI Studio menunjuk backend dan Firebase yang benar.
5. Publish/deploy commit yang sama—jangan membangun ulang dari project lama.
6. Pantau login, error Apps Script, query Supabase, kuota email, dan Gemini selama masa awal.

Perbedaan staging dan production hanya lingkungan, data/credential, domain, serta tingkat pengawasan. Source code yang dipromosikan harus identik dengan source yang lulus uji.

## 17. Rollback

Jika ada masalah:

1. Hentikan trigger notifikasi agar tidak ada email baru.
2. Kembalikan deployment Apps Script ke versi sebelumnya.
3. Kembalikan frontend ke deployment GitHub/AI Studio sebelumnya.
4. Pulihkan database hanya bila data benar-benar rusak; jangan melakukan restore tanpa bukti.
5. Simpan log error tanpa menyalin token atau data sensitif.

## 18. Troubleshooting

- **Logo tidak tampil**: pastikan import bersih dan `src/assets/logo_kota_tangerang_selatan.png` berukuran 180×180, bukan file lama yang rusak.
- **Background tidak tampil**: pastikan `src/assets/images_landingpage.webp` tersedia.
- **Layar terus “sedang bersiap”**: cek `VITE_APPS_SCRIPT_URL`, deployment `/exec`, login, dan Execution log Apps Script.
- **Akun ditolak**: cek email, role, NIP, dan `is_active` pada `app_access`.
- **Data lambat**: pastikan Web App versi `1.1.1-secure`, import bersih, dan tidak ada client Supabase lama.
- **Tanya SIKANDA gagal**: cek `GEMINI_MODEL=gemini-2.5-flash`, key, quota, dan Execution log.
- **Notifikasi tidak terkirim**: cek trigger, timezone, email profil, kuota MailApp, `notification_logs`, dan akun Administrator/Pimpinan aktif.
- **GitHub gagal**: buka langkah merah pertama; pastikan Node 22 dan file `src/lib/supabase.ts` netral.

Dokumentasi acuan: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Firebase Authentication](https://firebase.google.com/docs/auth), [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas), dan [Gemini models](https://ai.google.dev/gemini-api/docs/models).
