# Panduan Implementasi SIKANDA V1.1.6 Secure

Paket ini adalah upgrade dari V1.1.5 Secure. Gunakan seluruh source dari paket yang sama; jangan mencampurkan `Code.gs`, frontend, atau dokumen dari rilis lain.

## Perubahan arsitektur V1.1.6

- Tidak ada SQL/migrasi baru. Struktur database V1.1.5 tetap digunakan.
- `apps-script/Code.gs` menambahkan feed fakta `notification_feed`. Feed ini menjadi sumber tunggal lonceng notifikasi dan fakta Tanya SIKANDA.
- Browser tidak mengakses Supabase service role. Service role dan Gemini key tetap hanya berada di Script Properties Apps Script.
- Foto aset tetap disimpan di Google Drive melalui backend.

## Urutan implementasi wajib

1. Backup project Google AI Studio, Apps Script, dan branch GitHub aktif.
2. Buka `apps-script/Code.gs`, ganti seluruh isinya dengan file `apps-script/Code.gs` dari ZIP ini, lalu Save.
3. Di Apps Script buka **Deploy → Manage deployments → Edit**, pilih **New version**, lalu Deploy. Jangan hanya menekan Save.
4. Pastikan URL Web App tetap berakhiran `/exec`. Perbarui `VITE_APPS_SCRIPT_URL` hanya jika URL berubah.
5. **Upload/import file ZIP `SIKANDA_v1.1.6_SECURE_AI_STUDIO_FINAL.zip` ke Google AI Studio**, atau replace seluruh source dengan isi ZIP. Ini wajib agar revisi frontend benar-benar aktif.
6. Di AI Studio klik **Apply changes**, buka Preview, jalankan checklist, kemudian **Publish**.
7. Push source yang sama ke GitHub. Jangan commit `node_modules`, `dist`, `.test-dist`, atau file `.env`.

## Script Properties yang harus tersedia

| Key | Keterangan |
|---|---|
| `SUPABASE_URL` | URL Supabase |
| `SUPABASE_ANON_KEY` | Publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Rahasia, hanya Apps Script |
| `FIREBASE_API_KEY` | Firebase Web API key |
| `GEMINI_API_KEY` | Key Gemini backend |
| `GEMINI_MODEL` | Rekomendasi `gemini-2.5-flash` |
| `GEMINI_FALLBACK_MODELS` | Rekomendasi `gemini-2.5-flash-lite` |
| `BOOTSTRAP_ADMIN_EMAIL` | Email pemulihan administrator |
| `DRIVE_FOLDER_NAME` | Folder induk foto |

Tidak ada property baru yang perlu dibuat untuk V1.1.6.

## Pemeriksaan pascadeploy

1. Buka URL Apps Script `/exec`; respons sehat memuat versi `1.1.6-secure`.
2. Login sebagai Pegawai: Dashboard, Data ASN/PPPK, Buku Penjagaan, Kendaraan, Alat & Mesin, modul operasional lain, Peta, dan Tanya SIKANDA terlihat. **Rekap Laporan**, **Kelola Akun**, dan **Data Cleansing** tidak terlihat serta tidak dapat dibuka lewat URL.
3. Pastikan akun Pegawai melihat seluruh baris Data ASN/PPPK dan seluruh aset, bukan hanya profil/aset sendiri. Tombol Tambah/Edit/Hapus aset tidak boleh tampil.
4. Pegawai hanya dapat menyimpan profil miliknya. NIP, Status, Jabatan, Bidang, Masa Kerja bulan/tahun, Golongan, TMT Golongan/Jabatan, serta Catatan Mutasi tidak dapat diubah. Nama, Tanggal Lahir, Foto, Pendidikan, Diklat, Kontak, Email, dan Keterangan dapat diperbarui.
5. Tambah/edit pegawai: pilih tanggal dari tombol kalender dan coba input `13 Juli 1992`, `13-07-1992`, serta tanggal tidak sah. Status validasi harus tepat dan tanggal sah tidak boleh masuk Data Cleansing.
6. Uji Golongan, Jabatan, Jurusan, Universitas/Sekolah, dan Tahun Lulus: suggestion dapat dipilih, data eksisting tetap muncul, dan nilai baru dapat diketik.
7. Uji ulang tahun dengan format `16-07`, `16/07/2026`, `16 Juli 2026`, dan `16 July 2026`. Pastikan lonceng serta Tanya SIKANDA memberi hasil sama dalam WIB.
8. Klik item lonceng. Modal detail pegawai dengan NIP yang sama harus terbuka.
9. Uji preview foto URL kosong, URL Drive, path legacy, dan foto kamera/galeri pada Kendaraan serta Alat & Mesin. Login Pegawai juga harus dapat membaca foto seluruh data tanpa broken-image icon. File Drive lama dapat membutuhkan beberapa detik pada pembukaan pertama untuk pemulihan izin privat.
10. Buka Peta pada sidebar terbuka/tertutup dan resize browser. Tile harus menutup seluruh area, Radar default nonaktif, kontrol tetap responsif, dan foto popup tidak crash.
11. Login Administrator/Pimpinan, buka Data Cleansing, lalu terapkan satu koreksi nama pada Kendaraan dan Alat & Mesin. Tidak boleh muncul pesan `Jenis aset tidak dikenali`.
12. Cetak masing-masing kategori Rekap Laporan. Logo harus berada konsisten di kiri area KOP dan teks tepat di tengah; gunakan A4 landscape serta nonaktifkan browser headers/footers.

## Pemeriksaan lokal

Jalankan satu per satu:

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

## Rollback

Kembalikan source AI Studio/GitHub dan New Version deployment Apps Script ke V1.1.5 bila masalah ditemukan. Tidak ada rollback SQL untuk V1.1.6.
