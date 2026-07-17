# Panduan Implementasi SIKANDA V1.1.13 Secure

Tanggal paket: 17 Juli 2026 (Asia/Jakarta)

Dokumen ini adalah panduan utama untuk mengganti SIKANDA V1.1.12 menjadi V1.1.13. Paket memuat source frontend lengkap, backend `apps-script/Code.gs`, hasil build produksi, konfigurasi, migrasi Supabase historis, dan 15 rangkaian pengujian regresi.

## 1. Ringkasan hasil revisi

### 1.1 Status “Perlu Verifikasi” dan Data Cleansing

Sebelumnya, badge pegawai dan daftar Data Cleansing dapat memakai dua hasil pencocokan yang berbeda. Akibatnya, pegawai dapat terlihat “Perlu Verifikasi”, tetapi tautannya membuka daftar kosong.

V1.1.13 menetapkan satu sumber kebenaran:

- badge “Perlu Verifikasi” dibentuk oleh pemindai yang sama dengan Data Cleansing;
- NIP dibandingkan sebagai teks secara eksak;
- aset yang ambigu tidak otomatis ditempelkan pada pegawai;
- tautan dari profil pegawai memfilter temuan Data Cleansing dengan NIP yang sama;
- setelah perbaikan diterapkan dan sinkronisasi dilakukan, badge ikut hilang.

### 1.2 Loading dengan kemajuan nyata

Loading tidak lagi memakai animasi berulang yang tidak berkaitan dengan proses. Persentase sekarang mengikuti tahapan permintaan yang benar-benar selesai: pemeriksaan sesi, koneksi layanan, pengambilan data, pemrosesan jawaban, dan penyiapan tampilan.

- angka kemajuan ditampilkan dari 0–100%;
- lebar bar hanya bergerak maju;
- warna bar bergradasi biru menuju hijau;
- beberapa permintaan paralel digabungkan menjadi satu kemajuan halaman;
- tidak ada pengulangan palsu ketika proses belum selesai.

### 1.3 PPPK Paruh Waktu

PPPK Paruh Waktu tetap tidak memperoleh agenda KGB, kenaikan pangkat, maupun BUP. Keterangan profil disederhanakan menjadi:

> PPPK (Paruh Waktu) tidak memiliki agenda KGB, kenaikan pangkat, maupun BUP.

Kalimat teknis “berdasarkan aturan status kepegawaian SIKANDA” telah dihapus.

### 1.4 Performa Dashboard dan menu lain

Audit menemukan empat sumber waktu tunggu utama: pengambilan tabel berulang, pembuatan alamat foto pada jalur yang tidak menampilkan foto, masa cache terlalu pendek, dan pemuatan ringkasan ulang setiap kali kembali ke Dashboard.

Perbaikannya:

- Dashboard mengambil pegawai, kendaraan, alat dan mesin, lokasi, serta konfigurasi dalam satu snapshot;
- jalur ringkasan Dashboard tidak memproses alamat foto;
- foto tetap dimuat lengkap ketika Data ASN/PPPK dibuka;
- cache antarmenu diperpanjang menjadi lima menit;
- permintaan identik yang berjalan bersamaan digabungkan;
- ringkasan Dashboard yang masih segar dirender langsung dari sesi;
- tombol Sinkronisasi dan setiap mutasi data tetap menghapus cache agar hasil tidak basi;
- data aktif untuk notifikasi dan Tanya SIKANDA juga melewati proses foto yang tidak diperlukan.

### 1.5 Tanya SIKANDA

Pertanyaan tentang data terlambat sekarang diproses sebelum pola “enam bulan ke depan”. Jawaban Tanya SIKANDA memakai pembentuk fakta agenda yang sama dengan Buku Penjagaan dan lonceng notifikasi.

Contoh yang wajib konsisten:

- “Siapa pegawai yang pensiunnya sudah melewati tenggat?” harus menampilkan agenda BUP yang terlambat;
- jika notifikasi menampilkan M. HOLILI terlambat, Tanya SIKANDA harus memberikan fakta yang sama;
- pertanyaan lanjutan seperti “Yang terlewat bukan M. HOLILI?” harus dipahami dari riwayat percakapan;
- kegagalan layanan menampilkan alasan yang aman dan dapat ditindaklanjuti, bukan meminta pengguna mengulang kategori yang sudah jelas;
- permintaan Tanya SIKANDA dapat mencoba ulang satu kali untuk gangguan jaringan sementara.

### 1.6 Diksi ramah pengguna

Teks yang menyebut Google Sheets, holder, record, endpoint, deployment, signed URL, suggestion, auto-koreksi, dan review manual telah dihapus atau diganti pada tampilan pengguna. Contoh penggantian:

- “Google Sheets/holder” menjadi “data aset/nama pengguna”;
- “Auto-Koreksi” menjadi “Dapat Diperbaiki”;
- “Review Manual” menjadi “Perlu Ditinjau”;
- “Asset ID” menjadi “ID Aset”;
- “detail teknis” menjadi “rincian kendala”.

Istilah teknis tetap boleh ada pada komentar source dan dokumentasi administrator karena tidak tampil kepada pengguna.

## 2. Arsitektur keamanan yang dipertahankan

- Browser hanya membawa Firebase ID token pengguna yang sedang login.
- Apps Script memverifikasi token dan mencocokkan email dengan `app_access`.
- Role dan izin mutasi diperiksa kembali di backend.
- `SUPABASE_SERVICE_ROLE_KEY` dan `GEMINI_API_KEY` hanya berada di Script Properties.
- Browser tidak mengakses Supabase secara langsung.
- Tabel inti tetap memakai RLS dan tidak memberi hak langsung kepada `anon` atau `authenticated`.
- Input mutasi memakai allowlist field, validasi ID, validasi kondisi aset, dan audit log.
- Foto berada pada Storage private dan alamat akses dibuat oleh backend.
- Pesan error publik disederhanakan; rincian sensitif tidak dikirim ke browser.

V1.1.13 tidak membutuhkan SQL, tabel, kolom, Script Property, atau trigger baru.

## 3. Persiapan sebelum upgrade

1. Unduh dan simpan ZIP source V1.1.12.
2. Salin `apps-script/Code.gs` yang sedang aktif sebagai cadangan.
3. Catat deployment Apps Script V1.1.12 untuk rollback.
4. Buat backup database Supabase.
5. Pastikan akses ke AI Studio, Apps Script, GitHub, dan Supabase tersedia.
6. Jangan menghapus atau mengganti nilai secret yang sudah bekerja.

## 4. Deploy backend terlebih dahulu

1. Buka project Backend SIKANDA pada Google Apps Script.
2. Ganti seluruh isi `Code.gs` dengan file `apps-script/Code.gs` dari paket V1.1.13.
3. Simpan.
4. Pilih **Deploy → Manage deployments → Edit**.
5. Pilih **New version**, lalu deploy pada deployment yang sama agar URL Web App tetap sama.
6. Buka URL Web App `/exec`.
7. Pastikan respons memuat:

```json
{
  "ok": true,
  "service": "SIKANDA",
  "version": "1.1.13-secure"
}
```

Jika URL berubah, perbarui `VITE_APPS_SCRIPT_URL` di AI Studio dan GitHub Actions Secrets sebelum membangun frontend.

## 5. Replace full source di Google AI Studio

1. Buat salinan/checkpoint project AI Studio V1.1.12.
2. Impor `SIKANDA_v1.1.13_SECURE_AI_STUDIO_FINAL.zip` atau ganti seluruh source dengan isi ZIP.
3. Jangan salin folder `node_modules` dari komputer lain; AI Studio memasang dependency dari `package-lock.json`.
4. Pertahankan Environment Variables yang sudah aktif:

```text
VITE_APPS_SCRIPT_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

5. Pastikan tidak ada service-role key atau Gemini API key pada Environment Variables frontend.
6. Jalankan preview dan periksa halaman login.
7. Publish/deploy ke GitHub Pages seperti versi sebelumnya.
8. Lakukan hard refresh atau hapus cache situs pada perangkat pengujian.

## 6. Verifikasi lokal

```bash
npm ci
npm run verify
npm audit --omit=dev --audit-level=high
cp apps-script/Code.gs /tmp/sikanda-code.js
node --check /tmp/sikanda-code.js
```

Hasil paket final:

- TypeScript: lulus;
- 15 suite regresi: lulus;
- build produksi: lulus;
- backend health version: `1.1.13-secure`;
- dependency production: wajib tidak memiliki kerentanan high/critical.

## 7. UAT wajib untuk enam revisi

### A. Perlu Verifikasi

1. Buka pegawai yang memiliki badge “Perlu Verifikasi”.
2. Klik badge/tautan perbaikan.
3. Pastikan Data Cleansing menampilkan aset yang menyebabkan badge tersebut.
4. Pastikan NIP pada banner sama dengan pegawai.
5. Terapkan hanya setelah nama lama dan nama resmi dipastikan orang yang sama.
6. Sinkronisasi, lalu pastikan badge hilang jika tidak ada temuan lain.

### B. Loading

1. Buka Dashboard pada koneksi normal dan koneksi yang diperlambat.
2. Pastikan angka persentase terlihat.
3. Pastikan bar tidak kembali ke awal atau berulang.
4. Pastikan warna bergerak dari biru ke hijau dan halaman tampil setelah data siap.

### C. PPPK Paruh Waktu

1. Buka profil Mochamad Mashuri atau PPPK Paruh Waktu lain.
2. Pastikan tidak ada kartu tanggal KGB/Pangkat/BUP.
3. Pastikan tidak ada kalimat “berdasarkan aturan status kepegawaian SIKANDA”.

### D. Performa

1. Buka Dashboard setelah login dan catat waktu sampai card tampil.
2. Pindah ke menu lain lalu kembali ke Dashboard; hasil cache harus tampil seketika selama belum kedaluwarsa.
3. Tekan Sinkronisasi Data; angka harus dihitung ulang.
4. Setelah menambah/mengubah data, buka menu terkait dan pastikan data terbaru tampil.
5. Ulangi pada desktop dan mobile.

### E. Tanya SIKANDA

1. Bandingkan bagian **Terlambat** pada lonceng notifikasi dengan Buku Penjagaan.
2. Tanyakan “Siapa pegawai yang pensiunnya sudah melewati tenggat?”
3. Pastikan nama, kategori, tanggal, dan jumlah hari terlambat konsisten.
4. Lanjutkan “Yang terlewat bukan M. HOLILI?” dan pastikan konteks dipahami.
5. Uji pertanyaan KGB, pangkat, ulang tahun, kendaraan, serta alat dan mesin.

### F. Diksi

Periksa modal profil pegawai, Data Cleansing, form aset, Dashboard, Kelola Akun, dan pesan error. Pastikan teks pengguna tidak menyebut Google Sheets, holder, record, endpoint, deployment, signed URL, atau istilah teknis internal lain.

## 8. Kriteria penerimaan production

Versi dinyatakan siap dipromosikan apabila:

- health backend menunjukkan `1.1.13-secure`;
- seluruh UAT di atas lulus pada role Admin, Pimpinan, dan Pegawai;
- tidak ada error merah pada Console selama alur normal;
- CRUD Kendaraan dan Alat & Mesin terverifikasi di Supabase;
- foto header/profil tetap tampil sesuai izin;
- tidak ada secret pada source, dist, log, atau ZIP;
- pemeriksaan RLS/grant tetap menunjukkan akses tabel inti hanya melalui service role backend;
- hasil Tanya SIKANDA sama dengan notifikasi dan Buku Penjagaan untuk data pembanding yang sama.

Kelulusan build otomatis adalah syarat penting, tetapi keputusan production tetap memerlukan UAT pada deployment nyata karena koneksi, data, izin akun, dan konfigurasi layanan tidak dapat dibuktikan hanya dari source.

## 9. Rollback

1. Kembalikan frontend ke artifact V1.1.12.
2. Pilih deployment Apps Script V1.1.12 yang telah dicatat.
3. Pastikan URL Web App tetap sama.
4. Hard refresh browser.
5. Tidak ada rollback database khusus V1.1.13 karena versi ini tidak membuat migrasi skema.

## 10. Larangan keamanan

- Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` atau `GEMINI_API_KEY` di frontend.
- Jangan memberikan grant langsung tabel inti kepada `anon` atau `authenticated` untuk mengatasi error.
- Jangan menonaktifkan RLS.
- Jangan mempublikasikan bucket foto.
- Jangan menggunakan mode pengembangan untuk akun produksi.
- Jangan menganggap hasil AI sebagai keputusan final tanpa memeriksa data sumber.

