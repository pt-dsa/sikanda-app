# Panduan Implementasi SIKANDA V1.1.2 Secure

Panduan ini adalah panduan resmi untuk paket **SIKANDA V1.1.2 Secure**. Jangan mencampurkan `Code.gs`, SQL, atau file frontend dari rilis lama.

## 1. Ringkasan rilis

V1.1.2 mempertahankan arsitektur aman V1.1.1 dan menyelesaikan enam revisi:

1. Form Tambah/Edit Kendaraan mengikuti kelengkapan field database.
2. Tambah Akun memakai pencarian nama pegawai dan mengisi NIP/email otomatis.
3. Tanya SIKANDA memakai database-first, fallback model, pemeriksaan konfigurasi, serta pesan yang lebih humanis.
4. Rekap Laporan memiliki filter per kategori; CSV dan cetak mengikuti filter.
5. Halaman login menampilkan petunjuk pemilihan email dan dilengkapi panduan branding OAuth.
6. Card Komposisi SDM dibuat lebih ringkas dan proporsional.

## 2. Arsitektur yang tidak berubah

| Lapisan | Teknologi | Ketentuan keamanan |
|---|---|---|
| Frontend | React/Vite/TypeScript | Tidak menyimpan service-role key atau Gemini API key |
| Login | Firebase Authentication Google | Membuktikan identitas, bukan menentukan role |
| Backend | Google Apps Script Web App | Verifikasi token Firebase dan RBAC server-side |
| Database | Supabase PostgreSQL | Browser tidak mengakses Supabase langsung |
| Foto pegawai | Google Drive | Restricted dan dibagikan hanya kepada pihak berhak |
| Asisten | Gemini melalui Apps Script | Key hanya di Script Properties |
| Publikasi | Google AI Studio dan GitHub Pages | Hanya konfigurasi publik `VITE_*` masuk build |

Administrator dan Pimpinan tetap memiliki kewenangan yang sama. Pegawai hanya dapat mengakses profil sendiri serta field yang diizinkan.

## 3. Berkas penting

| Berkas | Fungsi |
|---|---|
| `apps-script/Code.gs` | Backend lengkap V1.1.2 |
| `supabase/001_sikanda_v1_security.sql` | Migrasi dasar untuk instalasi bersih |
| `supabase/002_sikanda_v1_1_2_revision.sql` | Penambahan field kendaraan V1.1.2 |
| `.github/workflows/deploy.yml` | Build, test, audit, dan deploy GitHub Pages |
| `tests/` | Pengujian agenda, backend, dan filter laporan |

## 4. Tentukan jalur implementasi

### Jalur A — upgrade dari V1.1.1 Secure

Gunakan jalur ini bila `SIKANDA_v1.1.1_SECURE_AI_STUDIO_FINAL_REV1_2026-07-11.zip` sudah diimplementasikan.

1. Backup Supabase dan deployment Apps Script aktif.
2. Jalankan hanya `supabase/002_sikanda_v1_1_2_revision.sql`.
3. Ganti seluruh `Code.gs` dengan versi V1.1.2.
4. Buat versi deployment Apps Script baru.
5. Import frontend V1.1.2 secara bersih ke AI Studio/repository.

Jangan menjalankan ulang migrasi dasar `001` kecuali diperlukan untuk pemulihan atau pemeriksaan instalasi.

### Jalur B — instalasi bersih

1. Jalankan seluruh `supabase/001_sikanda_v1_security.sql` sebagai satu eksekusi.
2. Setelah sukses, jalankan seluruh `supabase/002_sikanda_v1_1_2_revision.sql` sebagai satu eksekusi kedua.
3. Pasang `apps-script/Code.gs`.
4. Konfigurasikan Firebase, AI Studio, dan GitHub.

## 5. Backup sebelum perubahan

Backup minimal tabel berikut:

- `pegawai`
- `assets_vehicle`
- `assets_equipment`
- `asset_locations`
- `app_access`
- `system_config`
- `notification_logs`
- `audit_logs`

Simpan deployment Apps Script V1.1.1 sebagai rollback. Jangan menghapus deployment lama sebelum V1.1.2 lolos uji staging.

## 6. Jalankan SQL Supabase

### 6.1 Upgrade V1.1.1 ke V1.1.2

1. Buka Supabase → SQL Editor.
2. Buka `supabase/002_sikanda_v1_1_2_revision.sql`.
3. Salin **seluruh isi file**, dari komentar pertama sampai `commit;`.
4. Tempel sebagai satu blok di SQL Editor.
5. Klik **Run satu kali**.
6. Hasil normal: `Success. No rows returned`.

Yang dimaksud **satu blok** adalah seluruh query dalam file dijalankan sekaligus, bukan per baris.

### 6.2 Pemeriksaan setelah migrasi

Jalankan blok berikut secara terpisah. Salin seluruh blok pertama, klik Run, periksa hasilnya, baru lanjutkan blok kedua.

Blok 1 — struktur kendaraan:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'assets_vehicle'
order by ordinal_position;
```

Pastikan field `kapasitas_mesin`, `no_bpkb`, `no_rangka`, `no_mesin`, `harga_pembelian`, dan `qr_url` tersedia, atau tersedia melalui nama legacy yang sudah dipetakan backend.

Blok 2 — status RLS:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Semua tabel aplikasi harus menunjukkan `rowsecurity = true`.

Blok 3 — konfigurasi agenda:

```sql
select key, value
from public.system_config
order by key;
```

Nilai default: KGB 2 tahun, pangkat 4 tahun, dan BUP 58 tahun.

Blok 4 — ledger notifikasi:

```sql
select event_key, notification_kind, recipient_email,
       employee_nip, event_type, due_date, reminder_date,
       status, sent_at
from public.notification_logs
order by sent_at desc
limit 100;
```

Tabel kosong bukan error. Baris baru hanya muncul ketika ada agenda yang benar-benar memasuki enam bulan kalender dan email berhasil dikirim.

## 7. Pasang backend Apps Script

1. Buka project **Backend SIKANDA**.
2. Buka `Code.gs`.
3. Hapus seluruh isi lama.
4. Salin seluruh isi `apps-script/Code.gs` dari paket V1.1.2.
5. Klik **Save**.

### 7.1 Script Properties

Pastikan Project Settings → Script Properties memuat:

| Key | Nilai/Keterangan |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | Anon/publishable key; bukan otorisasi backend |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key; hanya di Apps Script |
| `FIREBASE_API_KEY` | Firebase Web API key |
| `GEMINI_API_KEY` | Gemini API key backend |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `GEMINI_FALLBACK_MODELS` | `gemini-2.5-flash-lite` |
| `BOOTSTRAP_ADMIN_EMAIL` | Email Administrator pemulihan |
| `DRIVE_FOLDER_NAME` | Contoh `SIKANDA_Foto_Pegawai` |

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` atau key Gemini backend di source, AI Studio frontend, maupun GitHub.

### 7.2 Fungsi yang perlu di-RUN manual

Hanya fungsi berikut yang direkomendasikan untuk pemeriksaan Tanya SIKANDA:

```text
ujiKonfigurasiTanyaSikanda
```

Cara menjalankan:

1. Di toolbar Apps Script, buka dropdown fungsi yang biasanya menampilkan `doGet`.
2. Pilih `ujiKonfigurasiTanyaSikanda`.
3. Klik **Jalankan/Run satu kali**.
4. Berikan izin bila Apps Script meminta otorisasi.
5. Buka **Execution log/Log eksekusi**.

Hasil sehat mengandung:

```text
"configured":true
"success":true
"http":200
"available":true
```

Fungsi ini:

- tidak mengubah database;
- tidak mengirim email;
- tidak menampilkan API key;
- hanya memeriksa apakah key dan model tersedia.

Jangan menjalankan `kirimNotifikasiBukuPenjagaan` untuk uji coba bila tidak ada data staging yang disiapkan. Fungsi tersebut dapat mengirim email sungguhan.

### 7.3 Deploy versi baru

1. Deploy → Manage deployments.
2. Pilih deployment Web App aktif → Edit.
3. Version → **New version**.
4. Execute as: **Me**.
5. Who has access: **Anyone**.
6. Klik Deploy.
7. Pastikan frontend memakai URL `/exec`, bukan `/dev`.

Buka URL `/exec`. Respons sehat harus memuat:

```json
{"ok":true,"service":"SIKANDA","version":"1.1.2-secure"}
```

Menekan Save tanpa membuat New version tidak memperbarui Web App aktif.

## 8. Trigger notifikasi

Pertahankan satu trigger:

- Function: `kirimNotifikasiBukuPenjagaan`
- Deployment: `Head`
- Event source: Time-driven
- Type: Day timer
- Timezone: `Asia/Jakarta`
- Waktu: satu kali sehari, misalnya 00.00–01.00

Jika layar trigger menunjukkan dua trigger sejenis, hapus trigger duplikat yang Anda miliki dan sisakan satu. Ledger mencegah duplikasi normal, tetapi satu trigger tetap merupakan konfigurasi yang benar dan lebih hemat kuota.

## 9. Google AI Studio

Import ZIP V1.1.2 ke project staging baru atau lakukan penggantian seluruh file secara bersih.

Frontend hanya memakai:

```text
VITE_APPS_SCRIPT_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

### Catatan `GEMINI_API_KEY` bawaan AI Studio

Google AI Studio dapat membuat baris `GEMINI_API_KEY` paling atas secara otomatis dan baris tersebut dapat tidak menyediakan opsi hapus. Biarkan baris bawaan itu tetap ada.

Pengamanan V1.1.2:

- frontend SIKANDA tidak membaca `import.meta.env.GEMINI_API_KEY`;
- key bawaan tersebut tidak dipakai untuk Tanya SIKANDA;
- Tanya SIKANDA memakai `GEMINI_API_KEY` dari Apps Script Properties;
- GitHub Actions tidak memiliki dan tidak memerlukan Gemini key.

Setelah mengisi tujuh `VITE_*`, klik **Apply changes**, refresh preview, lalu login ulang.

## 10. Firebase dan branding login Google

### 10.1 Authentication

1. Aktifkan provider Google.
2. Jika tidak memakai login email/password, nonaktifkan Email/Password.
3. Authorized Domains harus mencakup domain AI Studio yang aktif, `pt-dsa.github.io`, dan domain produksi resmi.
4. Hapus domain preview lama setelah dipastikan tidak lagi digunakan.

### 10.2 Mengganti nama generik pada popup Google

Teks popup Google dikendalikan oleh Google dan tidak dapat diganti bebas dari React. V1.1.2 sudah menampilkan petunjuk berikut pada halaman login:

> Pilih email yang digunakan untuk login SIKANDA.

Untuk mengganti identitas generik project:

1. Buka Google Cloud Console pada project Firebase yang sama.
2. Google Auth Platform → Branding.
3. App name: `SIKANDA`.
4. Isi User support email.
5. Pasang logo resmi yang konsisten dengan halaman login.
6. Simpan dan ajukan verifikasi branding bila diminta.

Nama/logo dapat memerlukan brand verification sebelum tampil penuh. Bila instansi sudah memiliki domain resmi, custom auth domain Firebase dapat diterapkan kemudian untuk mengganti tampilan domain `*.firebaseapp.com`.

## 11. Validasi enam revisi

### 11.1 Data Kendaraan

Uji tambah dan edit kendaraan. Pastikan form memuat:

- Asset ID otomatis;
- Kode Barang terpisah dari Nomor Polisi;
- Nama Aset, Merk, Tipe, Jenis, Tahun, Kondisi;
- Pengguna, Penanggung Jawab, Lokasi/Unit Kerja;
- KM, kapasitas mesin, BPKB, rangka, mesin, harga;
- latitude, longitude, dan foto.

Setelah simpan, refresh halaman dan pastikan semua nilai tetap ada. Nomor Polisi tidak boleh lagi menimpa Kode Barang.

### 11.2 Kelola Akun

1. Klik Tambah Akun.
2. Ketik minimal dua huruf nama pegawai.
3. Pilih suggestion.
4. Pastikan Nama, NIP, dan Email terisi otomatis.
5. Pilih Peran.
6. Simpan.

Backend mencocokkan ulang NIP ke Database Pegawai, sehingga email/NIP hasil manipulasi browser tidak dipercaya. Pegawai tanpa email valid harus dilengkapi melalui Data ASN/PPPK.

### 11.3 Tanya SIKANDA

Uji minimal:

```text
Siapa saja yang KGB-nya jatuh tempo dalam 6 bulan ke depan?
Berapa jumlah ASN saat ini?
Berapa jumlah kendaraan roda 4?
```

Pertanyaan faktual tersebut dijawab database-first tanpa memakai kuota Gemini. Uji satu pertanyaan naratif untuk memastikan fallback Gemini sehat.

### 11.4 Rekap Laporan

Untuk masing-masing kategori:

1. Aktifkan satu atau lebih filter.
2. Perhatikan jumlah “hasil dari total data”.
3. Klik Unduh CSV Hasil Filter.
4. Buka CSV dan pastikan hanya hasil filter yang tersedia.
5. Klik Cetak Halaman.
6. Pastikan dialog cetak browser terbuka tanpa memuat sidebar aplikasi.
7. Pastikan halaman cetak memuat filter aktif, jumlah data, dan tabel.

### 11.5 Login

Pastikan halaman login menampilkan “Pilih email yang digunakan untuk login SIKANDA.” Branding popup mengikuti pengaturan Google Auth Platform.

### 11.6 Dashboard

Pada Komposisi SDM, pastikan ketiga card ringkas, tinggi proporsional, donut lebih besar, bar terpusat, dan tidak memiliki ruang kosong berlebihan.

## 12. Deploy GitHub Pages

Repository GitHub hanya membutuhkan tujuh secret `VITE_*` yang sama dengan AI Studio. Jangan membuat GitHub secret `GEMINI_API_KEY` atau `SUPABASE_SERVICE_ROLE_KEY`.

1. Gunakan seluruh isi paket V1.1.2 sebagai isi repository.
2. Jangan commit `.env`, `node_modules`, `dist`, atau secret.
3. Push ke branch `main`.
4. Settings → Pages → Source: GitHub Actions.
5. Pantau workflow sampai seluruh langkah hijau.

Workflow menjalankan:

```bash
npm ci
npm run lint
npm run test
npm audit --omit=dev --audit-level=high
npm run build
```

## 13. Pemeriksaan lokal opsional

Jalankan perintah berikut satu per satu dari root project:

```bash
npm ci
```

Setelah selesai:

```bash
npm run verify
```

Terakhir:

```bash
npm audit --omit=dev --audit-level=high
```

Hasil wajib: TypeScript lulus, `agenda-tests`, `backend-rules-tests`, dan `reporting-tests` berstatus OK, build berhasil, serta tidak ada vulnerability high/critical.

## 14. Troubleshooting

### Tanya SIKANDA masih gagal

1. Jalankan `ujiKonfigurasiTanyaSikanda`.
2. HTTP 200: model tersedia.
3. HTTP 403: periksa pembatasan API key/project.
4. HTTP 404: periksa nama model.
5. HTTP 429: kuota sedang terbatas.
6. Pastikan Web App sudah dibuat New version.
7. Pastikan frontend memakai `/exec` terbaru.

### Suggestion pegawai kosong

- ketik minimal dua huruf;
- pastikan pegawai aktif;
- pastikan NIP 18 digit;
- pegawai yang sudah memiliki akun memang tidak ditampilkan;
- lengkapi email melalui Data ASN/PPPK.

### Cetak tidak membuka dialog

Uji dari URL GitHub Pages/publish, bukan hanya preview editor. Pastikan browser tidak memblokir dialog cetak dan tidak sedang membuka dialog modal lain.

### Field kendaraan tidak tersimpan

Pastikan migrasi `002_sikanda_v1_1_2_revision.sql` sudah dijalankan dan Apps Script `/exec` sudah memakai versi `1.1.2-secure`.

## 15. Keamanan sebelum production

- Rotasi Supabase service-role key dan Gemini API key yang pernah terlihat/dibagikan.
- Simpan key baru hanya di Apps Script Properties.
- Aktifkan secret scanning GitHub.
- Batasi Firebase Web API key sesuai API dan domain yang diperlukan.
- Pastikan hanya satu trigger notifikasi aktif.
- Uji role Administrator, Pimpinan, dan Pegawai secara terpisah.
- Jangan mempromosikan staging sebelum seluruh checklist V1.1.2 lulus.

## 16. Rollback

Jika ditemukan masalah kritis:

1. Arahkan frontend kembali ke deployment Apps Script V1.1.1.
2. Redeploy commit/tag frontend V1.1.1.
3. Jangan menghapus kolom tambahan V1.1.2; kolom tersebut kompatibel dan tidak mengganggu V1.1.1.
4. Pulihkan data dari backup hanya bila terjadi perubahan data yang tidak diinginkan.

## 17. Referensi resmi

- Gemini API model: `https://ai.google.dev/gemini-api/docs/models`
- Google Auth Platform branding: `https://support.google.com/cloud/answer/15549049`
- Firebase custom authentication domain: `https://firebase.google.com/docs/auth/web/google-signin`
