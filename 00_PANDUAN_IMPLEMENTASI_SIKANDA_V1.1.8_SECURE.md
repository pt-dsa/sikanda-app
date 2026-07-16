# PANDUAN IMPLEMENTASI SIKANDA V1.1.8 SECURE

Dokumen ini adalah **satu-satunya panduan implementasi yang berlaku** untuk paket:

```text
SIKANDA_v1.1.8_SECURE_AI_STUDIO_FINAL.zip
```

Baseline: SIKANDA V1.1.7 Secure  
Target: SIKANDA V1.1.8 Secure  
Timezone operasional: `Asia/Jakarta`

---

## 1. Ringkasan Revisi V1.1.8

V1.1.8 menyelesaikan revisi berikut tanpa mengubah arsitektur keamanan V1.1.7:

1. Istilah teknis **FUZZY** pada antarmuka diganti menjadi **Perlu Verifikasi**.
2. Badge **Perlu Verifikasi** pada Data ASN/PPPK dapat diklik oleh Administrator/Pimpinan dan langsung membuka item koreksi pegawai–aset yang sesuai pada Data Cleansing.
3. Update nama pengguna aset dari Data Cleansing diperketat: backend memastikan baris Supabase benar-benar ditemukan dan berubah sebelum menampilkan status berhasil.
4. CRUD Data Kendaraan dan Alat & Mesin diperbaiki untuk mengenali `asset_id` maupun ID legacy.
5. Koordinat lama dibaca dari kolom aktif maupun fallback `asset_locations`.
6. Latitude/longitude bersifat opsional. Data baru maupun data lama tanpa koordinat tetap dapat disimpan.
7. Koordinat yang tersedia otomatis tampil pada form edit beserta minimap.
8. Koordinat parsial atau di luar rentang tetap ditolak dengan satu pesan yang jelas.
9. Toast error identik tidak lagi menumpuk saat tombol Simpan ditekan berulang.
10. Backend memverifikasi hasil create/update/delete untuk pegawai, kendaraan, alat & mesin, akun, konfigurasi, serta foto.
11. Subtitle Card PPPK (Penuh Waktu) menjadi **Pegawai Pemerintah Penuh Waktu**.
12. Favicon/logo SIKANDA ditambahkan untuk tab browser dan Apple Touch Icon.

---

## 2. Arsitektur yang Dipertahankan

- Frontend: React, TypeScript, Vite.
- Login: Firebase Authentication.
- Secure API: Google Apps Script Web App.
- Database: Supabase PostgreSQL melalui Apps Script.
- Foto pegawai baru: private Supabase Storage bucket `pegawai-photos`.
- Foto aset: mekanisme V1.1.7 tetap dipertahankan.
- Tanya SIKANDA: database-first; Gemini hanya menyusun bahasa bila diperlukan.
- RBAC: ditegakkan pada UI dan backend.
- Supabase service role: hanya di Apps Script Properties, tidak pernah di frontend.

V1.1.8 **tidak** memindahkan secret, tidak membuka RLS, dan tidak menambahkan service role ke browser.

---

## 3. Persiapan Sebelum Implementasi

Lakukan empat pemeriksaan berikut:

1. Pastikan versi yang sedang berjalan adalah V1.1.7.
2. Simpan salinan source V1.1.7 dan `Code.gs` yang sedang aktif sebagai rollback.
3. Buat backup Supabase sebelum deployment produksi.
4. Pastikan Anda memiliki akses ke:
   - project Google AI Studio SIKANDA;
   - project Apps Script Backend SIKANDA;
   - repository GitHub deployment SIKANDA;
   - Firebase dan Supabase untuk pemeriksaan bila diperlukan.

Jangan mengubah nilai secret yang sudah berfungsi.

---

## 4. Tahap A — Upload ZIP ke Google AI Studio

Tahap ini **wajib**. Mengubah Apps Script atau GitHub saja tidak akan memperbarui source yang sedang dikembangkan di AI Studio.

1. Unduh `SIKANDA_v1.1.8_SECURE_AI_STUDIO_FINAL.zip`.
2. Buka project SIKANDA yang sudah ada di Google AI Studio.
3. Gunakan fitur import/upload project.
4. Pilih file ZIP V1.1.8 tersebut.
5. Pastikan source V1.1.7 digantikan oleh isi V1.1.8, bukan dibuat sebagai potongan kode terpisah.
6. Periksa file berikut setelah import:
   - `package.json` menunjukkan versi `1.1.8`;
   - `src/lib/coordinates.ts` tersedia;
   - `src/components/ui/AssetMediaFields.tsx` memuat minimap;
   - `apps-script/Code.gs` menampilkan versi `1.1.8-secure` pada `doGet()`;
   - `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.8_SECURE.md` tersedia.
7. Jalankan preview AI Studio.
8. Login dengan akun Administrator/Pimpinan untuk pemeriksaan CRUD.

### Environment frontend

Nilai berikut tetap menggunakan konfigurasi V1.1.7:

```text
VITE_APPS_SCRIPT_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

Tidak ada environment frontend baru pada V1.1.8.

---

## 5. Tahap B — Update Backend Google Apps Script

Tahap ini **wajib**, karena perbaikan verifikasi update, koordinat, dan CRUD berada di backend.

1. Dari paket V1.1.8, buka:

   ```text
   apps-script/Code.gs
   ```

2. Buka project **Backend SIKANDA** di Apps Script.
3. Pilih seluruh isi `Code.gs` lama.
4. Ganti seluruhnya dengan isi `apps-script/Code.gs` V1.1.8.
5. Simpan project.
6. Pastikan tidak ada error sintaks di editor.
7. Pilih **Deploy → Manage deployments**.
8. Edit deployment Web App yang sedang digunakan.
9. Pada **Version**, pilih **New version**.
10. Pastikan konfigurasi deployment tetap:
    - Execute as: pemilik/backend SIKANDA;
    - akses Web App: sama dengan deployment V1.1.7 yang sudah berfungsi.
11. Klik **Deploy**.
12. Jangan membuat backend baru jika deployment lama masih tersedia. Mengedit deployment yang sama mempertahankan URL Web App.
13. Bila URL Web App berubah, perbarui `VITE_APPS_SCRIPT_URL` pada AI Studio dan GitHub Actions Secret.

### Script Properties

Pertahankan nilai V1.1.7 berikut:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
FIREBASE_API_KEY
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_FALLBACK_MODELS
BOOTSTRAP_ADMIN_EMAIL
DRIVE_FOLDER_NAME
SUPABASE_PHOTO_BUCKET=pegawai-photos
PHOTO_SIGNED_URL_SECONDS=3600
```

Tidak ada Script Property baru pada V1.1.8.

### Fungsi yang tidak perlu dijalankan ulang

Untuk update V1.1.8, **jangan** menjalankan ulang:

```javascript
migrasiSemuaFotoPegawaiKeSupabase()
lanjutkanMigrasiFotoPegawai()
pasangTriggerSikandaV117()
```

Fungsi tersebut hanya digunakan sesuai kebutuhan implementasi V1.1.7. V1.1.8 tidak mengubah migrasi foto atau jadwal trigger.

---

## 6. Tahap C — Supabase

### Tidak ada migrasi SQL baru

V1.1.8 tidak menambah tabel atau kolom wajib. Karena itu:

- tidak ada file `006_*.sql` yang harus dijalankan;
- jangan mengulang migrasi `001` sampai `005` hanya untuk memasang V1.1.8;
- jangan menghapus data koordinat lama;
- jangan mengubah bucket `pegawai-photos` menjadi public.

Backend V1.1.8 mendeteksi nama kolom koordinat aktif dan mendukung fallback berikut:

```text
latitude / longitude
lat / lng
gps_latitude / gps_longitude
location_latitude / location_longitude
asset_locations
```

### Query pemeriksaan opsional (read-only)

Jalankan hanya bila koordinat lama tetap tidak muncul setelah frontend dan backend V1.1.8 aktif:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('assets_vehicle', 'assets_equipment', 'asset_locations')
  and column_name in (
    'asset_id', 'id', 'id_aset',
    'latitude', 'longitude', 'lat', 'lng', 'lon',
    'gps_latitude', 'gps_longitude',
    'location_latitude', 'location_longitude'
  )
order by table_name, ordinal_position;
```

Query tersebut tidak mengubah data.

---

## 7. Tahap D — Deployment GitHub Pages

1. Ekstrak ZIP V1.1.8 pada komputer.
2. Salin seluruh source V1.1.8 ke repository SIKANDA.
3. Pastikan file `.env` lokal, service role, Gemini key, atau secret lain tidak ikut di-commit.
4. Pastikan GitHub Actions Secrets V1.1.7 tetap tersedia.
5. Commit perubahan dengan pesan yang jelas, misalnya:

   ```text
   release: SIKANDA v1.1.8 secure CRUD and coordinate fixes
   ```

6. Push ke branch deployment yang digunakan repository.
7. Buka tab **Actions** di GitHub.
8. Pastikan workflow menyelesaikan:
   - `npm ci`;
   - `npx tsc --noEmit`;
   - `npm run build`;
   - deployment GitHub Pages.
9. Buka URL SIKANDA setelah workflow hijau.

Konfigurasi Vite otomatis membentuk base path repository saat GitHub Actions berjalan. Favicon menggunakan aset yang diproses Vite sehingga tidak bergantung pada path absolut repository.

---

## 8. Validasi Fungsional Wajib

Gunakan akun Administrator/Pimpinan untuk pengujian A–F. Gunakan data uji yang aman atau record yang memang perlu diperbaiki.

### A. Perlu Verifikasi

1. Buka **Data ASN/PPPK**.
2. Klik Card **Perlu Verifikasi**.
3. Buka pegawai yang memiliki badge **Perlu Verifikasi**.
4. Klik badge tersebut.
5. Sistem harus membuka **Data Cleansing** dan langsung menuju bagian kecocokan pegawai–aset untuk NIP terkait.
6. Periksa nama pengguna aset lama dan nama baku Database Pegawai.
7. Klik **Terapkan** hanya jika keduanya benar-benar orang yang sama.
8. Kembali ke Data ASN/PPPK dan klik **Sinkronisasi**.
9. Badge harus hilang setelah seluruh ketidaksesuaian pegawai tersebut terselesaikan.

### B. Update Kendaraan dengan koordinat lama

1. Buka **Data Kendaraan**.
2. Pilih kendaraan yang sudah memiliki titik pada Peta Sebaran.
3. Klik **Edit**.
4. Latitude dan longitude harus langsung terisi.
5. Minimap dan marker harus tampil pada form.
6. Ubah satu field non-koordinat, misalnya kilometer.
7. Klik **Simpan**.
8. Update harus berhasil dan koordinat lama tetap tersedia.

### C. Update Kendaraan tanpa koordinat

1. Buka kendaraan yang tidak memiliki koordinat.
2. Klik **Edit**.
3. Biarkan latitude dan longitude kosong.
4. Ubah field yang diperlukan.
5. Klik **Simpan**.
6. Sistem harus menyimpan tanpa meminta koordinat.

### D. Alat & Mesin

Ulangi skenario B dan C pada **Alat & Mesin**. Pastikan foto lama tetap tampil dan tidak perlu dipilih ulang saat update.

### E. Validasi koordinat

1. Isi latitude saja: sistem harus menolak dan menjelaskan bahwa pasangan koordinat belum lengkap.
2. Isi longitude saja: hasil harus sama.
3. Isi latitude `-6,300000` dan longitude `106,700000`: sistem harus menerima desimal koma dan menormalkannya.
4. Isi latitude `-91`: sistem harus menolak karena di luar rentang.
5. Setelah error, tekan Simpan berulang: hanya satu toast identik yang boleh tampil.

### F. Dashboard dan favicon

1. Buka Dashboard.
2. Card **PPPK (Penuh Waktu)** harus menampilkan subtitle **Pegawai Pemerintah Penuh Waktu**.
3. Periksa tab browser: logo SIKANDA/Kota Tangerang Selatan harus tampil, bukan ikon globe default.
4. Jika favicon lama masih tersimpan, lakukan:
   - Windows/Linux: `Ctrl + F5`;
   - macOS: `Cmd + Shift + R`;
   - bila perlu, tutup tab lama lalu buka URL pada tab baru/incognito.

---

## 9. Matriks Audit CRUD V1.1.8

| Modul | Create | Read | Update | Delete/Nonaktif | Pengamanan utama |
|---|---:|---:|---:|---:|---|
| Data ASN/PPPK | Ya | Ya | Ya | Soft delete | NIP, RBAC field, tanggal, kontak, hasil update |
| Kendaraan | Ya | Ya | Ya | Soft delete | ID aktif/legacy, pegawai resmi, koordinat opsional, hasil update |
| Alat & Mesin | Ya | Ya | Ya | Soft delete | ID aktif/legacy, pegawai resmi, koordinat opsional, hasil update |
| Data Cleansing | Koreksi | Ya | Ya | Tidak | Manager-only, item individual, verifikasi baris Supabase |
| Kelola Akun | Ya | Ya | Ya | Nonaktif | Manager-only, email/NIP/role, anti self-deactivate |
| Buku Penjagaan | Konfigurasi | Ya | Ya | Tidak | Manager-only, rentang nilai backend |
| Foto pegawai | Upload | Signed URL | Ganti | Objek lama dibersihkan | Bucket private, MIME/ukuran, NIP/RBAC |
| Foto aset | Upload | URL/fallback | Ganti | Mengikuti aset | Manager-only, MIME/ukuran, asset ID |

Menu Inventaris, Pagu Anggaran, Pemeliharaan Kendaraan, dan Peminjaman tetap mengikuti status pengembangan V2 pada baseline; V1.1.8 tidak mengaktifkan CRUD semu untuk menu tersebut.

---

## 10. Troubleshooting

### A. Update masih menampilkan backend lama

Penyebab paling umum: `Code.gs` sudah disimpan tetapi deployment Web App belum dibuat sebagai **New version**.

Solusi:

1. Apps Script → Deploy → Manage deployments.
2. Edit deployment aktif.
3. Pilih New version.
4. Deploy ulang.

### B. Update mengatakan data tidak ditemukan

1. Klik Sinkronisasi pada menu terkait.
2. Pastikan record belum dinonaktifkan atau dihapus oleh pengguna lain.
3. Periksa `asset_id` pada tabel Supabase.
4. Jangan mengubah Asset ID dari form edit.

V1.1.8 sengaja menolak false-success ketika Supabase mengembalikan nol baris.

### C. Minimap tidak tampil

1. Pastikan kedua koordinat terisi dan berada dalam rentang valid.
2. Pastikan koneksi browser dapat memuat OpenStreetMap.
3. Periksa apakah koordinat lama tersimpan pada tabel aset atau `asset_locations` menggunakan query read-only pada Bab 6.

### D. Favicon belum berubah

Favicon sangat agresif disimpan oleh browser. Lakukan hard refresh, tutup tab lama, atau uji incognito. Pastikan deployment terbaru sudah selesai dan `dist/index.html` mengarah ke `logo_kota_tangerang_selatan`.

### E. Badge Perlu Verifikasi tidak dapat diklik

- Administrator/Pimpinan: harus dapat diklik.
- Pegawai: tampil sebagai informasi, tetapi tidak menjadi tautan karena Pegawai tidak memiliki akses ke Data Cleansing.

---

## 11. Rollback

Jika ditemukan kendala live:

1. Frontend: redeploy commit/source V1.1.7 terakhir yang stabil.
2. Apps Script: Deploy → Manage deployments → pilih versi deployment V1.1.7 sebelumnya.
3. Tidak diperlukan rollback SQL karena V1.1.8 tidak menjalankan migrasi database.
4. Jangan menghapus data yang tersimpan selama pengujian; gunakan audit log untuk menelusuri perubahan.

---

## 12. Checklist Akhir

- [ ] ZIP V1.1.8 sudah di-upload/import ke Google AI Studio.
- [ ] Preview AI Studio menggunakan source V1.1.8.
- [ ] `apps-script/Code.gs` sudah diganti penuh.
- [ ] Apps Script sudah di-deploy sebagai New version.
- [ ] Tidak ada secret yang dipindahkan ke frontend/GitHub public.
- [ ] GitHub Actions berhasil.
- [ ] Badge Perlu Verifikasi membuka NIP yang tepat.
- [ ] Koreksi Data Cleansing berhasil dan terverifikasi.
- [ ] Kendaraan dengan koordinat menampilkan minimap.
- [ ] Kendaraan tanpa koordinat dapat disimpan.
- [ ] Alat & Mesin dengan/tanpa koordinat dapat disimpan.
- [ ] CRUD Data ASN/PPPK dan Kelola Akun berhasil.
- [ ] Subtitle PPPK sudah berubah.
- [ ] Favicon tampil setelah hard refresh.
- [ ] Akun Pegawai tetap tidak dapat mengakses Data Cleansing/Kelola Akun/Rekap Laporan.

Implementasi dinyatakan selesai setelah seluruh checklist sesuai environment live.
