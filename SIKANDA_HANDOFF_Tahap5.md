# HANDOFF PROMPT — SIKANDA Tahap 5 (Kelengkapan Data + Tanya SIKANDA)

> **Instruksi model:** Baca seluruh dokumen ini bersama `SIKANDA_HANDOFF_Tahap3_RBAC.md` sebelum merespons. Jangan menulis kode apapun tanpa konfirmasi desain (pertanyaan bernomor, maksimal 3). Semua balasan wajib **Bahasa Indonesia**. Aturan kerja non-negotiable Tahap 4 tetap berlaku penuh.

---

## 1. YANG DIKERJAKAN DI TAHAP 5 (SESI INI)

### A. Fitur 1 — Kelengkapan Data Pegawai + Relasi Aset (Core Value)

**Definisi "lengkap" (9 kriteria, disepakati Dwi):**
1. NIP valid 18 digit numerik
2. Jabatan terisi
3. Golongan terisi
4. TMT Golongan terisi
5. Tanggal Lahir terisi
6. Foto terisi
7. Email terisi
8. Kontak terisi
9. Relasi nama ↔ aset **bersih**: `match_quality !== "fuzzy"` DAN tidak ada temuan Levenshtein (`scanAssetNameMismatches`) yang menunjuk NIP pegawai tersebut. Pegawai tanpa aset = bersih.

**File baru:** `src/lib/kelengkapan.ts`
- `buildUnifiedAssets(vehicles, equipment, inventory)` — bentuk baku baris aset, **satu definisi bersama** (Cleansing.tsx di-refactor untuk memakainya; getDashboardMetrics & Pegawai.tsx juga)
- `buildFuzzyNipSet(pegawaiList, unifiedAssets)` — Set NIP target temuan fuzzy
- `hitungKelengkapan(p, fuzzyNipSet)` → `{ persen, lengkap, terpenuhi, total, missing[] }`
- `rekapKelengkapan(list, fuzzyNipSet)` → `{ lengkap, belum, rataRata, fieldKosong[] }`

**UI:**
- `src/pages/Pegawai.tsx`: kolom **"Kelengkapan"** di tabel desktop (badge % hijau 100 / amber ≥70 / merah <70, tooltip merinci kriteria yang kurang), badge yang sama di kartu mobile, ringkasan "X data lengkap · Y belum lengkap" di subtitle header. Komponen `KelengkapanBadge` di module scope (aturan #9).
- `src/pages/Dashboard.tsx`: section baru **"Kelengkapan Data Pegawai & Relasi Aset"** (setelah Buku Penjagaan) — KPI "Data Lengkap" + "Belum Lengkap" (subtitle rata-rata %) + chart "Kriteria yang Paling Sering Belum Terpenuhi". `HorizontalBarChart` diberi prop opsional `labelClass` (default `w-16`, tidak mengubah pemakaian lama).
- `src/types.ts`: `DashboardMetrics` + `kelengkapanLengkap?`, `kelengkapanBelum?`, `kelengkapanRata?`, `kelengkapanFieldKosong?`.
- `src/services/spreadsheetService.ts`: `getDashboardMetrics()` menghitung rekap kelengkapan (aset sudah tersedia di scope itu).

### B. Fitur 2 — Menu "Tanya SIKANDA" (chat AI, Groq)

**Arsitektur keamanan (disepakati):** frontend TIDAK pernah memegang API key Groq. Alur:
```
TanyaSikanda.tsx → buildDataContext() (data nyata dari spreadsheetService, per sesi)
  → apiService.askAI(question, history, dataContext)  [+ idToken Firebase]
  → Code.gs action `ai_ask` → GROQ_API_KEY dari Script Properties
  → https://api.groq.com/openai/v1/chat/completions (model: llama-3.3-70b-versatile)
```

**Keputusan penting di Code.gs:** `ai_ask` ditangani **SEBELUM** `LockService` diambil — panggilan AI bisa 5–20 detik dan tidak menulis sheet; bila di dalam lock, satu chat memblokir seluruh operasi tulis pengguna lain. Jangan pindahkan ke dalam switch-case ber-lock.

**Kebijakan (disepakati Dwi):** semua role (admin/pimpinan/pegawai) boleh bertanya tentang seluruh data; topik dibatasi konteks SIKANDA (ditegakkan system prompt, termasuk anti prompt-injection sederhana); riwayat hanya per sesi (state React).

**File baru:**
- `src/lib/tanya.ts` — `buildDataContext()`: pegawai (13 field/baris), agenda penjagaan (via `buildPenjagaanEvents` + `sisaWaktuLabel`), 3 kelompok aset, konfigurasi. ±30–40 KB teks.
- `src/pages/TanyaSikanda.tsx` — chat gaya WhatsApp: bubble kiri/kanan + jam, indikator mengetik, sapaan pembuka lokal, 4 chip saran pertanyaan, Enter kirim / Shift+Enter baris baru, tombol bersihkan sesi, bubble error tidak ikut dikirim sebagai history, disclaimer AI. Toolbar/header memakai `div` polos (aturan #7).

**File diubah:** `rbac.ts` (MenuKey `"tanya"` di ALL_MENUS semua role), `AppShell.tsx` (ikon `MessagesSquare`, item sidebar sebelum Kelola Akun), `App.tsx` (lazy route `/tanya`), `apiService.ts` (`askAI`), `apps-script/Code.gs` (konfigurasi Groq, handler pre-lock, fungsi `aiAsk_`; history dibatasi 10 pesan & role dibersihkan; dataContext dipotong 80k; pertanyaan dipotong 2k).

---

## 2. LANGKAH DEPLOY YANG WAJIB DILAKUKAN DWI

1. **Salin `apps-script/Code.gs` terbaru** ke editor Apps Script (timpa seluruh isi).
2. **Script Properties:** Project Settings (ikon gerigi) → Script Properties → Add property:
   - Key: `GROQ_API_KEY`
   - Value: API key dari https://console.groq.com/keys (yang bernama `SIKANDA_API`, format `gsk_...`)
3. **Deploy → New deployment** (bukan Save/edit deployment lama) → Web app → Execute as: Me → Access: Anyone.
4. Jika URL `/exec` berubah, perbarui `APPS_SCRIPT_URL` di `src/appsScriptConfig.ts`.
5. Upload zip ke **project BARU** di Google AI Studio (jangan project lama yang ter-cache).
6. Uji: login → menu "Tanya SIKANDA" → klik salah satu chip saran → jawaban harus berbasis data nyata.

**Catatan model AI:** `llama-3.3-70b-versatile` (konstanta `GROQ_MODEL` di Code.gs). Jika Groq menghentikan model ini, cukup ganti konstanta lalu New Deployment.

---

## 3. STATUS VERIFIKASI (SESI INI)

- `npx tsc --noEmit` → **0 error**
- `npx vite build` → **sukses**; chunk vendor identik baseline (react 425/charts 376/maps 154/firebase 153 kB); chunk baru `TanyaSikanda` 11,2 kB; `Pegawai` 27,6 kB; `Dashboard` 24,5 kB
- `Code.gs` → tervalidasi `node --check` (sintaks OK)
- Satu error tsc ditemukan & diperbaiki saat pengembangan: prop `key` pada komponen `Bubble` harus dideklarasikan manual (`{ key?: any; msg: ChatMsg }`) karena `@types/react` tidak terpasang — pola sama dengan `AssetCard`.

**Belum bisa diuji dari sandbox:** panggilan nyata ke Groq (butuh API key & jaringan). Titik uji pertama Dwi: pastikan Script Property terpasang; error "GROQ_API_KEY belum diatur" berarti langkah 2 terlewat.

---

## 4. ROADMAP TERSISA (dari Tahap 4, masih berlaku)

### Prioritas Tinggi
- [ ] **Lapis Baca Privat** — sheet `users` legacy (hash sandi 158 orang) masih terbaca publik via GViz. MENDESAK.
- [ ] Tutup jendela transisi: `ALLOW_LEGACY_SECRET = false` + hapus `APPS_SCRIPT_SECRET` di frontend.

### Menengah
- [ ] Trigger harian notifikasi email (fungsi sudah ada, tinggal set time-based trigger)
- [ ] Export laporan PDF; konsistensi ikon dark mode
- [ ] Kolom EMAIL pegawai masih banyak kosong — kini terlihat jelas di chart Kelengkapan Dashboard sebagai pendorong utama "Belum Lengkap"

### Backlog baru Tahap 5
- [ ] Uji nyata `ai_ask` di produksi (kualitas jawaban, latensi, rate limit Groq free tier)
- [ ] Opsional: filter tabel Pegawai berdasar kelengkapan (klik badge → filter), streaming jawaban AI

---

*Dokumen ini digenerate pada akhir sesi Tahap 5 — Kelengkapan Data (Core Value) & Tanya SIKANDA.*
*Kode referensi: `SIKANDA_Tahap5_KelengkapanData_TanyaSIKANDA.zip`*
