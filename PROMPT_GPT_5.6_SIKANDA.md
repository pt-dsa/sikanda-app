# Konteks Proyek: SIKANDA (Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah)

Anda adalah AI Assistant yang ditugaskan untuk melanjutkan pengembangan, pemeliharaan, dan optimalisasi sistem SIKANDA. Berikut adalah profil lengkap, arsitektur sistem, dan pencapaian yang telah diimplementasikan hingga saat ini.

## 1. Profil dan Arsitektur SIKANDA

**Deskripsi Proyek:**
SIKANDA adalah aplikasi *full-stack* berbasis web yang dirancang untuk mengelola data kepegawaian (SDM) dan aset daerah (Kendaraan, Alat Mesin, dll). Aplikasi ini difokuskan pada keamanan tinggi, performa, dan kemudahan manajemen dengan memusatkan semua *business logic* dan kredensial rahasia di sisi *backend*.

**Arsitektur Sistem (Backend-as-a-Service Pattern):**
- **Frontend:** React + Vite, TypeScript, Tailwind CSS, shadcn/ui. Bertindak sebagai *thin client*. Tidak ada kunci rahasia (*secret keys*) di *frontend*.
- **Backend & Database:** 
  - **Google Apps Script (GAS):** Berfungsi sebagai *backend* utama, *API Gateway*, dan penegak keamanan (Role-Based Access Control / RBAC).
  - **Supabase PostgreSQL:** Digunakan sebagai *database* utama untuk penyimpanan data terstruktur (Kendaraan, Alat Mesin, Laporan, dll).
  - **Google Sheets:** Berfungsi sebagai *database* pendukung atau *log* data sinkronisasi.
- **Autentikasi:** Firebase Authentication (hanya untuk *login* frontend). Sesi token divalidasi oleh *backend*.
- **Penyimpanan File:** Google Drive (diakses melalui integrasi *backend* GAS, bukan langsung dari frontend).
- **Fitur AI (Tanya SIKANDA):** Integrasi ganda. *Backend* akan mencoba merespons menggunakan *Database-first routing* (data *hardcoded* atau SQL *queries*). Jika gagal, akan *fallback* ke Gemini API (model `gemini-2.5-flash-lite`) yang dipanggil secara aman dari sisi server (GAS).

**Aturan Keamanan Ekstrem (Strict Requirements):**
- **ZERO SECRETS IN FRONTEND:** Tidak boleh ada kunci API Gemini, *Service Role Key* Supabase, atau kredensial Google Drive di *frontend*. Semua konfigurasi *frontend* hanya menggunakan *environment variable* berawalan `VITE_` (yang bersifat publik).
- **RBAC Enforcement:** Logika otorisasi ditentukan oleh GAS.
  - Role `Administrator` dan `Pimpinan` memiliki akses penuh (*equivalent*).
  - Role `Pegawai` hanya memiliki akses *read-only* ke profil datanya sendiri.

## 2. Pencapaian Saat Ini (Versi 1.1.2)

Hingga rilis **V1.1.2**, sistem telah mencapai fase yang matang dan berfokus pada perluasan fungsionalitas aset serta penguatan fitur kecerdasan buatan. Berikut rinciannya:

**Pencapaian Backend (Google Apps Script - `Code.gs`):**
- Implementasi *Database-first AI routing* pada fitur "Tanya SIKANDA" untuk menjawab pertanyaan umum tanpa menghabiskan kuota LLM.
- *Fallback* AI ditingkatkan menggunakan model `gemini-2.5-flash-lite` dengan *retry mechanism* yang stabil.
- Pembaruan skema API untuk mendukung parameter/kendaraan tambahan (Nomor Mesin, BPKB, dsb).
- Logika pembuatan/pembaruan akun (*account seeding*) yang aman untuk modul Pegawai.

**Pencapaian Database (Supabase PostgreSQL):**
- Skema keamanan dasar (RLS/Policies) terpasang via `001_sikanda_v1_security.sql`.
- Perluasan *field* pada tabel kendaraan telah diselesaikan via `002_sikanda_v1_1_2_revision.sql`.

**Pencapaian Frontend:**
- **Kendaraan (`Kendaraan.tsx`):** Mendukung fungsionalitas CRUD (*Create, Read, Update, Delete*) penuh dengan *field* informasi mesin dan BPKB yang baru.
- **Kelola Akun (`KelolaAkun.tsx`):** Implementasi *autocomplete* yang mulus dengan mengambil data langsung dari `spreadsheetService.getPegawai()`.
- **Laporan (`Laporan.tsx`):** Sistem *filtering* yang komprehensif lengkap dengan fitur ekspor data ke format CSV.
- **Dashboard (`Dashboard.tsx`):** Rendering chart/grafik komposisi SDM yang sudah dioptimalkan untuk performa tinggi.
- **Tanya SIKANDA (`TanyaSikanda.tsx`):** Antarmuka respons AI yang lebih natural, lengkap dengan status *loading* yang rapi dan penanganan *error* (error handling) yang elegan.

**Pencapaian Infrastruktur & Kualitas Kode:**
- Pembersihan total direktori dari dokumen *legacy*, *script* usang, dan aset tak terpakai.
- Panduan *deployment* utama yang terkonsolidasi dengan rapi di `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.2_SECURE.md`.
- *Build system* dan *unit testing* (`npm run verify`) berhasil 100% lulus (Agenda, Reporting, Backend Rules).

---
**Instruksi Selanjutnya:**
Jika ada penambahan fitur baru, perbaikan *bug*, atau pertanyaan terkait kode SIKANDA, Anda harus selalu mengikuti pola arsitektur "Backend-as-a-Service" yang telah dijelaskan, tidak mengekspos kredensial di frontend, dan merujuk pada standar V1.1.2 ini.
