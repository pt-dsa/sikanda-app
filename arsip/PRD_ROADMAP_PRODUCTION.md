# Product Requirements Document (PRD) & Roadmap: SIKANDA Enterprise Production

## 1. Visi & Tujuan Utama (Business Goals)
Peta jalan ini bertujuan untuk membawa SIKANDA dari aplikasi siap pakai (v1.1.16) menuju standar **"Enterprise Production-Ready"** untuk pemerintahan. Fokus utamanya adalah menjamin stabilitas aksesibilitas melalui *custom domain*, memastikan keamanan data lolos standar Penetration Testing (Pentest), serta merencanakan migrasi ke infrastruktur resmi (On-Premise/VPS Diskominfo Kota Tangerang Selatan).

---

## 2. Peta Jalan Pengembangan (Roadmap)

### Fase 1: Penjenamaan (Branding), Keamanan, & Aksesibilitas (Jangka Pendek)
*   **Implementasi Custom Domain:** 
    Menautkan SIKANDA dengan *domain* resmi atau dari *provider* komersial (misal: *sikanda.id* atau *sikanda.tangerangselatan.go.id*). Ini melibatkan konfigurasi DNS/CNAME agar pengguna mengakses tautan yang kredibel dan mudah diingat.
*   **Persiapan Lulus Penetration Testing (Pentest):** 
    Melakukan audit keamanan *white-box* dan *black-box* secara mandiri sebelum diserahkan ke auditor resmi. Memastikan lapisan *Hidden Key Security* pada Google Apps Script dan Supabase kebal terhadap serangan kebocoran data, *SQL Injection*, dan eksploitasi API.
*   **Progressive Web App (PWA):** 
    Menambahkan *Service Worker* dan manifest agar SIKANDA dapat diinstal layaknya aplikasi *Native* di _homescreen smartphone_ para pegawai, lengkap dengan kapabilitas *caching* untuk kinerja luring (offline/koneksi lambat).

### Fase 2: Observabilitas & Keandalan Operasional (Menengah)
*   **Error Tracking & Crash Analytics:** 
    Integrasi perangkat pemantauan (seperti Sentry/Datadog) untuk mendeteksi *bug* atau *error* di perangkat pengguna secara *real-time* tanpa harus menunggu laporan komplain.
*   **Disaster Recovery Plan (DRP) & Otomatisasi Backup:** 
    Merancang standar prosedur pemulihan bencana. Ini mencakup *backup* otomatis database PostgreSQL (Supabase) secara rutin ke *cold storage* yang terpisah dari ekosistem utama.
*   **Audit Trail Logs (Catatan Aktivitas Historis):** 
    Menyediakan laman bagi Pimpinan/Administrator untuk melacak siapa saja yang mengubah profil pegawai, menghapus aset, atau mengganti parameter sistem, lengkap dengan rekam waktu (*timestamp*).

### Fase 3: Migrasi Infrastruktur & CI/CD Lanjutan (Jangka Panjang)
*   **Migrasi ke Server Diskominfo Tangsel:** 
    Memindahkan _hosting frontend_ dan/atau basis data yang semula di lingkungan komputasi awan publik menuju server VPS atau *On-Premise* yang dikelola sepenuhnya oleh Diskominfo Kota Tangerang Selatan demi memenuhi kedaulatan data pemerintah.
*   **Automasi CI/CD ke Server Mandiri:** 
    Mengubah alur GitHub Actions agar setiap perilisan (*release*) kode langsung melakukan *build* dan me-*deploy* (mengirim) hasilnya secara terenkripsi (via SSH/SFTP) ke *server* Diskominfo tanpa intervensi manual.
*   **End-to-End (E2E) Testing Otomatis:** 
    Menerapkan pengujian *bot* (Playwright/Cypress) yang akan mensimulasikan proses login, tambah aset, dan filter data pegawai untuk menjamin fungsi kritis tidak pernah rusak (*regression-free*) pada setiap *update* sistem.

---

## 3. Persyaratan Produk (Product Requirements)

### 3.1 Kebutuhan Keamanan & Kepatuhan (Compliance)
*   Sistem terenkripsi penuh dari hulu ke hilir (Enforced HTTPS / HSTS).
*   Sistem harus lolos pemindaian kerentanan *Open Web Application Security Project* (OWASP) Top 10.
*   Terdapat pembatasan lalu-lintas jaringan (*Rate Limiting*) yang mencegah serangan *Denial of Service* (DDoS) maupun *Brute-Force Login*.

### 3.2 Kebutuhan *User Experience* (UX) & Kinerja Ekstrim
*   Waktu muat awal halaman (*First Contentful Paint*) wajib berada di bawah 1.5 detik (tercapai berkat pengoptimalan *Vite chunking* & tanpa animasi berat).
*   Desain responsif sempurna (*pixel-perfect*) dengan dukungan *Safe Area Notch* bagi perangkat seluler premium (seperti iPhone), dilengkapi mitigasi *Layout Shift*.

### 3.3 Kebutuhan Skalabilitas (Future Scope)
*   Sistem dikondisikan agar dapat membuka jalur API Teramankan (OAuth2) di kemudian hari. Hal ini dipersiapkan untuk skenario penyatuan (integrasi) satu-data dengan layanan lokal (sistem presensi biometrik Pemkot) maupun pusat (SAP Badan Kepegawaian Negara / BKN).

---
*Dokumen ini merupakan kerangka kerja strategis (Blueprint) sebagai pedoman dalam tahapan eksekusi menuju fase kedewasaan operasional (Operational Maturity) SIKANDA.*
