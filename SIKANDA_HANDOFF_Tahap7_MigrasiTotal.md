# HANDOFF — SIKANDA Tahap 7 (Stabilisasi Baseline + Migrasi Total Supabase + Penguatan Kepegawaian)

> **Instruksi model:** Baca dokumen ini bersama `SIKANDA_HANDOFF_Tahap5.md` dan `SIKANDA_HANDOFF_Tahap3_RBAC.md` sebelum merespons. Jangan menulis kode tanpa konfirmasi desain. Semua balasan wajib **Bahasa Indonesia**. Aturan non-negotiable tetap berlaku: tanpa bug, tanpa data semu, `tsc --noEmit` 0 error, `npx vite build` lolos, responsif penuh.

---

## 0. KEPUTUSAN ARSITEKTUR FINAL (disepakati Dwi sesi ini)

1. **Migrasi TOTAL ke Supabase (PostgreSQL)** — seluruh data terstruktur dibaca/ditulis ke Supabase. Google Sheets = arsip legacy + sumber migrasi satu kali (`migrate.ts`).
2. **Pengecualian tunggal:** penyimpanan dokumen/foto tetap **Google Drive** (via Apps Script `upload_foto`).
3. **Prioritas pengembangan:** modul **Kepegawaian dan turunannya** (core value).
4. `GEMINI_API_KEYS` format `AQ.Ab8RN6...` **valid dan berfungsi** — format API key tidak selalu `AIzaSy...`. Jangan diubah/di-"perbaiki".

---

## 1. TAHAP A — STABILISASI BASELINE (24 → 0 error)

Zip masukan (`sikanda_script.zip`) mengandung **24 error tsc**. Semua diperbaiki:

| Lokasi | Masalah | Perbaikan |
|---|---|---|
| `migrate.ts` (3) | Duplikasi import `parseMoneyString`; filter memakai `d.config_key` padahal hasil map bernama `key` | Dedupe import; filter `d.key` |
| `src/components/ui/Table.tsx` → `DataTable.tsx` (1) | `TableCell`/`TableHead` bertipe `HTMLAttributes` sehingga `colSpan` ditolak | Ganti ke `TdHTMLAttributes` / `ThHTMLAttributes` |
| `AlatMesin.tsx` (3), `Kendaraan.tsx` (3), `Inventaris.tsx` (1) | `load()` dipanggil di handler tetapi fungsinya terkurung di dalam `useEffect` (nama `fetch`) → **bug runtime nyata** saat operasi tulis gagal | `load` diangkat ke lingkup komponen + `catch` dengan toast |
| `Kendaraan.tsx` (1) | `selectedItem.unit_kerja` tak ada di tipe `Vehicle` | Cast `(selectedItem as any)` konsisten dengan field non-baku lain |
| `Dashboard.tsx` (10) | `type: "spring"` bertipe `string`, ditolak tipe `Variants` motion | `type: "spring" as const` |
| `BukuPenjagaan.tsx` (1) | `Papa.unparse` menerima union dua bentuk baris | Cast `as Record<string, string>[]` |
| `TanyaSikanda.tsx` (1) | Tombol "Coba Lagi" memanggil `buildContext` yang tidak ada | Ganti `loadData` |

**Perbaikan bug fungsional tambahan (aturan "dilarang ada bug"):**
- `window.confirm()` di **AlatMesin, Kendaraan, Inventaris** diganti `ConfirmModal` (confirm diblokir diam-diam di iframe AI Studio → hapus/hapus massal/ubah status tidak pernah jalan).
- **`handleBulkUpdateStatus` (3 halaman) kini PERSISTEN ke basis data** — sebelumnya hanya mengubah tampilan (data semu; muat ulang mengembalikan status lama).

---

## 2. TAHAP B — MIGRASI TOTAL KE SUPABASE

### Peran layanan setelah migrasi
| Layanan | Peran |
|---|---|
| **Supabase** | SEMUA data terstruktur: `pegawai`, `assets_*`, `maintenance`, `vehicle_budget`, `loans`, `asset_locations`, `system_config`, **`app_access` (baru)** |
| **Google Drive** (via Apps Script) | HANYA dokumen/foto (`upload_foto`) |
| **Apps Script `Code.gs`** | `upload_foto` + `notifikasi_run`/trigger email (MailApp) — **data dibaca dari Supabase REST**, bukan sheet |
| **Firebase Auth** | Identitas Google Sign-In |
| **Gemini (browser fetch)** | Tanya SIKANDA (tidak berubah) |

### Perubahan frontend
- **`src/services/accessService.ts` (BARU):** `whoami(email)`, `userList/userSave/userDelete/userSeedFromPegawai` — semuanya ke tabel Supabase `app_access`. NIP selalu string. `last_login` dicatat best-effort.
- **`apiService.ts`:** `whoami` → email dari sesi Firebase → `accessService` (parameter `idToken` dipertahankan demi kompatibilitas, diabaikan); `getConfig`/`setConfig` → Supabase `system_config`; `userList/Save/Delete/Seed` → `accessService`; `uploadFoto`, `runNotifikasi`, `ping` tetap Apps Script; `askAI` tetap Gemini langsung. Tipe `WhoamiResult`/`AccessUser` kini bersumber di `accessService` dan di-re-export (pemanggil lama tidak berubah).
- **`Dashboard.tsx`:** `PegawaiSetupGuide` diperbarui ke konteks Supabase (panduan lama menyuruh membuat sheet — menyesatkan pasca-migrasi); tautan "Buka Google Sheets" dihapus.

### Perubahan basis data & migrasi
- **`supabase_schema.sql`:** tabel `app_access` (email PK, role, nip TEXT, nama, is_active, created_by, created_at, last_login) + **bootstrap admin** `simosdatangsel@gmail.com` (diambil dari `BOOTSTRAP_ADMIN_EMAIL` yang sudah diisi Dwi di Code.gs — bukan karangan) agar selalu ada satu admin yang bisa masuk.
- **`supabase_rls.sql` (BARU):** MENGAKTIFKAN RLS di semua tabel dengan kebijakan eksplisit per operasi untuk peran `anon`. Postur akses efektif setara sebelumnya (anon key publik), tetapi RLS tidak lagi dimatikan total dan struktur kebijakan siap diperketat (roadmap: Firebase JWT sebagai third-party auth → kebijakan berbasis klaim email/role).
- **`disable_rls.sql`:** dinonaktifkan (semua perintah dikomentari) — arsip legacy.
- **`migrate.ts`:** + migrasi sheet `app_access` → tabel `app_access` (dedupe email, role divalidasi, NIP string, upsert onConflict email).

### Perubahan `Code.gs` (WAJIB REDEPLOY — New deployment!)
- Konstanta `SUPABASE_URL`/`SUPABASE_ANON_KEY` + helper `supaGet_()` (UrlFetchApp → Supabase REST).
- `getConfig_()` → baca Supabase `system_config` (fallback sheet legacy hanya saat gangguan).
- `kirimNotifikasiBukuPenjagaan()` → baca `pegawai` dari **Supabase** (kolom: nama, nip, golongan, tgl_mulai_golongan, tgl_lahir, status, email, is_active) — email pengingat tidak lagi berbasis data basi.
- `resolveAccess_()` → cek `app_access` **Supabase** lebih dulu (dipakai `upload_foto`/`notifikasi_run`); "belum terdaftar"/"dinonaktifkan" dari Supabase bersifat final (tidak jatuh ke sheet basi); fallback sheet hanya saat Supabase tak terjangkau.
- Handler `whoami`/`user_*`/`get_config`/`set_config` masih ada (legacy, tak dipakai frontend).

---

## 3. TAHAP C — PENGUATAN MODUL KEPEGAWAIAN (core value)

1. **Filter Kelengkapan 9 kriteria** di halaman Pegawai (backlog resmi Tahap 5):
   - Dropdown "Kelengkapan: Semua / Data Lengkap / Belum Lengkap" di toolbar filter; ikut ter-reset oleh "Reset Filter".
   - Ringkasan header "X data lengkap · Y belum lengkap" kini **bisa diklik** sebagai toggle filter.
   - Memakai `hitungKelengkapan` dari pustaka bersama → angka filter SELALU identik dengan badge tabel & KPI Dashboard (prinsip satu definisi satu kebenaran).
2. **Deep-link dari Dashboard:** KPI "Data Lengkap" / "Belum Lengkap" kini tautan ke `/pegawai?kelengkapan=lengkap|belum`; halaman Pegawai membaca query param tersebut.
3. **Ekspor CSV Pegawai + Kelengkapan** (tombol "Ekspor CSV" di header):
   - Mengikuti FILTER AKTIF (yang tampil = yang terekspor).
   - Kolom: identitas inti + `JUMLAH ASET DIAMPU` + `KELENGKAPAN (%)` + `STATUS KELENGKAPAN` + `KRITERIA BELUM TERPENUHI`.
   - NIP & Kontak dibungkus `="..."` (presisi 18 digit aman di Excel); BOM UTF-8; nama berkas `SIKANDA_Pegawai_YYYYMMDD.csv` (komponen tanggal lokal).

---

## 4. STATUS VERIFIKASI (SESI INI)

- `npx tsc --noEmit` → **0 error** (dari 24)
- `npx vite build` → **sukses**; vendor identik baseline (react 425 / charts 376 / maps 154 / firebase 153 kB); `Pegawai` 30,6 kB (naik wajar: ekspor CSV + filter); `Dashboard` 24,6 kB
- `Code.gs` → `node --check` lolos
- Tak tersisa `window.confirm()`/GViz runtime di `src/` (GViz hanya di `migrate.ts` — memang alat migrasi)

**Belum bisa diuji dari sandbox (jaringan dibatasi):** koneksi nyata ke Supabase/Firebase/Gemini. Titik uji pertama Dwi ada di §5.

---

## 5. LANGKAH DEPLOY WAJIB (urut!)

1. **Supabase SQL Editor:** jalankan `supabase_schema.sql` (aman diulang; ikut membuat `app_access` + bootstrap admin), lalu **`supabase_rls.sql`**.
2. **Migrasi akun:** dari komputer, `npx tsx migrate.ts` (kini ikut memigrasikan sheet `app_access`). Bila sheet `app_access` kosong, daftarkan admin via Table Editor Supabase (bootstrap admin sudah ada dari langkah 1).
3. **Code.gs:** timpa seluruh isi dengan versi baru → **Deploy → New deployment** (bukan Save). Bila URL `/exec` berubah → perbarui `APPS_SCRIPT_URL` di `src/appsScriptConfig.ts`.
4. Upload zip ke **project BARU** Google AI Studio.
5. Uji berurutan: login Google (akun terdaftar `app_access` Supabase) → Dashboard tampil → klik KPI "Belum Lengkap" → halaman Pegawai terfilter → "Ekspor CSV" → Kelola Akun (daftar akun dari Supabase) → upload foto pegawai → Tanya SIKANDA.

---

## 6. ROADMAP TERSISA

### Prioritas tinggi
- [ ] Uji nyata alur login `app_access` Supabase di produksi (kasus: akun tidak terdaftar, akun nonaktif).
- [ ] Pengerasan RLS: Firebase JWT sebagai third-party auth Supabase → kebijakan per-role (struktur policy sudah siap per-operasi).
- [ ] Sheet `users` legacy (hash sandi) — pastikan spreadsheet lama tidak lagi dibagikan publik (aplikasi sudah tidak membacanya).

### Menengah
- [ ] Trigger harian `kirimNotifikasiBukuPenjagaan` (kini aman — data dari Supabase).
- [ ] Kolom EMAIL pegawai masih banyak kosong — gunakan filter "Belum Lengkap" + ekspor CSV kolom "KRITERIA BELUM TERPENUHI" sebagai daftar kerja pelengkapan.
- [ ] Bersih-bersih berkas duplikat sisa unggahan (`*-1.*`, `*-2.*`, `patch-*.ts`, `test-*.ts`) — tidak disentuh sesi ini demi keamanan.
- [ ] Ekspor laporan PDF; streaming jawaban AI.

---

*Digenerate pada akhir sesi Tahap 7 — Stabilisasi Baseline, Migrasi Total Supabase, Penguatan Kepegawaian.*
*Kode referensi: `SIKANDA_Tahap7_MigrasiSupabase_PenguatanKepegawaian.zip`*
