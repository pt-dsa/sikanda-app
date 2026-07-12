# Panduan Implementasi SIKANDA V1.1.3 Secure

Panduan ini adalah sumber utama untuk upgrade dari SIKANDA V1.1.2 Secure ke V1.1.3 Secure. Gunakan semua file dari paket yang sama. Jangan mencampurkan `Code.gs`, SQL, atau frontend dari rilis lain.

## 1. Langkah wajib yang paling penting

Perubahan tampilan **tidak akan muncul** hanya dengan mengganti Secret atau menjalankan SQL.

Setelah SQL dan Apps Script selesai, source frontend V1.1.3 **wajib** di-upload/import/replace ke project Google AI Studio, kemudian klik **Apply changes** dan **Publish**. Untuk GitHub Pages, seluruh source V1.1.3 wajib di-push ke repository dan workflow deploy harus selesai hijau.

Urutan upgrade yang benar:

1. Backup Supabase dan catat deployment Apps Script lama.
2. Run `supabase/003_sikanda_v1_1_3_revision.sql` di Supabase.
3. Ganti seluruh isi project Backend SIKANDA dengan `apps-script/Code.gs` V1.1.3.
4. Buat **New version** deployment Apps Script dan salin URL Web App `/exec`.
5. Perbarui `VITE_APPS_SCRIPT_URL` bila URL berubah.
6. Upload/import/replace **seluruh source frontend paket ZIP V1.1.3** ke Google AI Studio.
7. Di AI Studio klik **Apply changes**, periksa Preview, lalu **Publish**.
8. Push source yang sama ke GitHub `main`; pastikan GitHub Actions selesai hijau.
9. Lakukan checklist validasi pada bagian 10.

## 2. Isi revisi V1.1.3

1. `Edit Profile` aktif. Pegawai hanya dapat mengedit profil dengan NIP akun login dan hanya field yang diizinkan. Admin/Pimpinan tetap dapat mengedit semua pegawai dari modal detail.
2. Dashboard membedakan PPPK Penuh Waktu dan Paruh Waktu. Data PPPK lama tanpa kategori diperlakukan sebagai Penuh Waktu.
3. Judul card Dashboard dan card bersama dibuat tebal; ukuran dan susunan card dibuat proporsional.
4. Form Pegawai memakai dropdown masa kerja tahun/bulan dan tingkat pendidikan.
5. Field Bidang memakai daftar data eksisting Buku Penjagaan, menerima Bidang baru, dan memiliki filter tersendiri.
6. Label/filter status Data ASN/PPPK dan Buku Penjagaan menampilkan PPPK Penuh Waktu/Paruh Waktu.
7. Tambah Akun menampilkan status pegawai yang dipilih.
8. Cetak Halaman memakai kop resmi Dinas Cipta Karya dan Tata Ruang.
9. Tambah/Edit Alat & Mesin menjadi CRUD lengkap sesuai field database.

## 3. Arsitektur dan keamanan

| Lapisan | Teknologi | Ketentuan |
|---|---|---|
| Frontend | React, Vite, TypeScript | Tidak menyimpan service-role key atau key Gemini backend |
| Login | Firebase Authentication | Identitas diverifikasi Google/Firebase |
| Otorisasi | Apps Script RBAC | Role dan kepemilikan NIP diverifikasi server-side |
| Database | Supabase PostgreSQL | Browser tidak membaca Supabase langsung |
| Foto | Google Drive | Upload melalui backend |
| Tanya SIKANDA | Gemini via Apps Script | Key hanya di Script Properties |
| Deploy | AI Studio dan GitHub Pages | Build hanya menerima konfigurasi publik `VITE_*` |

`GEMINI_API_KEY` bawaan paling atas di Secrets Google AI Studio boleh tetap ada dan tidak perlu dihapus. Frontend V1.1.3 tidak membacanya untuk Tanya SIKANDA; key backend tetap berada di Apps Script Properties.

## 4. Backup

Backup minimal tabel: `pegawai`, `assets_vehicle`, `assets_equipment`, `app_access`, `system_config`, `notification_logs`, dan `audit_logs`.

Jangan menghapus deployment Apps Script lama sampai V1.1.3 lolos validasi. Catat URL `/exec` lama untuk rollback.

## 5. Supabase: script yang harus di-Run

### Upgrade dari V1.1.2

Run **hanya** file berikut:

```text
supabase/003_sikanda_v1_1_3_revision.sql
```

Cara menjalankan:

1. Buka Supabase > SQL Editor > New query.
2. Buka file `003_sikanda_v1_1_3_revision.sql` dari paket.
3. Salin seluruh isi file, termasuk `begin;` sampai `commit;`.
4. Tempel sebagai satu blok dan klik **Run satu kali**.
5. Hasil normal: `Success. No rows returned`.

Script ini idempoten, tetapi jangan Run berulang tanpa alasan. Script mengisi `kategori_pppk='penuh_waktu'` untuk PPPK lama yang kategorinya kosong dan menambah field Alat & Mesin yang belum tersedia.

### Instalasi bersih

Jalankan berurutan sebagai tiga eksekusi terpisah:

1. `supabase/001_sikanda_v1_security.sql`
2. `supabase/002_sikanda_v1_1_2_revision.sql`
3. `supabase/003_sikanda_v1_1_3_revision.sql`

### Verifikasi SQL

Run query berikut secara terpisah setelah migrasi:

```sql
select status, kategori_pppk, count(*)
from public.pegawai
group by status, kategori_pppk
order by status, kategori_pppk;
```

Tidak boleh ada baris `status='PPPK'` dengan `kategori_pppk` kosong/null.

```sql
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='assets_equipment'
order by ordinal_position;
```

Pastikan field identitas aset, `jenis`, `jumlah`, `satuan`, `harga_pembelian`, dan `qr_url` tersedia.

```sql
select tablename, rowsecurity
from pg_tables
where schemaname='public'
order by tablename;
```

Semua tabel aplikasi harus menunjukkan `rowsecurity=true`.

## 6. Backend Google Apps Script

1. Buka project Backend SIKANDA.
2. Buka `Code.gs`.
3. Hapus seluruh isi lama.
4. Salin **seluruh** isi `apps-script/Code.gs` V1.1.3.
5. Klik Save.

Script Properties yang diperlukan:

| Key | Keterangan |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | Anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Rahasia; hanya Apps Script |
| `FIREBASE_API_KEY` | Firebase Web API key |
| `GEMINI_API_KEY` | Key Gemini backend |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `GEMINI_FALLBACK_MODELS` | `gemini-2.5-flash-lite` |
| `BOOTSTRAP_ADMIN_EMAIL` | Email admin pemulihan |
| `DRIVE_FOLDER_NAME` | Contoh `SIKANDA_Foto_Pegawai` |

Fungsi yang boleh di-Run manual untuk pemeriksaan:

```text
ujiKonfigurasiTanyaSikanda
```

Fungsi tersebut tidak mengubah database dan tidak mengirim email. Jangan Run `kirimNotifikasiBukuPenjagaan` untuk uji produksi karena dapat mengirim email nyata.

### Deploy backend

1. Deploy > Manage deployments.
2. Edit Web App aktif.
3. Pilih **New version**.
4. Execute as: **Me**.
5. Who has access: **Anyone**.
6. Klik Deploy dan salin URL yang berakhiran `/exec`.
7. Buka URL tersebut. Respons sehat memuat `"version":"1.1.3-secure"`.

Jika project Backend SIKANDA pernah dihapus/dibuat ulang, URL pasti berubah. Perbarui URL baru pada Secrets AI Studio dan GitHub, kemudian deploy frontend ulang.

## 7. Google AI Studio: upload source wajib

1. Buka project SIKANDA di Google AI Studio.
2. Buat checkpoint/backup project saat ini.
3. Upload/import ZIP V1.1.3 atau replace seluruh file source dengan isi ZIP V1.1.3.
4. Pastikan file baru terlihat, terutama `supabase/003_sikanda_v1_1_3_revision.sql` dan panduan ini.
5. Buka Secrets dan pastikan `VITE_APPS_SCRIPT_URL` memakai URL `/exec` terbaru.
6. Biarkan `GEMINI_API_KEY` bawaan AI Studio tetap ada.
7. Klik **Apply changes**.
8. Refresh Preview dan lakukan validasi UI.
9. Klik **Publish** untuk memperbarui publikasi AI Studio.

Mengubah Secret tanpa meng-upload source hanya mengubah koneksi, bukan komponen React. Form, card, filter, profil, dan kop cetak tidak akan berubah sampai source V1.1.3 di-import dan dipublish.

## 8. GitHub Pages

Pastikan repository memuat seluruh source paket V1.1.3. Jangan upload folder `dist`, `.test-dist`, `node_modules`, atau file berisi secret.

Repository Secrets minimal:

- `VITE_APPS_SCRIPT_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Setelah push ke `main`:

1. Buka Actions.
2. Pastikan lint, test, audit, build, dan deploy selesai hijau.
3. Buka GitHub Pages dengan hard refresh (`Ctrl+F5`).
4. Pastikan asset dan route hash tidak 404.

## 9. Firebase

Pastikan domain GitHub Pages dan domain publik yang digunakan ada di Firebase Authentication > Settings > Authorized domains. Provider Google tetap Enabled.

## 10. Checklist validasi wajib

1. Login admin berhasil dan role berasal dari `app_access`.
2. Dashboard menampilkan Total, ASN, PPPK Penuh Waktu, dan PPPK Paruh Waktu; jumlah keempat card konsisten dengan data aktif.
3. Card Kelengkapan dan Komposisi SDM proporsional pada desktop dan mobile; judul card tebal.
4. Data ASN/PPPK menampilkan label status lengkap dan filter Penuh/Paruh Waktu bekerja.
5. Form Pegawai: dropdown tahun 0-50, bulan 0-11, tingkat pendidikan, Bidang eksisting, dan input Bidang baru bekerja.
6. Filter Bidang Data ASN/PPPK menghasilkan baris yang sama dengan nilai Bidang pada Buku Penjagaan.
7. Buku Penjagaan hanya memberi KGB kepada PPPK Penuh Waktu; PPPK Paruh Waktu tidak mendapat agenda.
8. Tambah Akun: pilih suggestion nama, lalu Nama, NIP, Email, dan Status tampil otomatis; admin hanya menentukan Peran.
9. Login sebagai pegawai: Edit Profile hanya membuka NIP akun tersebut; field kepegawaian sensitif terkunci; perubahan field profil tersimpan.
10. Admin tetap dapat Edit Pegawai dari modal detail.
11. Tambah/Edit Alat & Mesin menyimpan seluruh field, memuat ulang dari database, dan tidak membuat ID lokal palsu.
12. Cetak Halaman: kop, logo, garis ganda, judul, filter, dan tabel terlihat rapi di A4 landscape. Nonaktifkan opsi browser `Headers and footers` bila URL/tanggal bawaan browser masih tampil.
13. CSV dan cetak hanya memuat data sesuai filter aktif.
14. Tanya SIKANDA menjawab pertanyaan database-first tanpa error berulang.

## 11. Pemeriksaan lokal

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
```

Rilis ini telah disiapkan agar `npm run verify` menjalankan TypeScript, pengujian agenda/backend/laporan, dan build produksi.

## 12. Rollback

1. Arahkan `VITE_APPS_SCRIPT_URL` ke deployment Apps Script lama bila backend baru bermasalah.
2. Restore checkpoint AI Studio atau commit GitHub sebelum V1.1.3.
3. Jangan menghapus kolom migrasi `003`; kolom bersifat kompatibel.
4. Bila data `kategori_pppk` perlu dikembalikan, gunakan backup database, bukan update massal tanpa referensi.

## 13. Indikator implementasi selesai

Implementasi baru dinyatakan selesai bila source V1.1.3 sudah dipublish di AI Studio, GitHub Actions hijau, URL `/exec` melaporkan V1.1.3, migrasi `003` terverifikasi, dan seluruh checklist bagian 10 lulus.
