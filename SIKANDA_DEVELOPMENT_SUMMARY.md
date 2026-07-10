# Dokumen Rangkuman & Prompt Pengembangan Aplikasi SIKANDA

Dokumen ini berisi rangkuman komprehensif mengenai arsitektur, pencapaian fitur, dan struktur kerangka berpikir (prompt) yang sistematis untuk pengembangan lanjutan aplikasi **SIKANDA (Sistem Informasi Kepegawaian dan Data Aset)**.

---

## 1. Konteks & Tujuan Aplikasi
**SIKANDA** adalah aplikasi berbasis web (Single Page Application) yang berfungsi sebagai dasbor sentral untuk memantau, mengelola, dan menganalisis data kepegawaian serta aset. 
Sistem ini menggunakan arsitektur tanpa backend mandiri (serverless/BaaS), dengan memanfaatkan **Google Sheets** sebagai basis data utama. Pendekatan ini memungkinkan data tetap dapat dikelola secara manual oleh admin melalui antarmuka spreadsheet yang sudah familier, sekaligus disinkronisasikan dan dikelola secara interaktif melalui aplikasi web SIKANDA.

## 2. Arsitektur & Tumpukan Teknologi (Tech Stack)
*   **Frontend Framework:** React 18+ (dengan Vite).
*   **Bahasa Pemrograman:** TypeScript (memberikan type-safety pada struktur data pegawai dan aset).
*   **Styling:** Tailwind CSS (untuk desain responsif, mode gelap/terang, dan UI yang modern).
*   **Database & Penyimpanan:** Google Sheets API.
    *   **Membaca Data (Read):** Menggunakan Google Visualization API (GViz) untuk pengambilan data yang cepat tanpa memerlukan autentikasi tingkat lanjut, dilengkapi mekanisme caching (SessionStorage) dan *Exponential Backoff* untuk menangani *rate-limit* (HTTP 429).
    *   **Menulis Data (Create/Update):** Menggunakan REST API Google Sheets v4 standar.
*   **Autentikasi:** Firebase Authentication (Autentikasi OAuth2 dengan Google Provider) untuk mendapatkan token akses (*Access Token*) guna melakukan operasi tulis (CRUD) ke Google Sheets.
*   **Ikonografi & Animasi:** Lucide-React & Framer Motion (Motion/React).

## 3. Fitur Utama & Pencapaian Saat Ini (Milestones)

✅ **1. Integrasi Google Sheets API & GViz**
- Pembacaan data dari Google Sheets secara *real-time*.
- Implementasi sistem caching menggunakan `sessionStorage` untuk meminimalisir pemuatan berulang.
- Implementasi mekanisme coba-ulang (retry) otomatis dengan *Exponential Backoff* saat terjadi error 429 (Terlalu Banyak Permintaan).

✅ **2. Modul Manajemen Pegawai (Data Kepegawaian)**
- Tampilan grid/tabel interaktif dengan filter (Status ASN/PPPK, Golongan, dan Data Tidak Lengkap).
- Deteksi anomali/kelengkapan biodata (fitur "Data Tidak Lengkap" mendeteksi baris tanpa NIP, Jabatan, Golongan, atau Status).
- Fitur pencarian instan (NIP, Nama, Jabatan).
- Tombol **"Sinkronisasi"** untuk menarik data paksa (*Force Refresh*) dari Spreadsheet, mem-bypass sistem cache, beserta indikator stempel waktu (*timestamp*) "Terakhir Sinkronisasi".

✅ **3. Fitur CRUD Pegawai & Autentikasi**
- **Autentikasi Firebase:** Terintegrasi dengan Google Sign-In untuk meminta cakupan akses (*scope*) pembacaan dan penulisan ke spreadsheet.
- **Tambah Pegawai (Create):** Formulir modal interaktif untuk menambahkan data pegawai baru yang langsung menembak (*append*) baris baru ke Google Sheets.
- **Edit Pegawai (Update):** Mekanisme pencarian indeks baris berdasarkan NIP, lalu memodifikasi baris (row) data pegawai secara spesifik via Google Sheets API v4.
- Normalisasi pemetaan kolom otomatis dari Google Sheets ke objek aplikasi untuk memastikan integritas penyisipan data.

✅ **4. UI/UX dan Desain Antarmuka**
- Modal Profil detail (Biodata, Status Pensiun, dll).
- Penggunaan *Badge* status dan tingkat kelengkapan data (mis. tanda peringatan oranye untuk data belum lengkap).
- Animasi transisi yang halus antar halaman dan status *loading*.

---

## 4. Kerangka Prompt Sistematis untuk Pengembangan Lanjutan

*Salin dan gunakan kerangka prompt di bawah ini setiap kali Anda ingin menginstruksikan AI (seperti agen ini) untuk membangun fitur baru, agar AI memiliki konteks penuh tentang apa yang sedang dikerjakan dan aturan arsitekturnya.*

> **[AWAL PROMPT PENGEMBANGAN]**
>
> **Konteks Proyek:**
> Kamu adalah asisten developer untuk aplikasi **SIKANDA**, sebuah Sistem Informasi Kepegawaian dan Aset yang dibangun dengan **React (Vite), TypeScript, Tailwind CSS**. 
> Aplikasi ini menggunakan **Google Sheets** sebagai database-nya.
> 
> **Aturan Arsitektur Saat Ini:**
> 1. **Data Fetching:** Data ditarik menggunakan fungsi GViz (`fetchFromSheet` di `spreadsheetService.ts`) dengan caching berbasis SessionStorage dan penanganan retry (HTTP 429).
> 2. **Operasi CRUD (Write):** Operasi penulisan ke Google Sheets (Create/Update) di-handle di `googleSheetsApi.ts` menggunakan token akses OAuth dari Firebase (metode `authService.getToken()`).
> 3. **Sinkronisasi Data:** Selalu pertahankan fitur untuk melakukan penyegaran secara manual/otomatis (`spreadsheetService.clearCache()`) setelah modifikasi data dilakukan.
> 4. **Gaya Kode:** Gunakan functional components, Tailwind utility classes untuk UI modern dan bersih (termasuk dukung *dark mode*), dan Lucide-react untuk ikon.
>
> **Tugas Saat Ini (Instruksi):**
> [TULISKAN DETAIL FITUR YANG INGIN DITAMBAHKAN/DIUBAH DI SINI]
> 
> **Contoh Permintaan:**
> - *"Tambahkan modul modul Manajemen Aset dengan kemampuan CRUD seperti pada modul Pegawai."*
> - *"Buatkan halaman Statistik Lanjutan yang membaca tabel 'dashboard_data' dari Google Sheets, dan visualisasikan menggunakan Recharts."*
> - *"Implementasikan fungsi Delete Pegawai di dalam modal detail, pastikan ia memanggil Google Sheets API untuk menghapus baris terkait (atau menandai statusnya sebagai 'Dihapus')."*
>
> **Harapan Eksekusi:**
> - Tolong periksa file `spreadsheetService.ts` dan `googleSheetsApi.ts` terlebih dahulu jika tugas berkaitan dengan pengambilan/penulisan data.
> - Tetap patuhi penanganan error yang anggun (*graceful error handling*) dan tampilkan loading/spinner saat memproses API.
>
> **[AKHIR PROMPT PENGEMBANGAN]**

---

*File ini digenerate secara otomatis untuk membantu melacak alur pengembangan aplikasi SIKANDA.*
