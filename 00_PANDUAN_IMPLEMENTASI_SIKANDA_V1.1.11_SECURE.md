# PANDUAN IMPLEMENTASI SIKANDA V1.1.11 SECURE

Paket utama: `SIKANDA_v1.1.11_SECURE_AI_STUDIO_FINAL.zip`  
Target backend: `1.1.11-secure`  
Tanggal: 16 Juli 2026 (Asia/Jakarta)

## 1. Ringkasan hasil analisis capture

### 1.1 Pesan SQL snippet tidak ditemukan

Pesan Supabase **“The SQL snippet you were trying to open no longer exists. Opened a new query instead.”** berarti referensi tab/snippet yang dibuka sudah dihapus, kedaluwarsa, atau tidak lagi tersedia. Ini bukan error tabel, RLS, maupun transaksi aplikasi. Melanjutkan dari query baru adalah tindakan yang benar.

### 1.2 Fakta kondisi aset di database

Query capture berhasil dan menunjukkan:

| Tabel | Total | BAIK | BELUM DIISI |
|---|---:|---:|---:|
| `assets_vehicle` | 139 | 6 | 133 |
| `assets_equipment` | 40 | 2 | 38 |

Capture terbaru menunjukkan satu record Alat & Mesin sudah berhasil diperbaiki dari kondisi kosong menjadi BAIK (dari 1/39 menjadi 2/38). Artinya update live benar-benar masuk ke database. Database tidak menyatakan seluruh aset BAIK. Versi lama menampilkan kondisi kosong sebagai BAIK karena fallback frontend. Risiko yang lebih besar: saat pengguna mengedit field lain, payload lama juga dapat mengirim BAIK sehingga fakta kosong berubah tanpa verifikasi.

V1.1.11 memperbaiki sumber masalah tanpa mengarang data:

- kosong/`NULL` tetap kosong di database;
- UI menampilkan label **BELUM DIISI**;
- tambah data wajib memilih kondisi;
- edit data legacy tanpa kondisi tetap dapat menyimpan field lain;
- kondisi baru hanya tersimpan ketika benar-benar dipilih;
- perbaikan 171 record dilakukan individual setelah pemeriksaan fisik.

> Jangan menjalankan `UPDATE ... SET kondisi = 'BAIK' WHERE kondisi IS NULL`. Tindakan itu membuat data terlihat lengkap tetapi tidak membuktikan kondisi fisik aset.

### 1.3 Skema aktif

Capture struktur membuktikan kolom aktif memakai nama Indonesia, antara lain:

- Kendaraan: `asset_id`, `no_polisi`, `nama_aset`, `merk`, `pengguna`, `kondisi`, `updated_at`;
- Alat & Mesin: `asset_id`, `kode_barang`, `nama_aset`, `merk`, `pengguna`, `kondisi`, `updated_at`.

Query dengan `plate_number` atau `asset_name` gagal karena kolom tersebut tidak ada pada skema aktif. Source tetap memiliki alias baca untuk kompatibilitas, tetapi query manual harus memakai nama kolom aktual.

## 2. Perubahan V1.1.11

### 2.1 Data Kendaraan dan Alat & Mesin

- Lima card utama selalu tampil dalam urutan tetap, walaupun nilainya nol:
  1. `Total Kendaraan` atau `Total Alat & Mesin` (biru);
  2. `Kondisi Baik` (hijau);
  3. `Kurang Baik` (kuning);
  4. `Rusak Ringan` (oranye);
  5. `Rusak Berat` (merah).
- Card dapat diklik untuk memfilter tabel dengan kunci kondisi yang sama.
- **BELUM DIISI bukan kondisi fisik** dan karena itu tidak dijadikan card kondisi. Nilainya ditampilkan sebagai banner peringatan kualitas data terpisah yang dapat diklik.
- Tabel, card mobile, detail, dan filter memakai label yang sama.
- Dropdown kondisi mendukung empat nilai resmi:
  - `BAIK`
  - `RUSAK RINGAN`
  - `KURANG BAIK`
  - `RUSAK BERAT`
- Form tambah dimulai tanpa kondisi dan tidak dapat disimpan sebelum pengguna memilih.
- Form edit data legacy memberi peringatan, tetapi tidak memblokir perbaikan field lain.
- Tautan `?edit=<asset_id>` membuka record yang tepat satu kali dan hanya untuk role yang memiliki `asset.write`.

### 2.2 Data Cleansing

- Card baru menampilkan jumlah kondisi aset belum diisi.
- Daftar terpisah menunjukkan tipe, Asset ID, identitas aset, dan pengguna.
- Tombol **Perbaiki** membuka modal edit Kendaraan atau Alat & Mesin yang sesuai.
- Tidak tersedia auto-fix/bulk-fix kondisi untuk mencegah klaim BAIK tanpa pemeriksaan.
- Fitur **Perlu Verifikasi** nama pegawai-aset tetap dipertahankan dan terpisah.

### 2.3 Peta dan laporan

- Peta Sebaran tidak lagi memberi label BAIK pada koordinat aset yang kondisinya kosong.
- Legenda memuat **BELUM DIISI**.
- Filter, print, dan CSV dapat memilih/menampilkan **BELUM DIISI**.
- Relasi aset pada detail pegawai juga memakai label yang benar.
- Badge `KURANG BAIK` memakai warna peringatan.

### 2.4 Backend

- Apps Script melaporkan `1.1.11-secure`.
- Server memvalidasi enum kondisi, tidak hanya mempercayai frontend.
- Create tanpa kondisi ditolak.
- Update tanpa properti kondisi mempertahankan nilai database saat ini.
- Field allowlist, validasi pegawai, validasi koordinat, normalisasi angka, verifikasi baris mutasi, audit log, dan sanitasi error dipertahankan.

### 2.5 Keterbacaan judul card

- Judul card Data ASN/PPPK dan Buku Penjagaan dinaikkan dari ukuran kecil menjadi `text-sm` dengan bobot `font-extrabold`.
- Judul card ringkasan Kendaraan/Alat & Mesin, Dashboard, serta Data Cleansing memakai hierarki tipografi yang sama.
- Ejaan judul tidak lagi dipaksa menjadi huruf kecil oleh komponen bersama.
- Layout tetap mobile-first: dua kolom pada layar kecil dan lima kolom pada desktop untuk ringkasan kondisi.

## 3. Isi paket

- `src/`: source React/TypeScript lengkap.
- `src/lib/assetCondition.ts`: normalisasi, label, validasi, dan scanner kondisi.
- `apps-script/Code.gs`: backend V1.1.11 lengkap.
- `dist/`: build produksi tervalidasi.
- `tests/`: 13 suite pengujian, termasuk regresi V1.1.11.
- `supabase/001...005`: migrasi historis; **tidak perlu dijalankan ulang**.
- `.env.example`: daftar variable frontend tanpa nilai rahasia.
- `RELEASE_NOTES.md` dan `VERIFICATION_REPORT_V1.1.11.md`.

## 4. Persiapan dan backup

Sebelum upgrade:

1. Unduh/commit source V1.1.10 yang sedang live.
2. Catat commit GitHub Pages yang aktif.
3. Pada Apps Script, catat version deployment V1.1.10.
4. Backup tabel minimal `pegawai`, `app_access`, `assets_vehicle`, `assets_equipment`, dan `asset_locations`.
5. Catat nilai kondisi sebelum UAT untuk record uji.
6. Pastikan tidak ada secret yang disalin ke frontend.

V1.1.11 tidak memerlukan perubahan skema. Backup tetap wajib karena UAT melakukan transaksi nyata.

## 5. Instalasi Google AI Studio

1. Gunakan ZIP `SIKANDA_v1.1.11_SECURE_AI_STUDIO_FINAL.zip`.
2. Import ke project SIKANDA.
3. Pastikan file penting terlihat:
   - `package.json` versi `1.1.11`;
   - `src/lib/assetCondition.ts`;
   - `tests/revision-v1111.test.ts`;
   - `apps-script/Code.gs`.
4. Isi variable frontend melalui mekanisme environment AI Studio:
   - `VITE_APPS_SCRIPT_URL`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
5. Jangan memasukkan service-role Supabase atau Gemini key sebagai variable `VITE_*`.
6. Jalankan preview setelah backend baru selesai dideploy.

## 6. Deploy Apps Script

Frontend dan backend harus dinaikkan bersama.

1. Buka project Apps Script Backend SIKANDA.
2. Backup `Code.gs` aktif.
3. Ganti seluruh isinya dengan `apps-script/Code.gs` dari paket V1.1.11.
4. Simpan.
5. Pilih **Deploy → Manage deployments**.
6. Edit deployment Web App lama.
7. Pilih **New version**, lalu **Deploy**.
8. Jangan membuat deployment terpisah bila ingin mempertahankan URL.
9. Buka URL `/exec`. Respons sehat:

```json
{"ok":true,"service":"SIKANDA","version":"1.1.11-secure"}
```

10. Jika URL berubah, perbarui `VITE_APPS_SCRIPT_URL` dan build ulang frontend.

Tidak ada Script Property baru. Jangan menjalankan ulang trigger atau migrasi foto hanya untuk V1.1.11.

## 7. Deploy GitHub Pages

1. Salin seluruh source V1.1.11 ke repository SIKANDA.
2. Pertahankan workflow Pages yang sudah bekerja.
3. Pastikan GitHub Actions Secrets frontend lengkap.
4. Commit dan push.
5. Tunggu job build-and-deploy selesai hijau.
6. Buka URL Pages menggunakan jendela incognito atau lakukan hard refresh `Ctrl+Shift+R`.
7. Pastikan favicon SIKANDA muncul dan tidak ada bundle V1.1.10 tersisa dari cache.

## 8. SQL: tidak ada migrasi baru

V1.1.11 adalah koreksi aplikasi dan backend. Jangan menjalankan migrasi 001–005 ulang.

Query berikut hanya untuk verifikasi baca-saja.

### 8.1 Distribusi kondisi

```sql
select
  'assets_vehicle' as tabel,
  coalesce(nullif(upper(trim(kondisi)), ''), 'BELUM DIISI') as kondisi,
  count(*) as jumlah
from public.assets_vehicle
group by coalesce(nullif(upper(trim(kondisi)), ''), 'BELUM DIISI')

union all

select
  'assets_equipment' as tabel,
  coalesce(nullif(upper(trim(kondisi)), ''), 'BELUM DIISI') as kondisi,
  count(*) as jumlah
from public.assets_equipment
group by coalesce(nullif(upper(trim(kondisi)), ''), 'BELUM DIISI')

order by tabel, kondisi;
```

### 8.2 Perubahan terakhir Kendaraan

```sql
select asset_id, no_polisi, pengguna, kondisi, updated_at
from public.assets_vehicle
order by updated_at desc nulls last
limit 20;
```

### 8.3 Perubahan terakhir Alat & Mesin

```sql
select asset_id, nama_aset, pengguna, kondisi, updated_at
from public.assets_equipment
order by updated_at desc nulls last
limit 20;
```

### 8.4 Status RLS

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('pegawai','app_access','assets_vehicle','assets_equipment','asset_locations')
order by tablename;
```

Kelima baris harus bernilai `true`.

### 8.5 Grant role aplikasi

```sql
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('pegawai','app_access','assets_vehicle','assets_equipment','asset_locations')
  and grantee in ('anon','authenticated','service_role')
order by table_name, grantee, privilege_type;
```

Hasil capture menunjukkan 35 grant dan seluruhnya hanya untuk `service_role`: `DELETE`, `INSERT`, `REFERENCES`, `SELECT`, `TRIGGER`, `TRUNCATE`, dan `UPDATE` pada lima tabel inti. Tidak tampak grant tabel langsung untuk `anon` atau `authenticated`.

Interpretasinya:

- **Positif:** browser tidak diberi akses tabel langsung; arsitektur tetap `Frontend → Apps Script → Supabase`.
- **RLS aktif:** capture terpisah menunjukkan `rowsecurity = true` pada kelima tabel.
- **Batas penting:** `service_role` melewati RLS dan mempunyai hak sangat luas. Karena itu kekuatan keamanan utama berada pada verifikasi Firebase token, RBAC, allowlist action/field, dan validasi di Apps Script.
- **Wajib:** `SUPABASE_SERVICE_ROLE_KEY` hanya boleh berada di Apps Script Script Properties. Jangan pernah menaruhnya pada `VITE_*`, source, ZIP, repository, browser, screenshot, atau log.
- **Jangan mencabut grant secara coba-coba di production:** perubahan privilege dapat memutus CRUD. Jika kelak ingin dedicated least-privilege role, desain dan uji sebagai proyek keamanan terpisah di staging.

Kesimpulan capture: konfigurasi grant konsisten dengan desain SIKANDA dan tidak memerlukan SQL baru untuk V1.1.11, tetapi tidak membuktikan keamanan sendirian; kontrol Apps Script dan kerahasiaan key tetap wajib.

## 9. UAT wajib

Gunakan akun admin/pimpinan dan record uji yang dapat dilacak.

### 9.1 Tampilan data lama

1. Buka Data Kendaraan.
2. Pastikan lima card tampil sekaligus: Total Kendaraan 139, Kondisi Baik 6, Kurang Baik 0, Rusak Ringan 0, dan Rusak Berat 0.
3. Pastikan banner kualitas data menunjukkan 133 kendaraan belum memiliki kondisi.
4. Buka Alat & Mesin.
5. Pastikan lima card tampil sekaligus: Total Alat & Mesin 40, Kondisi Baik 2, Kurang Baik 0, Rusak Ringan 0, dan Rusak Berat 0.
6. Pastikan banner kualitas data menunjukkan 38 alat & mesin belum memiliki kondisi.
7. Klik setiap card; tabel harus mengikuti kondisi yang dipilih, termasuk tampilan kosong untuk status bernilai nol.
8. Klik banner kondisi belum diisi; tabel harus menampilkan jumlah record yang sama dengan banner.

### 9.2 Edit tanpa mengubah kondisi

1. Pilih satu record legacy tanpa kondisi.
2. Catat `asset_id`, pengguna, kondisi, dan `updated_at`.
3. Ubah hanya Pengguna atau field non-kondisi.
4. Simpan.
5. Pastikan toast berhasil.
6. Jalankan query perubahan terakhir.
7. Pengguna harus berubah; kondisi harus tetap `NULL`/kosong.

Ini membuktikan perbaikan CRUD tidak lagi menyisipkan BAIK.

### 9.3 Perbaikan melalui Data Cleansing

1. Buka Data Cleansing.
2. Temukan bagian **Kondisi Aset Belum Diisi**.
3. Klik **Perbaiki** pada record uji.
4. Pastikan modal record yang benar terbuka.
5. Pilih kondisi setelah pemeriksaan fisik.
6. Simpan dan klik Sinkronisasi.
7. Pastikan hanya record tersebut keluar dari daftar BELUM DIISI.

### 9.4 Tambah data

Untuk Kendaraan dan Alat & Mesin:

1. Klik Tambah Data.
2. Isi field wajib tetapi biarkan Kondisi kosong.
3. Simpan harus ditolak.
4. Pilih kondisi resmi.
5. Koordinat boleh dikosongkan.
6. Simpan harus berhasil.
7. Konfirmasi record baru muncul di Supabase dan `updated_at` terisi.
8. Hapus/nonaktifkan record uji melalui aplikasi setelah verifikasi.

### 9.5 Koordinat, minimap, laporan, dan peta

1. Edit record dengan koordinat: nilai lama dan minimap harus tampil otomatis.
2. Edit record tanpa koordinat: penyimpanan tetap berhasil.
3. Pada Laporan, pilih BELUM DIISI lalu cek preview/print/CSV.
4. Pada Peta Sebaran, titik tanpa kondisi harus memakai badge BELUM DIISI.
5. Uji desktop, tablet, serta mobile portrait/landscape.

### 9.6 Hak akses

- Admin/pimpinan dapat membuka dan menyimpan perbaikan aset.
- Pegawai tanpa `asset.write` tidak mendapat tombol edit/perbaiki.
- Request tanpa token atau role sah harus ditolak backend.

## 10. Jawaban tentang penyimpanan Supabase

Ya. Penambahan Kendaraan dan Alat & Mesin menulis otomatis ke Supabase, dengan alur:

`Form React → Firebase ID token → Apps Script asset_save → validasi/RBAC → POST Supabase → return=representation → refresh data`.

Tabel tujuan:

- Kendaraan: `public.assets_vehicle`;
- Alat & Mesin: `public.assets_equipment`.

Frontend tidak memegang service-role key. Apps Script hanya mengembalikan sukses bila Supabase mengembalikan baris hasil mutasi. Namun status live tetap harus dibuktikan dengan UAT dan query `updated_at`, karena konfigurasi deployment dapat berbeda dari source paket.

## 11. Evaluasi keamanan production

Source V1.1.11 adalah **production candidate** dengan kontrol berikut:

- Firebase Authentication;
- Apps Script memvalidasi ID token;
- role dibaca dari `app_access`, bukan dipercaya dari browser;
- mutasi generik database dinonaktifkan;
- field allowlist dan validasi server;
- service-role/Gemini key hanya di Script Properties;
- RLS aktif pada tabel inti;
- private storage dan signed URL foto;
- audit log untuk mutasi;
- pesan error database disanitasi;
- dependency production tidak memiliki vulnerability yang diketahui saat verifikasi.

SIKANDA baru layak disebut **production-ready pada environment Anda** setelah semua kondisi ini terpenuhi:

- `/exec` menunjukkan `1.1.11-secure`;
- GitHub Pages memuat bundle V1.1.11;
- semua UAT bagian 9 lulus;
- RLS kelima tabel tetap `true`;
- tidak ada grant `anon`/`authenticated` yang tidak direncanakan;
- secret tidak muncul di repository, build, log, atau browser;
- backup dan rollback sudah diuji;
- monitoring log Apps Script/Supabase aktif.

Tidak ada sistem yang dapat dijamin “aman maksimal” hanya dari source atau screenshot. Pernyataan aman harus mencakup konfigurasi live, identitas, secret, deployment, log, backup, dan pengujian transaksi.

## 12. Rollback

Jika terjadi masalah:

1. Pada GitHub Pages, redeploy commit V1.1.10 yang sebelumnya aktif.
2. Pada Apps Script, edit deployment dan pilih version V1.1.10 yang dicatat saat backup.
3. Lakukan hard refresh.
4. Tidak ada rollback SQL karena V1.1.11 tidak mengubah skema.
5. Jangan membatalkan kondisi yang sudah diverifikasi benar hanya karena rollback aplikasi.
6. Catat record dan `request_id` error untuk investigasi.

## 13. Checklist serah terima

- [ ] ZIP V1.1.11 diimport.
- [ ] Environment frontend lengkap dan tidak mengandung secret backend.
- [ ] Apps Script dideploy sebagai New version pada deployment lama.
- [ ] `/exec` menunjukkan `1.1.11-secure`.
- [ ] GitHub Actions selesai hijau.
- [ ] Lima card kondisi tetap tampil dengan tema, urutan, dan angka faktual, termasuk nilai nol.
- [ ] Banner BELUM DIISI tampil terpisah dan dapat memfilter record terkait.
- [ ] Judul card ASN/PPPK, Buku Penjagaan, Dashboard, Cleansing, Kendaraan, dan Alat & Mesin terbaca jelas pada desktop serta mobile.
- [ ] Edit Pengguna pada record legacy berhasil tanpa mengubah kondisi.
- [ ] Tambah tanpa kondisi ditolak.
- [ ] Tambah dengan kondisi tersimpan di Supabase.
- [ ] Tombol Perbaiki Data Cleansing membuka record yang benar.
- [ ] Peta, laporan, CSV, minimap, favicon, dan layout mobile lulus.
- [ ] RLS, grant, secret, backup, log, dan rollback diverifikasi.

Setelah seluruh checklist ditandatangani, V1.1.11 dapat dipromosikan dari production candidate menjadi release production pada environment SIKANDA.
