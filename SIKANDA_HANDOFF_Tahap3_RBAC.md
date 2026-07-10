# SIKANDA — Handoff Tahap 3: RBAC + Login Google (Firebase)

**Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah**
Dinas Cipta Karya dan Tata Ruang — Kota Tangerang Selatan

> Dokumen ini merangkum seluruh perubahan Tahap 3 untuk kelanjutan lintas sesi & lintas platform
> (Claude.ai ↔ Google AI Studio). Bahasa pengantar: Indonesia.

---

## 1. Ringkasan Tahap 3

Tahap 3 mengubah SIKANDA dari aplikasi sesi-tunggal (`admin/admin`) menjadi sistem **multi-pengguna
berbasis peran** dengan **Login Google (Firebase)** dan **otorisasi server-side**. Prinsip yang
dipegang: **sheet `pegawai` tetap satu-satunya sumber kebenaran data kepegawaian**; data migrasi
SIMOSDA (`users`/`roles`/`menus`/aset) hanya pelengkap dan **tidak disentuh** oleh kode. Daftar siapa
yang boleh masuk dipindah ke **satu sheet baru `app_access`** (gerbang tunggal), terpisah dari semua
artefak legacy.

Tiga peran:
| Peran | Cakupan |
|-------|---------|
| **admin** | Akses penuh + Kelola Akun + setting (BUP) + (nanti) cleansing |
| **pimpinan** | Akses penuh **tanpa** Kelola Akun |
| **pegawai** | Lihat semua modul + **edit profil baris NIP-nya sendiri** (field terbatas) |

Field yang boleh diedit pegawai (baris sendiri): `foto, kontak, email, tingkat, pendidikan_jurusan,
universitas, tahun_lulus, riwayat_diklat, tahun_diklat`. Sisanya dikunci di UI **dan** di server.

---

## 2. Arsitektur Autentikasi & Otorisasi

```
Pengguna → "Masuk dengan Google" (popup Firebase)
        → frontend dapat idToken
        → tiap permintaan TULIS membawa idToken ke Apps Script
        → backend verifyFirebaseToken_ (Identity Toolkit accounts:lookup, pakai FIREBASE_API_KEY)
        → email cocokkan ke sheet app_access → peran (admin/pimpinan/pegawai) + nip
        → enforcement per-aksi & per-kepemilikan-baris SEBELUM menulis
```

- **Sumber kebenaran peran = backend (`whoami`)**, bukan `localStorage`. AppShell selalu menyegarkan
  peran lewat `whoami` saat status auth Firebase berubah, sehingga `localStorage` tak bisa dipalsukan
  untuk menaikkan hak akses.
- **Dua lapis pertahanan:** UI menyembunyikan/mengunci kontrol sesuai peran, **dan** backend tetap
  menolak/menstrip permintaan terlarang (mis. pegawai mengirim field di luar daftar → dibuang server).

---

## 3. Sheet Baru `app_access`

Dibuat **otomatis** oleh backend (`ensureAccessSheet_`) bila belum ada. Kolom:

| email | role | nip | nama | is_active | created_by | created_at | last_login |
|-------|------|-----|------|-----------|------------|------------|------------|

- `email` = kunci (huruf kecil). `role` ∈ {admin, pimpinan, pegawai}. Untuk `pegawai`, `nip` **wajib**
  (menautkan akun ke baris miliknya di sheet `pegawai`).
- Kolom `nip` dipaksa **format teks** agar 18 digit tidak rusak.
- Sheet `users`/`roles`/`menus` legacy **tidak dipakai & tidak disentuh** kode.

---

## 4. Berkas yang Ditambah / Diubah

### Baru
- `src/lib/firebase.ts` — init Firebase + `signInWithGoogle()` (popup, `select_account`, kembalikan
  `{email,name,idToken}`), `getFirebaseIdToken()`, `firebaseSignOut()`, `onFirebaseAuth(cb)`.
- `src/lib/rbac.ts` — kontrak izin tunggal: `Role`, `AppUser`, `MenuKey`, `Action`, `EDITABLE_FIELDS_OWN`,
  dan fungsi `canViewMenu`, `can`, `isOwnRow`, `canEditPegawaiRow`, `canEditField`, `visibleMenus`.
- `src/pages/KelolaAkun.tsx` — halaman admin: daftar akun, tambah/edit (modal), nonaktifkan (soft),
  **"Tarik dari sheet pegawai"**, layar **Akses Ditolak** bila backend menolak non-admin.

### Diubah
- `src/components/layout/AppShell.tsx` — `AuthContext` sesi nyata (`SESSION_KEY="sikanda_session"`,
  `DEV_KEY="sikanda_dev"`); `loginWithGoogle`, `loginDev` (khusus DEV), `logout`; sidebar & route
  difilter `canViewMenu(role)`; item menu **Kelola Akun** (admin).
- `src/pages/Login.tsx` — tombol **"Masuk dengan Google"** + pesan "hanya akun terdaftar"; tombol DEV
  `admin/admin` **hanya** muncul di balik `import.meta.env.DEV` (otomatis hilang di build produksi).
- `src/services/apiService.ts` — `buildAuth()` melampirkan `idToken` (atau `secret` saat transisi);
  method baru `whoami`, `userList`, `userSave`, `userDelete`, `userSeedFromPegawai`; tipe `AccessUser`,
  `WhoamiResult`.
- `src/App.tsx` — `MenuGuard` (tolak akses URL langsung ke menu yang tak diizinkan); route
  `/kelola-akun` dibungkus `<MenuGuard menu="kelola-akun">`.
- `src/pages/Pegawai.tsx` — gating tombol Tambah (`pegawai.create`), Edit (`canEditPegawaiRow`),
  Hapus (`pegawai.delete`); kirim `user` ke form.
- `src/components/ui/PegawaiFormModal.tsx` — penguncian field per-peran (`canEditField`); tombol foto
  Galeri/Kamera `disabled` bila tak berhak. (Catatan: bug §5 fokus form **sudah** beres dari paket
  sebelumnya — `Field`/`SectionTitle` di scope modul; tidak diubah lagi.)
- `apps-script/Code.gs` — lihat §5.
- `vite.config.ts` — tambah chunk `vendor-firebase` (Firebase Auth dipisah dari entry utama).
- `apps-script/README_DEPLOY.md` — ditulis ulang untuk setup Firebase + `app_access` + transisi.

---

## 5. Kontrak Backend (`apps-script/Code.gs`)

Konstanta atas (yang relevan):
- `SHEET_ACCESS = 'app_access'`
- `FIREBASE_API_KEY` — **sudah terisi** (API key web publik, sama dengan `firebase.ts`).
- `BOOTSTRAP_ADMIN_EMAIL = ''` — **WAJIB diisi Dwi** (email admin pertama; selalu dianggap admin).
- `ALLOW_LEGACY_SECRET = true` — jendela transisi (lihat §7).
- `EDITABLE_OWN[]` — cermin `EDITABLE_FIELDS_OWN` di rbac.ts.

Alur & fungsi inti: `authenticate_(body)` (idToken → `verifyFirebaseToken_` via Identity Toolkit; atau
secret transisi → admin) · `resolveAccess_(email)` (BOOTSTRAP → admin; cari `app_access`; nonaktif/tak
terdaftar → tolak; update `last_login`) · `ensureAccessSheet_()` · guard `isManager_/requireManage_/
requireAdmin_` · `guardPegawaiSave_` (pegawai hanya baris sendiri + strip field terlarang) ·
`guardUploadFoto_`.

Router `doPost` (semua diautentikasi lebih dulu):
- `whoami` → kembalikan `{email, role, nip, nama}`.
- `pegawai_save` → `guardPegawaiSave_` (manager bebas; pegawai own-row + field terbatas, `isNew=false`).
- `pegawai_delete`, `set_config`, `notifikasi_run` → `requireManage_` (admin/pimpinan).
- `upload_foto` → `guardUploadFoto_`.
- `user_list` / `user_save` / `user_delete` (soft `is_active=FALSE`) / `user_seed_from_pegawai`
  → `requireAdmin_` (admin saja).

`userSeedFromPegawai_`: untuk tiap pegawai aktif ber-NIP yang belum terdaftar → buat akun `pegawai`;
email dari kolom `EMAIL` pegawai bila ada & bukan placeholder `simosdatangsel@gmail.com`; bila kosong,
akun dibuat **NONAKTIF** (admin lengkapi email lalu aktifkan).

---

## 6. Tugas Deploy (Dwi) — ringkas

Detail lengkap di `apps-script/README_DEPLOY.md`. Inti:
1. Tempel `Code.gs`, isi `BOOTSTRAP_ADMIN_EMAIL` (email Anda), simpan, **deploy** Web App.
2. Isi `APPS_SCRIPT_URL` (+ `APPS_SCRIPT_SECRET` sementara) di `src/appsScriptConfig.ts`.
3. **Firebase Console** → Authentication → aktifkan provider **Google** → **Authorized domains**:
   tambah `localhost` & domain GitHub Pages Anda (mis. `username.github.io`).
4. Masuk sebagai admin → menu **Kelola Akun** → **Tarik dari sheet pegawai** dan/atau tambah akun
   pimpinan/pegawai → lengkapi EMAIL untuk akun yang nonaktif.
5. **Higiene keamanan mendesak:** hapus sheet `users` legacy (berisi hash sandi 158 orang, terbaca
   publik via Visualization API). Idealnya hapus juga `roles` & `menus`.

---

## 7. Jendela Transisi & Cara Menutupnya

Selama `ALLOW_LEGACY_SECRET = true`, backend menerima **idToken** *atau* **secret lama**, agar migrasi
tidak memutus akses. Setelah Login Google terbukti jalan (masuk sebagai admin, tambah ≥1 akun, tulis
data), **tutup**:
1. `Code.gs`: `ALLOW_LEGACY_SECRET = false` → **redeploy**.
2. `src/appsScriptConfig.ts`: kosongkan `APPS_SCRIPT_SECRET` (`""`).

---

## 8. Status Build (terverifikasi di sesi ini)

- `npx tsc --noEmit` → **0 error**.
- `npx vite build` → **sukses**, tanpa warning >500 kB. Chunk utama:
  - `index` ≈ **245,43 kB** (gzip 80,96) — entry kembali ramping setelah Firebase dipisah.
  - `vendor-firebase` ≈ **152,99 kB** (gzip 31,42) — **baru**, hanya untuk login.
  - `vendor-react` 425,51 · `vendor-charts` 375,53 · `vendor-maps` 154,15 · `summary` 11,05
    (identik dengan baseline). `KelolaAkun` lazy ≈ 13,26 kB.

---

## 9. Yang Belum / Tahap Berikutnya

- **Tahap 3-Lanjut (baca privat):** pembacaan data masih lewat Google Visualization API publik. Untuk
  menutup kebocoran baca, perlu proxy baca lewat backend (idToken) — **tahap terpisah**. Mitigasi
  paling mendesak sekarang: hapus sheet `users` legacy (§6.5).
- **Tahap 6 (Fuzzy data cleansing):** tetap di backlog (butuh desain backend), aksi `cleansing.manage`
  sudah dicadangkan di rbac.ts.
- **WhatsApp notifikasi:** ditangguhkan (tak lagi gratis pada skala yang dibutuhkan).

---

## 10. Aturan Proyek yang Tetap Berlaku

Semua balasan Bahasa Indonesia · desain disepakati sebelum koding · tanpa bug/data palsu · responsif
penuh · `NIP` selalu string · tipe React konservatif (tanpa `@types/react`, pakai pola props mandiri)
· `tsc --noEmit` = cek build otoritatif · tanggal `DD-MM-YYYY` pakai komponen lokal · logika dipusatkan
(rbac.ts, summary.ts, penjagaan.ts) · tiap fase = `.zip` bersih (tanpa `node_modules`/`dist`) + handoff.
