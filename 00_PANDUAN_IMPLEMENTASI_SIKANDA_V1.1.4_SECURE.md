# Panduan Implementasi SIKANDA V1.1.4 Secure

Panduan ini adalah sumber utama untuk upgrade dari **SIKANDA V1.1.3 Secure** ke **V1.1.4 Secure**. Gunakan seluruh file dari paket yang sama. Jangan mencampurkan frontend, `Code.gs`, atau panduan dari rilis berbeda.

## 1. Ringkasan keputusan implementasi

- Upgrade V1.1.3 → V1.1.4 **tidak membutuhkan SQL baru**. Struktur `pegawai`, `assets_vehicle`, dan `assets_equipment` yang sudah dipasang pada V1.1.3 telah memuat field yang diperlukan.
- Backend `apps-script/Code.gs` wajib diganti seluruhnya dan dibuatkan **New version** deployment.
- Seluruh source frontend V1.1.4 wajib di-upload/replace ke Google AI Studio dan GitHub. Mengubah Secrets saja tidak mengubah UI.
- Foto pegawai, kendaraan, serta alat dan mesin tetap disimpan melalui backend ke Google Drive.
- Jangan memasukkan Supabase service-role key atau Gemini backend key ke source frontend/GitHub.

Urutan upgrade yang benar:

1. Backup Supabase, Apps Script, project AI Studio, dan repository GitHub.
2. Ganti seluruh isi `Code.gs` dengan `apps-script/Code.gs` V1.1.4.
3. Buat New version deployment Apps Script dan salin URL `/exec`.
4. Perbarui `VITE_APPS_SCRIPT_URL` hanya bila URL berubah.
5. Upload/replace seluruh source V1.1.4 di Google AI Studio, klik **Apply changes**, uji Preview, lalu **Publish**.
6. Push source yang sama ke GitHub `main` dan tunggu GitHub Actions selesai hijau.
7. Lakukan validasi pada Bagian 9.

## 2. Isi revisi V1.1.4

### Dashboard dan Buku Penjagaan

- Dashboard selalu mengambil ulang data saat pertama dibuka dan menyediakan tombol **Sinkronisasi Data**.
- Cache aplikasi dibersihkan sebelum sinkronisasi agar angka lama tidak digunakan.
- Total Pegawai, ASN, PPPK Penuh Waktu, dan PPPK Paruh Waktu dihitung dari pegawai aktif yang sama.
- Urutan golongan mendukung golongan ASN dan golongan PPPK sampai XVII.
- Card Komposisi SDM dibuat seimbang, responsif, dan tidak meninggalkan ruang kosong yang tidak proporsional.
- Judul bagian/card dibuat tebal.
- Istilah pengguna **Terlambat** diganti menjadi **Terlewat**.

### Relasi pegawai, GPS, dan foto aset

- Pengguna dan Penanggung Jawab kendaraan/alat-mesin wajib dipilih dari suggestion Database Pegawai.
- Backend memvalidasi ulang nama resmi sehingga manipulasi frontend tidak dapat menyimpan nama bebas.
- Modal tambah otomatis mencoba mengambil GPS; tombol **Ambil Lokasi GPS** tersedia untuk mencoba ulang.
- Latitude/longitude dapat dikoreksi manual dan divalidasi berpasangan.
- Foto dapat berasal dari kamera atau galeri, maksimum 5 MB, format JPEG/PNG/WebP, dan memiliki preview.
- Foto kendaraan dan alat/mesin disimpan ke subfolder Google Drive dan referensinya disimpan pada record aset.

### Notifikasi dan akun

- Seluruh operasi aktif tambah/ubah/hapus menampilkan popup sukses atau gagal setelah backend mengonfirmasi transaksi.
- Badge lonceng sama dengan jumlah item yang benar-benar ditampilkan: agenda terlewat, agenda enam bulan, dan ulang tahun.
- Ulang tahun mencakup **hari ini sampai tujuh hari mendatang**, inklusif dan tanpa duplikasi.
- Tambah Akun menampilkan NIP, Nama, Status, dan **Jabatan Pegawai**.

### Rekap Laporan dan cetak

- Rekap Laporan menambahkan Data Alat & Mesin beserta filter dan CSV.
- Cetak Halaman meminta kategori: Data ASN/PPPK, Buku Penjagaan, Data Kendaraan, Data Alat & Mesin, atau Seluruh Data.
- Modal cetak menampilkan jumlah record dan filter aktif sebelum print preview.
- KOP memakai susunan horizontal: logo tepat di sebelah kiri teks instansi.
- Tabel cetak memakai kolom terpilih, header berulang, zebra rows, fixed layout, A4 landscape, dan page break yang aman.

### Tanya SIKANDA

- Database-first diperluas untuk agenda pangkat/KGB/BUP, ulang tahun, komposisi pegawai, status ASN/PPPK, masa kerja, profil pegawai, kendaraan, kondisi/pengguna aset, alat dan mesin, serta ringkasan sistem.
- Pertanyaan faktual tetap dapat dijawab ketika Gemini tidak tersedia.
- Persona dibuat lebih natural dan tidak menampilkan pesan konfigurasi teknis kepada pengguna.
- Hak akses tetap diterapkan backend: pegawai hanya menerima konteks profil/aset miliknya.

## 3. Arsitektur dan keamanan

| Lapisan | Teknologi | Ketentuan |
|---|---|---|
| Frontend | React, Vite, TypeScript | Hanya konfigurasi publik `VITE_*` |
| Login | Firebase Authentication | Identitas Google/Firebase |
| Otorisasi | Apps Script RBAC | Role dan NIP diverifikasi server-side |
| Database | Supabase PostgreSQL | Service-role hanya di Script Properties |
| Foto | Google Drive | Upload melalui endpoint khusus yang tervalidasi |
| Tanya SIKANDA | Database-first + Gemini | Key Gemini hanya di Script Properties |
| Deploy | AI Studio + GitHub Pages | HTTPS wajib untuk GPS/kamera |

## 4. Backup dan Supabase

Backup minimal tabel: `pegawai`, `assets_vehicle`, `assets_equipment`, `app_access`, `system_config`, `notification_logs`, dan `audit_logs`.

Untuk upgrade dari V1.1.3, **jangan menjalankan SQL baru** karena rilis ini tidak mengubah skema. File SQL `001`, `002`, dan `003` tetap disertakan untuk instalasi bersih/riwayat migrasi.

Validasi data pegawai aktif dijalankan sebagai satu query berikut:

```sql
select status, kategori_pppk, count(*)
from public.pegawai
where is_active = true
group by status, kategori_pppk
order by status, kategori_pppk;
```

Berdasarkan capture validasi tanggal 12 Juli 2026, baseline yang harus muncul sebelum ada perubahan data baru adalah:

- ASN: 44 pegawai.
- PPPK Penuh Waktu: 6 pegawai.
- PPPK Paruh Waktu: 0 pegawai.
- Total aktif: 50 pegawai.

Jika hasil query telah berubah karena ada CRUD setelah tanggal tersebut, Dashboard harus mengikuti hasil terbaru, bukan angka baseline lama.

Validasi kolom aset:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('assets_vehicle', 'assets_equipment')
  and column_name in ('pengguna', 'penanggung_jawab', 'foto', 'latitude', 'longitude')
order by table_name, ordinal_position;
```

## 5. Backend Google Apps Script

1. Buka project **Backend SIKANDA**.
2. Buka `Code.gs`.
3. Pilih seluruh isi lama lalu ganti dengan seluruh isi `apps-script/Code.gs` V1.1.4.
4. Klik Save.
5. Pastikan Script Properties berikut tetap tersedia:

| Key | Keterangan |
|---|---|
| `SUPABASE_URL` | URL Supabase |
| `SUPABASE_ANON_KEY` | Anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Rahasia; hanya Apps Script |
| `FIREBASE_API_KEY` | Firebase Web API key |
| `GEMINI_API_KEY` | Key Gemini backend |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `GEMINI_FALLBACK_MODELS` | `gemini-2.5-flash-lite` |
| `BOOTSTRAP_ADMIN_EMAIL` | Email administrator pemulihan |
| `DRIVE_FOLDER_NAME` | Folder induk foto, contoh `SIKANDA_Foto_Pegawai` |

Tidak ada Script Property baru pada V1.1.4.

Fungsi yang aman dijalankan manual untuk pemeriksaan AI:

```text
ujiKonfigurasiTanyaSikanda
```

Jangan menjalankan `kirimNotifikasiBukuPenjagaan` sebagai uji coba karena fungsi tersebut dapat mengirim email nyata.

### Deploy backend

1. Klik **Deploy → Manage deployments**.
2. Klik Edit pada Web App aktif.
3. Pilih **New version**.
4. Execute as: **Me**.
5. Who has access: **Anyone**.
6. Setujui permintaan otorisasi Google Drive bila muncul.
7. Klik Deploy dan salin URL `/exec`.
8. Buka URL tersebut. Respons sehat memuat:

```json
{"ok":true,"service":"SIKANDA","version":"1.1.4-secure"}
```

## 6. Google AI Studio

1. Buat checkpoint project V1.1.3.
2. Upload/import ZIP V1.1.4 atau replace seluruh file source dengan isi ZIP.
3. Pastikan `metadata.json` memuat izin `camera` dan `geolocation`.
4. Pastikan `VITE_APPS_SCRIPT_URL` memakai URL `/exec` terbaru.
5. Klik **Apply changes**.
6. Buka Preview dan izinkan kamera/lokasi ketika browser meminta.
7. Uji seluruh checklist Bagian 9.
8. Klik **Publish**.

Jika izin kamera/GPS pernah ditolak, klik ikon pengaturan situs di address bar browser, ubah Camera dan Location menjadi Allow, lalu refresh Preview.

## 7. GitHub Pages dan Firebase

Push seluruh source V1.1.4, kecuali `node_modules`, `dist`, `.test-dist`, dan file secret. Repository Secrets minimal:

- `VITE_APPS_SCRIPT_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Pastikan domain GitHub Pages dan domain publik AI Studio terdaftar pada Firebase Authentication → Settings → Authorized domains. GPS dan kamera hanya bekerja pada HTTPS atau localhost.

## 8. Pemeriksaan lokal

Jalankan perintah berikut satu per satu:

```bash
npm ci
```

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

```bash
npm audit --omit=dev --audit-level=high
```

## 9. Checklist validasi wajib

1. URL Apps Script menampilkan `1.1.4-secure`.
2. Login Administrator/Pimpinan/Pegawai sesuai kewenangan.
3. Klik Dashboard → Sinkronisasi Data; angka mengikuti query pegawai aktif terbaru.
4. Card Komposisi SDM seimbang pada desktop dan mobile; golongan berurutan.
5. Dashboard dan Buku Penjagaan memakai istilah **Terlewat**.
6. Tambah dan edit Pegawai menampilkan popup sukses/gagal.
7. Tambah Akun menampilkan Jabatan Pegawai setelah suggestion dipilih.
8. Tambah Kendaraan: Pengguna dan Penanggung Jawab dipilih dari suggestion.
9. Tambah Kendaraan: GPS terisi otomatis; tombol GPS dapat mencoba ulang.
10. Tambah Kendaraan: kamera dan galeri dapat dipilih, preview muncul, foto tersimpan.
11. Ulangi poin 8–10 pada Alat & Mesin.
12. Uji koordinat ditolak browser; aplikasi menampilkan pesan dan tetap menyediakan input manual.
13. Lonceng menampilkan agenda dan ulang tahun hari ini–7 hari; badge sama dengan total item panel.
14. Rekap Laporan menampilkan empat card data.
15. Dropdown Cetak memuat lima pilihan dan menampilkan jumlah/filter sebelum cetak.
16. Print preview: logo berada di kiri teks KOP, tabel rapi, header berulang, tanpa teks pecah per huruf.
17. Nonaktifkan browser option **Headers and footers** bila URL/tanggal bawaan browser masih terlihat.
18. Tanya SIKANDA menjawab “Adakah pegawai yang naik pangkat dalam waktu dekat?” dari database.
19. Tanya SIKANDA menjawab komposisi pegawai, ulang tahun, kendaraan rusak, dan daftar alat/mesin tanpa pesan konfigurasi teknis.
20. GitHub Actions selesai hijau dan halaman GitHub dapat di-hard-refresh tanpa 404.

## 10. Rollback

1. Kembalikan checkpoint/source V1.1.3 pada AI Studio atau commit GitHub sebelumnya.
2. Arahkan `VITE_APPS_SCRIPT_URL` ke deployment backend V1.1.3 bila diperlukan.
3. Tidak ada rollback SQL karena V1.1.4 tidak mengubah skema.
4. Jangan menghapus deployment lama sampai seluruh validasi V1.1.4 selesai.

## 11. Indikator selesai

Upgrade dinyatakan selesai setelah backend melaporkan `1.1.4-secure`, source V1.1.4 sudah dipublish pada AI Studio dan GitHub, seluruh build/test hijau, Dashboard mengikuti data aktif terbaru, foto/GPS aset berfungsi, cetak rapi, notifikasi ulang tahun muncul, dan Tanya SIKANDA lulus pengujian faktual.
