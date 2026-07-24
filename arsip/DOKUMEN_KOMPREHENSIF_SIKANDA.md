# DOKUMEN REFERENSI KOMPREHENSIF: SISTEM INFORMASI KEPEGAWAIAN DAN ASET DAERAH (SIKANDA)

---

## 1. RINGKASAN EKSEKUTIF & LATAR BELAKANG

### 1.1 Identitas Sistem
* **Nama Aplikasi:** SIKANDA (Sistem Informasi Kepegawaian dan Aset Daerah)
* **Versi Sistem:** v1.1.16 (Production Ready)
* **Kategori Aplikasi:** Web-Based Enterprise Resource Planning (ERP) Kepegawaian & Aset Publik
* **Pengembang Utama:** Tim Pengembang SIKANDA dengan Dukungan AI Pair-Programming (Antigravity IDE - Google DeepMind)

### 1.2 Latar Belakang & Masalah yang Diselesaikan
Sebelum adanya SIKANDA, pengelolaan data Aparatur Sipil Negara (ASN), Pegawai Pemerintah dengan Perjanjian Kerja (PPPK), serta pencatatan aset inventaris daerah menghadapi beberapa kendala utama:
1. **Silo Data & Ketidakakuratan Profil:** Data pegawai dan data kepemilikan aset (kendaraan dinas, alat & mesin) sering kali terpisah, menyebabkan ketidakcocokan data (*unmatched data*).
2. **Keterlambatan Agenda Otomatis (KGB & Pangkat):** Perhitungan jadwal Kenaikan Gaji Berkala (KGB) dan Kenaikan Pangkat yang masih manual berisiko merugikan hak-hak pegawai.
3. **Ketidaksesuaian Aturan Pegawai Non-ASN / PPPK:** Belum adanya sistem terintegrasi yang mampu membedakan hak agenda antara ASN, PPPK Penuh Waktu, PPPK Paruh Waktu, dan Pegawai Pensiun.
4. **Resiko Keamanan Kebocoran Data:** Aplikasi berbasis web sering kali rentan terhadap ekspos kredensial API kunci database di sisi klien (*frontend leakage*).

### 1.3 Solusi SIKANDA
SIKANDA hadir sebagai solusi satu pintu (*single point of truth*) berbasis web yang menggabungkan manajemen profil pegawai, otomatisasi agenda kepegawaian, audit pembersihan data (*data cleansing*), pelacakan aset inventaris, manajemen akses pengguna terenkripsi, serta asisten AI interaktif yang aman.

---

## 2. METODOLOGI PENGEMBANGAN SOFTWARE (SDLC)

Pengembangan SIKANDA menerapkan metodologi **Agile Incremental dengan Pendekatan Security-First & AI-Assisted Engineering**.

```
[Analisis Kebutuhan & Regulasi] 
             ↓
[Arsitektur Keamanan Mediator (Apps Script + Supabase)] 
             ↓
[Pengembangan Komponen Frontend Iteratif (React 19 + Tailwind)] 
             ↓
[Otomatisasi Aturan Bisnis & Audit Data Cleansing] 
             ↓
[Integrasi AI Asisten (Gemini API dengan Smart Interceptor)] 
             ↓
[Pengujian Kepatuhan & Persiapan Production]
```

### 2.1 Tahapan Metodologi
1. **Requirements & Policy Analysis:** Menganalisis peraturan perundang-undangan kepegawaian terkini terkait hak-hak ASN dan kriteria pembedaan PPPK Penuh Waktu vs Paruh Waktu.
2. **Security-First Architecture Design:** Merancang pola arsitektur *Zero-Trust Client* di mana *frontend* tidak pernah memegang kunci database rahasia (*Supabase Service Role Key*). Seluruh transaksi melewati *backend mediator* Google Apps Script.
3. **Iterative Component Building:** Pembangunan antarmuka secara bertahap menggunakan React 19, TypeScript, dan komponen Tailwind CSS neumorfis/glassmorphic yang responsif di perangkat *mobile* maupun *desktop*.
4. **Data Cleansing Engine Implementation:** Pengujian dan pembangunan algoritma pembersih data untuk menyaring NIP ganda, format email tidak valid, dan profil belum lengkap secara otomatis.
5. **Empirical Testing & Optimization:** Setiap modul diuji melalui pengujian unit dan verifikasi visual instan (*Hot Module Replacement*).

---

## 3. ARSITEKTUR TEKNOLOGI & APLIKASI (TECH STACK)

SIKANDA menggunakan kombinasi teknologi modern berskala industri:

| Lapisan (Layer) | Teknologi / Framework | Fungsi & Peran Utama |
| :--- | :--- | :--- |
| **Frontend Core** | React 19, TypeScript 5.8, Vite 6 | Framework UI modern, aman dari type error, dan super cepat |
| **Styling & Animation** | Tailwind CSS v4, Motion (Framer), Lucide Icons | Desain neumorfik premium, mode Gelap/Terang, dan animasi halus |
| **Backend Mediator** | Google Apps Script (`Code.gs`) | Serverless API Gateway, enforcer otorisasi, & pembatas akses |
| **Database & Auth** | Supabase (PostgreSQL) | Penyimpanan data relasional, autentikasi terenkripsi, dan storage |
| **Artificial Intelligence**| Google Gemini API (`gemini-3.5-flash`) | Engine kecerdasan buatan untuk menu "Tanya SIKANDA" |
| **Deployment & Host** | GitHub Pages & Google Cloud Infrastructure | Hosting frontend terdistribusi cepat dan gratis |

---

## 4. MODUL & FITUR-FITUR UTAMA SIKANDA

### 4.1 Modul Dashboard Utama
* Menampilkan ringkasan statistik cepat: Total Pegawai, Total Aset Terverifikasi, Agenda KGB Bulan Ini, dan Tingkat Kelengkapan Profil.
* Indikator cepat untuk tindakan yang memerlukan perhatian pimpinan.

### 4.2 Modul Data ASN / PPPK (Pegawai)
* Pencatatan profil lengkap pegawai (NIP, Nama, Golongan, Jabatan, Unit Kerja, Email, No. WhatsApp).
* Integrasi foto profil pegawai yang aman menggunakan *Signed URL* berbatas waktu.
* **Smart Filter & Search:** Pencarian instan berbasis NIP, Nama, Jabatan, Status Pegawai, dan Kepemilikan Aset.

### 4.3 Aturan Bisnis Kepegawaian (Buku Penjagaan)
SIKANDA secara otomatis menerapkan kebijakan hak agenda berdasarkan status kepegawaian:
* **ASN (PNS):** Berhak atas agenda Kenaikan Gaji Berkala (KGB), Kenaikan Pangkat, dan Batas Usia Pensiun (BUP).
* **PPPK (Penuh Waktu):** Berhak atas agenda Kenaikan Gaji Berkala (KGB) saja.
* **PPPK (Paruh Waktu) & Pensiun:** Tidak memiliki agenda aktif (mencegah salah cetak/salah anggaran).

### 4.4 Modul Kelola Akun & Role-Based Access Control (RBAC)
* Pembagian peran pengguna yang ketat: **Administrator**, **Pimpinan**, dan **Pegawai**.
* Pilihan filter akun berbasis Status Registrasi (*Siap Registrasi, Aktif, Dinonaktifkan*) dan Status Pegawai (*ASN, PPPK Penuh Waktu, PPPK Paruh Waktu*).
* Fitur *Reset Registrasi* jika pegawai lupa password atau mengganti perangkat.

### 4.5 Modul Inventaris, Alat & Mesin, serta Kendaraan Dinas
* Pendataan aset publik daerah lengkap dengan kode barang, merk, nomor polisi/rangka, dan kondisi fisik.
* Pelacakan penanggung jawab aset (siapa pegawai yang memegang kendaraan/laptop dinas tertentu).
* Riwayat Pemeliharaan Kendaraan dan Cetak Berita Acara Peminjaman.

### 4.6 Modul Data Cleansing (Audit Kualitas Data)
* Otomatis melacak data yang tidak konsisten:
  * NIP Ganda atau NIP Kurang/Lebih dari 18 digit.
  * Email Ganda atau Email tanpa domain valid.
  * Profil Pegawai yang belum melengkapi 9 kriteria dasar (NIP, Jabatan, Golongan, Status, dll).

### 4.7 Modul "Tanya SIKANDA" (AI Assistant)
* Asisten cerdas berbasis model **Google Gemini**.
* Dilengkapi **Backend Filter Interceptor** di file `Code.gs` untuk menyaring pertanyaan spesifik secara lokal (seperti *"siapa saja pegawai yang belum melengkapi email"*), menjamin jawaban 100% akurat tanpa halusinasi dan tanpa membocorkan data pribadi ke pihak luar.

---

## 5. KEAMANAN & PROTEKSI PERLINDUNGAN DATA

SIKANDA dirancang dengan standar keamanan tinggi untuk mencegah peretasan dan kebocoran data:

1. **Prinsip Kunci Tersembunyi (*Hidden Key Security*):**
   * *Supabase Service Role Key* (kunci akses tingkat tinggi) hanya ditaruh pada *Script Properties* Google Apps Script backend. Frontend React hanya menerima hasil query yang sudah disaring.
2. **Proteksi Serangan Kredensial:**
   * Fitur *Login & Registration Rate Limiting* untuk mencegah serangan *Brute Force*.
   * Penggunaan *Password Pepper* dan enkripsi hashing standar industri.
   * Toleransi CAPTCHA dinamis untuk membedakan manusia dan bot otomatis.
3. **Pembersihan Data Sensitif pada AI:**
   * Sebelum pertanyaan dikirim ke model Gemini, server Apps Script terlebih dahulu menganalisis dan membersihkan data identitas sensitif pegawai.

---

## 6. PANDUAN PROMPT UNTUK NOTEBOOKLM

Gunakan dokumen ini sebagai **Source Document** di NotebookLM, lalu gunakan contoh-contoh *prompt* di bawah ini untuk menghasilkan output dokumen laporan yang Anda butuhkan:

### Prompt 1: Membuat Ringkasan Eksekutif (Executive Summary)
> *"Berdasarkan dokumen sumber SIKANDA, buatkan Ringkasan Eksekutif sepanjang 2 halaman yang cocok untuk diserahkan kepada Kepala Dinas / Pimpinan. Sertakan latar belakang, keunggulan keamanan, dan manfaat operasional SIKANDA."*

### Prompt 2: Menyusun Bab Metodologi Penelitian / Laporan
> *"Tolong uraikan Bab Metodologi Pengembangan Sistem SIKANDA secara akademis/formal berdasarkan dokumen ini. Jelaskan tahapan Agile Development, arsitektur backend mediator Google Apps Script, dan pengujian Data Cleansing-nya."*

### Prompt 3: Membuat Pertanyaan & Jawaban (FAQ / Q&A) Presentasi
> *"Buatkan daftar 10 pertanyaan kritis yang kemungkinan akan ditanyakan oleh penguji/pimpinan saat presentasi SIKANDA beserta jawaban solutif dan teknis berdasarkan dokumen meberikan referensi di atas."*

### Prompt 4: Membuat Naskah Audio Podcast (NotebookLM Audio Overview)
> *"Generate an engaging 2-person podcast conversation discussing how SIKANDA modernizes employee management, prevents data leaks, and automatically handles PPPK rules."*

---
*Dokumen ini disusun secara otomatis untuk memberikan gambaran 360-derajat terhadap Sistem SIKANDA.*
