# PANDUAN IMPLEMENTASI SIKANDA V1.1.12 SECURE

Paket utama: `SIKANDA_v1.1.12_SECURE_AI_STUDIO_FINAL.zip`  
Versi frontend: `1.1.12`  
Versi backend: `1.1.12-secure`  
Tanggal: 17 Juli 2026

## 1. Tujuan revisi

V1.1.12 menyelesaikan dua inkonsistensi yang terlihat pada capture pengguna:

1. PPPK Paruh Waktu masih melihat tiga kartu agenda di modal profil, meskipun pembentuk Buku Penjagaan sudah mengecualikannya.
2. Header login selalu memakai huruf inisial dan belum mengambil foto pegawai yang tersimpan pada database/storage SIKANDA.

Revisi tidak mengubah skema Supabase, kebijakan RLS, Script Properties, maupun trigger. Frontend dan Apps Script harus dipasang bersama.

## 2. Aturan agenda resmi

| Status | KGB | Kenaikan Pangkat | BUP |
|---|---:|---:|---:|
| ASN | Ya | Ya | Ya |
| PPPK Penuh Waktu | Ya | Tidak | Tidak |
| PPPK Paruh Waktu | Tidak | Tidak | Tidak |
| Pensiun | Tidak | Tidak | Tidak |

Data PPPK lama yang belum memiliki `kategori_pppk` tetap diperlakukan sebagai PPPK Penuh Waktu untuk kompatibilitas. Administrator disarankan melengkapi kategorinya melalui Data ASN/PPPK.

Implementasi memakai `employmentAgendaPolicy()` sebagai sumber tunggal frontend. Backend memakai `employmentRules_()` dengan matriks yang sama. Dengan demikian:

- modal profil hanya menampilkan kartu yang berhak;
- PPPK Paruh Waktu menampilkan penjelasan bahwa tidak ada agenda;
- Buku Penjagaan, dashboard, rekap laporan, notifikasi, dan jawaban Tanya SIKANDA tidak memasukkan PPPK Paruh Waktu ke agenda KGB/Pangkat/BUP.

## 3. Alur foto pengguna setelah login

1. Firebase memverifikasi akun Google dan email.
2. Apps Script mencocokkan email ke `app_access` dan menetapkan role/NIP.
3. Backend mencari data pegawai berdasarkan `app_access.nip`.
4. Bila akun manajer belum tertaut NIP, backend boleh mencari record pegawai berdasarkan email yang sama persis dengan email Firebase terverifikasi.
5. Jika `foto_storage_path` tersedia, backend membuat signed URL berumur terbatas dari bucket private.
6. Frontend menampilkan foto pada header. Bila URL kedaluwarsa, komponen avatar meminta URL baru menggunakan NIP sumber foto.
7. Inisial hanya dipakai bila foto memang kosong, relasi tidak ditemukan, atau gambar gagal dimuat.

Pencarian foto tidak mengubah NIP otorisasi pada `app_access`. Field `photo_nip` hanya menjadi referensi pembaruan URL gambar.

## 4. Prasyarat sebelum replace

- Export/backup proyek AI Studio V1.1.11.
- Backup `Code.gs` dan catat deployment Web App V1.1.11.
- Backup Supabase sebelum UAT transaksi.
- Pastikan environment frontend tetap tersedia:
  - `VITE_APPS_SCRIPT_URL`
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`
  - variabel Firebase publik lain yang digunakan proyek.
- Pastikan Script Properties Apps Script tetap tersedia:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY` bila digunakan;
  - `FIREBASE_API_KEY`;
  - properti operasional lain dari V1.1.11.

Jangan menaruh service-role key, Gemini API key, atau kredensial backend di `.env` frontend, source GitHub, maupun metadata AI Studio.

## 5. Replace penuh di Google AI Studio

1. Unduh dan ekstrak `SIKANDA_v1.1.12_SECURE_AI_STUDIO_FINAL.zip`, atau import ZIP langsung jika AI Studio menyediakan opsi import.
2. Ganti seluruh source proyek lama dengan isi paket V1.1.12. Jangan hanya mengganti `dist`.
3. Pastikan file berikut ada:
   - `src/`, `apps-script/`, `tests/`, `supabase/`;
   - `package.json` versi `1.1.12`;
   - `metadata.json` bertuliskan V1.1.12;
   - `dist/` hasil build terverifikasi;
   - panduan ini.
4. Masukkan kembali environment variable AI Studio. File `.env` operasional tidak disertakan dalam ZIP.
5. Jalankan preview. Pastikan halaman login, dashboard, Data ASN/PPPK, dan Buku Penjagaan dapat dibuka tanpa error console.

## 6. Deploy backend Apps Script

Frontend V1.1.12 memerlukan respons `whoami` baru yang berisi `foto` dan `photo_nip`.

1. Buka project Backend SIKANDA pada Apps Script.
2. Backup isi `Code.gs` aktif.
3. Ganti seluruh isi dengan `apps-script/Code.gs` dari paket V1.1.12.
4. Simpan.
5. Pilih **Deploy → Manage deployments → Edit → New version → Deploy**.
6. Pertahankan deployment yang sama agar URL Web App tidak berubah.
7. Buka URL Web App `/exec` dan pastikan respons memuat:

```json
{"ok":true,"service":"SIKANDA","version":"1.1.12-secure"}
```

Jika URL Web App berubah, perbarui `VITE_APPS_SCRIPT_URL`, build ulang, lalu deploy frontend kembali.

## 7. Pemeriksaan relasi foto

Jalankan pemeriksaan baca-saja berikut di Supabase SQL Editor:

```sql
select
  a.email as email_akun,
  a.role,
  a.nip as nip_akun,
  p.nip as nip_pegawai,
  p.nama,
  p.email as email_pegawai,
  p.foto_storage_path,
  nullif(trim(p.foto), '') is not null as memiliki_foto_legacy
from public.app_access a
left join public.pegawai p
  on p.nip = a.nip
  or (a.role in ('admin', 'pimpinan') and lower(p.email) = lower(a.email))
where a.is_active = true
order by a.email;
```

Foto header dapat tampil jika salah satu kondisi berikut terpenuhi:

- `nip_akun = nip_pegawai` dan pegawai memiliki foto; atau
- akun `admin`/`pimpinan` mempunyai email yang sama persis dengan `pegawai.email` dan pegawai memiliki foto.

Jika hasil join kosong, perbaiki NIP pada menu Kelola Akun. Jangan menebak atau menautkan foto berdasarkan kemiripan nama.

## 8. Build dan verifikasi lokal

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
cp apps-script/Code.gs /tmp/sikanda-code.js
node --check /tmp/sikanda-code.js
```

Hasil paket final:

- TypeScript: lulus;
- 14 suite regresi: lulus;
- build produksi: lulus;
- sintaks Apps Script: valid;
- audit dependency production: 0 kerentanan.

## 9. UAT wajib

### 9.1 Agenda

1. Buka profil satu PPPK Paruh Waktu.
2. Buka bagian Buku Penjagaan.
3. Pastikan muncul informasi **Tidak memiliki agenda Buku Penjagaan** dan tidak ada kartu KGB/Pangkat/BUP.
4. Cari NIP yang sama pada menu Buku Penjagaan, dashboard, lonceng notifikasi, dan Rekap Laporan; tidak boleh ada agenda KGB/Pangkat/BUP.
5. Buka PPPK Penuh Waktu; hanya kartu KGB yang boleh tampil.
6. Buka ASN; KGB, Pangkat, dan BUP tetap tampil.

### 9.2 Foto login

1. Logout penuh dari SIKANDA.
2. Login kembali dengan Google.
3. Pastikan foto header sama dengan foto pegawai pada Data ASN/PPPK.
4. Klik avatar, buka Edit Profile, dan pastikan record yang dibuka adalah pegawai yang benar.
5. Tunggu/tes URL kedaluwarsa atau lakukan hard refresh; foto harus dimuat ulang melalui backend.
6. Uji akun tanpa foto: inisial boleh tampil dan aplikasi tidak boleh crash.

### 9.3 Regresi umum

- CRUD Data ASN/PPPK, Kendaraan, dan Alat & Mesin;
- koordinat opsional serta minimap;
- sinkronisasi dan Data Cleansing;
- ekspor CSV/cetak;
- RBAC admin, pimpinan, dan pegawai;
- responsive mobile pada lebar 360, 390, 768, dan desktop.

## 10. Kriteria penerimaan

V1.1.12 dapat dipromosikan ke production jika:

- endpoint backend menunjukkan `1.1.12-secure`;
- frontend terbangun dari package `1.1.12`;
- seluruh UAT agenda dan foto lulus;
- akun yang diuji memiliki relasi NIP/email yang benar;
- tidak ada error baru pada console dan log Apps Script;
- backup dan prosedur rollback tersedia.

## 11. Rollback

1. Kembalikan frontend ke artefak V1.1.11.
2. Edit deployment Apps Script dan pilih versi V1.1.11 sebelumnya.
3. Hard refresh browser, logout, lalu login kembali.
4. Tidak ada rollback SQL karena V1.1.12 tidak mengubah skema.

## 12. Catatan keamanan

- Grant `service_role` yang luas adalah normal untuk backend, tetapi key tersebut harus tetap hanya di Script Properties.
- RLS tetap aktif; frontend tidak memperoleh service-role key.
- Signed URL foto bersifat sementara dan dibuat backend.
- Fallback email hanya memakai email Firebase terverifikasi dan pencocokan eksak.
- Inisial adalah fallback aman; jangan memaksakan foto milik pegawai lain ketika relasi akun tidak valid.
