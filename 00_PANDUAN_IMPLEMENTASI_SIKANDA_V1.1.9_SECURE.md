# PANDUAN IMPLEMENTASI SIKANDA V1.1.9 SECURE

Dokumen ini adalah **satu-satunya panduan implementasi yang berlaku** untuk paket:

```text
SIKANDA_v1.1.9_SECURE_AI_STUDIO_FINAL.zip
```

Baseline: SIKANDA V1.1.8 Secure  
Target: SIKANDA V1.1.9 Secure  
Timezone: `Asia/Jakarta`

---

## 1. Ringkasan revisi

V1.1.9 menyelesaikan seluruh revisi berikut:

1. Memperbaiki error ketika nama **Pengguna** Alat & Mesin diubah.
2. Menambahkan tombol **Sinkronisasi** pada Kelola Akun, Data Kendaraan, serta Alat & Mesin.
3. Mengubah format waktu menjadi `Kamis,16 Juli 2026 | Pukul 11:27:08 WIB`.
4. Membuat Grafik Distribusi Masa Kerja memenuhi card secara proporsional.
5. Memperkuat mobile-first pada topbar, pencarian, modal aset/pegawai/konfirmasi/laporan, popup peta, action bar, card akun, overflow, dan safe area.
6. Memastikan create Kendaraan/Alat & Mesin menulis ke Supabase melalui backend dan tidak melaporkan berhasil bila tidak ada baris hasil.

Semua perbaikan V1.1.8—Perlu Verifikasi, koordinat opsional/minimap, favicon, subtitle PPPK, RBAC, dan validasi mutasi—tetap dipertahankan.

---

## 2. Akar masalah update Pengguna

Data legacy dapat berisi tanda `-`, string kosong, atau nilai tampilan lain pada field angka. Form V1.1.8 dapat mengirim ulang seluruh record tersebut walaupun pengguna hanya mengubah nama Pengguna. PostgreSQL kemudian menolak nilai seperti `-` atau string kosong pada kolom numeric.

Selain itu, koordinat lama yang tidak berubah dapat ikut ditulis ulang ke `asset_locations` bersama metadata `type`. Sebagian database legacy memiliki constraint/penamaan type berbeda sehingga perubahan Pengguna dapat gagal pada tahap lokasi.

V1.1.9 memperbaiki keduanya:

- frontend membangun payload field-by-field;
- placeholder legacy dianggap kosong;
- angka dinormalisasi;
- backend mengulang validasi;
- koordinat yang sama dilewati;
- update lokasi hanya mengubah latitude/longitude;
- pesan error database diterjemahkan secara aman.

---

## 3. Arsitektur yang dipertahankan

- Frontend: React, TypeScript, Vite.
- Login: Firebase Authentication.
- Secure API: Google Apps Script Web App.
- Database: Supabase PostgreSQL melalui Apps Script.
- Foto pegawai: private Supabase Storage `pegawai-photos`.
- Foto aset: mekanisme/fallback V1.1.8.
- Tanya SIKANDA: database-first.
- RBAC: UI dan backend.
- Supabase service-role/Gemini key: Apps Script Properties, tidak di browser.

Alur create aset:

```text
Form React
  → Firebase ID token
  → Apps Script action asset_save
  → verifikasi app_access dan role
  → validasi/normalisasi payload
  → POST assets_vehicle atau assets_equipment
  → return=representation wajib menghasilkan baris
  → cache frontend dibersihkan
  → data dimuat ulang dari Supabase
```

Foto diproses setelah record utama. Bila foto gagal, record tetap tersimpan dan UI memberi peringatan khusus agar pengguna dapat mengunggah ulang foto tanpa menduplikasi data.

---

## 4. Persiapan

1. Pastikan V1.1.8 yang aktif sudah dibackup.
2. Simpan salinan `Code.gs` dan nomor deployment Apps Script aktif.
3. Backup Supabase sebelum uji produksi.
4. Pastikan akses tersedia ke Google AI Studio, Apps Script, GitHub, Firebase, dan Supabase.
5. Jangan memindahkan atau menyalin secret ke frontend.

---

## 5. Import frontend ke Google AI Studio

1. Gunakan `SIKANDA_v1.1.9_SECURE_AI_STUDIO_FINAL.zip`.
2. Import/upload ZIP ke project SIKANDA yang sama.
3. Pastikan source lama digantikan secara utuh.
4. Verifikasi:
   - `package.json` versi `1.1.9`;
   - `src/lib/assetFields.ts` tersedia;
   - ketiga menu memuat teks Sinkronisasi;
   - `AppShell.tsx` memuat `| Pukul`;
   - `apps-script/Code.gs` memuat `1.1.9-secure`.
5. Pertahankan seluruh environment V1.1.8.
6. Jalankan preview setelah backend V1.1.9 selesai dideploy.

Environment frontend tidak berubah:

```text
VITE_APPS_SCRIPT_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

---

## 6. Deploy Apps Script

Tahap ini **wajib**.

1. Buka `apps-script/Code.gs` dari paket.
2. Ganti penuh `Code.gs` pada Backend SIKANDA.
3. Save.
4. Pilih **Deploy → Manage deployments**.
5. Edit deployment aktif.
6. Pilih **New version**.
7. Deploy tanpa mengubah konfigurasi akses yang sudah berfungsi.
8. Buka URL `/exec` dan pastikan:

```json
{"ok":true,"service":"SIKANDA","version":"1.1.9-secure"}
```

Pertahankan Script Properties V1.1.8. Tidak ada property baru.

Jangan menjalankan ulang:

```javascript
migrasiSemuaFotoPegawaiKeSupabase()
lanjutkanMigrasiFotoPegawai()
pasangTriggerSikandaV117()
```

---

## 7. Supabase

Tidak ada migrasi SQL baru. Jangan mengulang SQL 001–005 hanya untuk V1.1.9.

Create data sudah otomatis menuju:

| Menu | Tabel Supabase |
|---|---|
| Data Kendaraan | `public.assets_vehicle` |
| Alat & Mesin | `public.assets_equipment` |
| Koordinat fallback | `public.asset_locations` |

Backend menggunakan service role hanya pada Apps Script dan memeriksa hasil mutasi. Tombol Simpan tidak dianggap berhasil bila Supabase tidak mengembalikan baris record.

Query read-only opsional untuk memeriksa data uji:

```sql
select asset_id, asset_name, holder_name, updated_at
from public.assets_equipment
order by updated_at desc nulls last
limit 20;

select asset_id, plate_number, holder_name, updated_at
from public.assets_vehicle
order by updated_at desc nulls last
limit 20;
```

Sesuaikan alias kolom hanya bila database Anda memakai nama legacy. Query tersebut tidak mengubah data.

---

## 8. Deploy GitHub Pages

1. Salin seluruh source V1.1.9 ke repository.
2. Pastikan `.env`, service role, Gemini key, dan secret lain tidak ikut commit.
3. Pertahankan GitHub Actions Secrets.
4. Commit dan push ke branch `main`.
5. Pastikan workflow lulus `npm ci`, lint, test, audit, build, dan deploy.
6. Lakukan hard refresh setelah deployment.

---

## 9. Uji penerimaan fungsional

### A. Update Pengguna Alat & Mesin

1. Login sebagai Administrator/Pimpinan.
2. Buka Alat & Mesin.
3. Klik Sinkronisasi.
4. Edit record yang memiliki koordinat.
5. Pilih Pengguna dari suggestion Database Pegawai.
6. Jangan mengubah koordinat.
7. Klik Simpan.
8. Harus muncul sukses, modal tertutup, dan Pengguna baru terlihat setelah reload.
9. Periksa Supabase read-only bila diperlukan.

Ulangi pada record yang harga/tahunnya kosong untuk membuktikan placeholder legacy tidak menghalangi update.

### B. Tambah Alat & Mesin

1. Klik Tambah Data.
2. Isi field wajib.
3. Harga dan koordinat boleh kosong.
4. Pilih Pengguna bila diperlukan.
5. Simpan.
6. Data harus muncul kembali setelah Sinkronisasi dan tersedia di `assets_equipment`.

### C. Tambah Kendaraan

1. Isi Nomor Polisi, Nama Aset, dan Merk/Model.
2. Koordinat boleh kosong.
3. Simpan.
4. Data harus muncul setelah Sinkronisasi dan tersedia di `assets_vehicle`.

### D. Tombol Sinkronisasi

- Kelola Akun: memuat ulang `app_access` dan direktori pegawai; tidak membuat akun baru.
- Tarik dari Database Pegawai: tetap merupakan aksi terpisah untuk membuat akun pegawai yang belum ada.
- Kendaraan/Alat & Mesin: membersihkan cache, memuat ulang aset, lokasi, dan direktori pegawai.

### E. Waktu dan chart

- Header harus tampil seperti `Kamis,16 Juli 2026 | Pukul 11:27:08 WIB`.
- Distribusi Masa Kerja harus memenuhi tinggi card dengan bar lebih tebal dan jarak seimbang.

### F. Mobile-first

Uji minimal pada lebar 320, 360, 390, 430, 768, 1024, dan desktop:

- tidak ada scroll horizontal halaman;
- topbar tidak bertumpuk;
- pencarian manajer berada di baris penuh pada mobile;
- sidebar dapat dibuka/ditutup;
- action bar Sinkronisasi/Tambah dapat ditekan;
- Kelola Akun tampil sebagai card pada mobile;
- modal mengisi tinggi layar, isi dapat di-scroll, footer tetap dapat dijangkau;
- tombol Simpan/Batal cukup besar untuk sentuhan;
- popup Peta Sebaran tidak melewati lebar layar;
- minimap/foto tidak keluar dari lebar viewport;
- orientasi portrait dan landscape tetap rapi.

---

## 10. Production readiness

Source V1.1.9 adalah **production candidate**, bukan jaminan bahwa environment live otomatis aman. Production dinyatakan siap setelah:

- backend `/exec` menunjukkan `1.1.9-secure`;
- seluruh uji penerimaan di atas lulus;
- RLS aktif dan anon/authenticated tidak memiliki akses langsung ke tabel sensitif;
- service-role hanya ada di Apps Script Properties;
- Firebase Authorized Domains sesuai domain produksi;
- akun/role `app_access` diperiksa;
- GitHub Actions hijau;
- backup/rollback tersedia;
- log Apps Script, Supabase, dan notifikasi dipantau setelah rilis.

---

## 11. Troubleshooting

### Pesan masih “Perubahan gagal disimpan”

Kemungkinan backend masih V1.1.8. Periksa `/exec`, kemudian deploy Apps Script sebagai New version.

### Data angka/tahun tidak valid

Klik Sinkronisasi, buka ulang form, kosongkan field angka yang memang belum tersedia atau isi dengan angka valid, lalu Simpan.

### Sinkronisasi tidak mengubah data

Pastikan perubahan memang sudah tersimpan di Supabase dan `VITE_APPS_SCRIPT_URL` menunjuk deployment `/exec` yang benar.

### Data baru tersimpan tetapi foto gagal

Record utama sengaja dipertahankan. Buka Edit, pilih foto ulang, lalu Simpan agar tidak membuat data ganda.

### Mobile masih menampilkan layout lama

Lakukan hard refresh/clear site data setelah GitHub Pages selesai deploy karena CSS dan chunk lama dapat tersimpan di cache browser.

---

## 12. Rollback

1. Redeploy frontend V1.1.8 terakhir yang stabil.
2. Pilih versi deployment Apps Script V1.1.8 sebelumnya.
3. Tidak ada rollback SQL karena V1.1.9 tidak menambah skema.
4. Jangan menghapus record uji tanpa mengikuti prosedur audit organisasi.

---

## 13. Checklist akhir

- [ ] ZIP V1.1.9 diimport ke Google AI Studio.
- [ ] `Code.gs` diganti penuh dan New version dideploy.
- [ ] `/exec` menunjukkan `1.1.9-secure`.
- [ ] GitHub Actions hijau.
- [ ] Update Pengguna Alat & Mesin berhasil.
- [ ] Alat tanpa harga/koordinat dapat ditambah.
- [ ] Kendaraan tanpa koordinat dapat ditambah.
- [ ] Ketiga tombol Sinkronisasi bekerja.
- [ ] Format waktu memakai `| Pukul`.
- [ ] Card Distribusi Masa Kerja proporsional.
- [ ] Mobile 320–768 px dan desktop rapi.
- [ ] RBAC Administrator/Pimpinan/Pegawai sesuai.
- [ ] Tidak ada secret pada frontend/repository.
- [ ] Backup dan rollback siap.

Implementasi selesai setelah checklist live ini lulus.
