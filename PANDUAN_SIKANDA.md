# 📘 PANDUAN LENGKAP SIKANDA — Tahap 0 + 1 + 2

**Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah**
Dokumen ini memandu Anda menerapkan seluruh perubahan di **Google AI Studio** sekaligus memasang **backend gratis (Google Apps Script)** untuk CRUD, upload foto, multi-user, dan notifikasi email.

> **Inti perubahan:** SIKANDA kini berpusat pada **data kepegawaian** (sumber kebenaran = sheet `pegawai`, 24 kolom), dengan aset sebagai pelengkap. Semua bug, data palsu, dan data tertukar yang ditemukan sudah dibersihkan. Backend gratis menjamin tidak ada kehilangan data saat banyak orang menyimpan bersamaan.

---

## ✅ APA YANG SUDAH DIKERJAKAN (ringkas)

| Tahap | Isi | Status |
|------|-----|--------|
| **Tahap 0** | Bersihkan bug & data palsu pada lapisan baca (read-layer) | ✔ Selesai |
| **Tahap 1** | Backend Apps Script: CRUD aman, foto→Drive, email otomatis | ✔ Selesai |
| **Tahap 2** | Form pegawai 24 kolom penuh + upload foto (galeri & kamera) + hapus (soft delete) | ✔ Selesai |

**Bug penting yang diperbaiki:**
1. **Kehilangan data saat Edit** — dulu kolom yang tidak ada di form (mis. `EMAIL`) terhapus tiap menyimpan. Sekarang sel yang tidak diedit **dipertahankan**.
2. **Data palsu** — angka acak (`Math.random`) pada prakiraan pemeliharaan, avatar palsu (pravatar), dan badge notifikasi yang di-*hardcode* ke "2" sudah **dihapus total**.
3. **Notifikasi tidak pernah muncul** — filter lonceng salah membandingkan status; kini berbasis tenggat nyata (KGB/Pangkat/Pensiun ≤ 6 bulan).
4. **Tanggal ambigu** — kini dinormalkan otomatis ke format Indonesia (lihat bagian Format Tanggal).

---

## 📂 DAFTAR FILE YANG BERUBAH

Karena **Google AI Studio kadang tidak bisa meng-*import* file .zip langsung**, di bawah ini daftar persis file yang perlu Anda **buat/timpa** isinya (salin dari folder di dalam .zip ke file dengan nama sama di AI Studio).

### 🔄 File DIUBAH (timpa isinya)
- `src/lib/utils.ts` — mesin tanggal Indonesia + perbaikan bug nilai 0.
- `src/types.ts` — tambah field `email` & `is_active` pada Pegawai.
- `src/services/spreadsheetService.ts` — hapus data acak/pravatar, tambah baca `email`, lewati data soft-deleted & dummy.
- `src/components/layout/AppShell.tsx` — hapus simulasi palsu, perbaiki badge notifikasi.
- `src/components/ui/PegawaiFormModal.tsx` — **form 24 kolom penuh** + foto galeri/kamera.
- `src/pages/Pegawai.tsx` — pakai backend baru + tombol Hapus.
- `metadata.json` — nama aplikasi → "SIKANDA".

### 🆕 File BARU (buat baru)
- `src/appsScriptConfig.ts` — tempat menempel URL & token backend.
- `src/services/apiService.ts` — jalur aman frontend → backend.
- `apps-script/Code.gs` — **backend** (disalin ke editor Apps Script, bukan ke AI Studio).
- `apps-script/README_DEPLOY.md` — langkah deploy backend.
- `PANDUAN_SIKANDA.md` — dokumen ini.

### 🗑️ File DIHAPUS
- `src/services/googleSheetsApi.ts` — jalur tulis lama yang tidak aman. **Hapus file ini di AI Studio.**

---

## 🚀 URUTAN PEMASANGAN (ikuti berurutan)

Ada **2 sisi**: **(A) Backend** di Apps Script, dan **(B) Frontend** di Google AI Studio. Kerjakan **A dulu**, karena B membutuhkan URL hasil dari A.

### ════════ BAGIAN A — PASANG BACKEND (sekali saja, ±10 menit) ════════

> Panduan rinci ada di `apps-script/README_DEPLOY.md`. Ringkasnya:

1. Buka **[script.google.com](https://script.google.com)** → **New project**.
2. Hapus isi `Code.gs` bawaan, **tempel seluruh isi** `apps-script/Code.gs` dari .zip.
3. Di bagian **KONFIGURASI** paling atas:
   - Pastikan `SPREADSHEET_ID` sudah benar (sudah terisi ID Anda).
   - Ganti `SHARED_SECRET` dari `'GANTI_DENGAN_TOKEN_RAHASIA_ANDA'` menjadi **token acak panjang** buatan Anda (mis. `'sikanda-7f3a9c2e8b14d6'`). **Catat token ini.**
4. **Deploy** → **New deployment** → tipe **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Klik **Deploy** → **Authorize access** → izinkan.
5. **Salin URL** yang berakhiran **`/exec`**. Inilah `APPS_SCRIPT_URL`.

### ════════ BAGIAN B — TERAPKAN FRONTEND DI AI STUDIO ════════

1. **Hapus** file `src/services/googleSheetsApi.ts`.
2. **Timpa & buat** semua file sesuai daftar di atas (salin isi dari .zip).
3. Buka `src/appsScriptConfig.ts`, isi **2 baris**:
   ```ts
   export const APPS_SCRIPT_URL: string = "TEMPEL_URL_/exec_DI_SINI";
   export const APPS_SCRIPT_SECRET: string = "TOKEN_YANG_SAMA_DENGAN_Code.gs";
   ```
   > Token di sini **wajib sama persis** dengan `SHARED_SECRET` di `Code.gs`.
4. Jalankan / preview aplikasi. Selesai.

> Selama `APPS_SCRIPT_URL` masih kosong, aplikasi **tetap jalan & tidak crash** — hanya saja operasi simpan/hapus akan memberi pesan "backend belum dikonfigurasi". Jadi aman dipasang bertahap.

---

## ⚙️ SETUP `system_config` (BUP + Email)

Di Spreadsheet Anda, buka sheet **`system_config`** dan tambahkan baris berikut (kolom: `config_key`, `config_value`, `config_group`):

| config_key | config_value | config_group |
|-----------|--------------|--------------|
| `BUP_USIA` | `58` | `kepegawaian` |
| `NOTIF_ADMIN_EMAIL` | `email-admin-anda@domain.go.id` | `notifikasi` |
| `NOTIF_WINDOW_HARI` | `180` | `notifikasi` |

- **`BUP_USIA`** — batas usia pensiun. Administrator cukup mengubah angka di sel ini (default 58).
- **`NOTIF_ADMIN_EMAIL`** — penerima rekap (Pola A).
- **`NOTIF_WINDOW_HARI`** — seberapa jauh ke depan tenggat diingatkan (180 hari = 6 bulan).

### Mengaktifkan email otomatis harian
Di editor Apps Script: ikon ⏰ **Triggers** → **Add Trigger** → fungsi **`kirimNotifikasiBukuPenjagaan`** → *Time-driven* → *Day timer* → pilih jam (mis. 07.00). Simpan & otorisasi.

Email yang terkirim:
- **Pola A** — satu email rekap ke admin berisi semua pegawai yang KGB/Pangkat/Pensiun-nya mendekat.
- **Pola B** — email personal ke tiap pegawai yang punya alamat di kolom `EMAIL`.

---

## 🧹 HIGIENE DATA (penting, sekali saja)

1. **Kolom NIP harus berformat Teks (Plain text).**
   Blok kolom NIP → menu **Format → Number → Plain text**. NIP 18 digit jika dianggap angka akan kehilangan presisi (berubah jadi notasi ilmiah). Backend juga memaksa teks, tapi merapikan yang lama tetap perlu.
2. **Baris dummy** (`KETERANGAN = "DATA DUMMY"`, atau nama seperti `FULAN2`) sudah otomatis **disembunyikan** aplikasi. Bila ingin, hapus manual dari sheet.
3. Pastikan nama sheet persis: `pegawai`, `system_config`, `attachments` (huruf kecil).

---

## 📅 FORMAT TANGGAL (otomatis)

Anda tidak perlu merapikan tanggal manual. Sistem:
- **Menyimpan** sebagai teks kanonik `DD-MM-YYYY` (mis. `13-06-1968`) agar tidak pernah ditafsir ganda.
- **Menampilkan** cantik di layar sebagai **`13 Juni 1968`**.
- Mengenali aneka input lama (teks Indonesia/Inggris, tanggal asli, spasi berlebih) dan menormalkannya.

---

## 🧪 CHECKLIST PENGUJIAN (lakukan setelah pasang)

- [ ] Buka Dashboard → angka KPI muncul (bukan 0), tanpa layar putih.
- [ ] Menu Pegawai → daftar tampil, foto muncul / fallback rapi bila kosong.
- [ ] **Tambah** pegawai baru → tersimpan & muncul di tabel.
- [ ] **Edit** pegawai → ubah 1 field, simpan → field lain (mis. EMAIL) **tidak hilang**.
- [ ] **Upload foto** (galeri) → foto muncul di profil. Coba juga **kamera** di HP.
- [ ] **Hapus** pegawai → hilang dari daftar, tapi baris di sheet masih ada (`is_active=FALSE`).
- [ ] Dua orang menyimpan hampir bersamaan → keduanya berhasil, tidak ada yang tertimpa.
- [ ] Jalankan manual `kirimNotifikasiBukuPenjagaan` di Apps Script → email rekap masuk.
- [ ] Lonceng notifikasi menampilkan jumlah nyata (bukan selalu 0 / selalu 2).

---

## 🔭 RENCANA LANJUTAN (belum dikerjakan — menunggu persetujuan)

- **Tahap 3** — Login Google asli (Firebase) dipetakan ke sheet `users` + hak akses menu (RBAC).
- **Tahap 4** — Halaman khusus **Buku Penjagaan** (KGB / Kenaikan Pangkat / Pensiun) yang rapi & bisa difilter.
- **Tahap 5** — Pemolesan UI, optimasi, dan *code-splitting* untuk memperkecil ukuran bundel.

> WhatsApp **belum** disertakan: sejak pertengahan 2025 notifikasi WhatsApp yang dikirim sistem **berbayar per pesan**. Maka untuk menjaga syarat "semua gratis", kanal resmi saat ini = **email otomatis**. Bila nanti Anda siap berbayar, WhatsApp bisa ditambahkan.

---

## ❓ JIKA ADA MASALAH

- **"Backend belum dikonfigurasi"** → `APPS_SCRIPT_URL` di `appsScriptConfig.ts` masih kosong/salah.
- **Simpan gagal / 401** → token `APPS_SCRIPT_SECRET` ≠ `SHARED_SECRET` di `Code.gs`.
- **Foto tidak muncul** → pastikan deployment Web App *Who has access* = **Anyone**, dan sudah *Authorize*.
- **Email tidak terkirim** → cek trigger terpasang & `NOTIF_ADMIN_EMAIL` terisi; kuota MailApp gratis ±100 email/hari.

Setiap kali Anda mengubah `Code.gs`, lakukan **Deploy → Manage deployments → Edit → New version** agar perubahan aktif.
