# SIKANDA — Public Safe GitHub Deploy

SIKANDA adalah Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah.
Paket ini sudah disiapkan agar source code layak disimpan pada repository GitHub public: tidak ada Apps Script secret, Gemini API key, Supabase URL/key operasional, atau konfigurasi Firebase operasional yang ditulis langsung di source.

## Arsitektur Public-Safe

```text
React + Vite + TypeScript
        │
        ├── Firebase Authentication
        │     └── Login Google dan idToken
        │
        ├── Google Apps Script Web App
        │     ├── Verifikasi Firebase idToken
        │     ├── Cek role di Supabase app_access
        │     ├── Proxy baca/tulis Supabase
        │     ├── Upload foto ke Google Drive
        │     └── Tanya SIKANDA via Gemini
        │
        └── Supabase PostgreSQL
              └── Diakses dari Apps Script memakai key server-side
```

## Kenapa aman untuk GitHub public?

- Frontend tidak lagi menyimpan `APPS_SCRIPT_SECRET`.
- Frontend tidak lagi menyimpan `GEMINI_API_KEYS`.
- Frontend tidak lagi menulis langsung ke Supabase.
- Firebase config dan URL Apps Script dibaca dari environment variable.
- Supabase service role key hanya disimpan di Apps Script Script Properties.
- Gemini API key hanya disimpan di Apps Script Script Properties.

## Environment Variable Frontend

Isi di Google AI Studio atau GitHub Actions Secrets:

```env
VITE_APPS_SCRIPT_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
```

## Script Properties Apps Script

Buka Apps Script → Project Settings → Script properties, lalu isi:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
FIREBASE_API_KEY
GEMINI_API_KEY
BOOTSTRAP_ADMIN_EMAIL
DRIVE_FOLDER_NAME
SPREADSHEET_ID                 optional, hanya untuk fallback attachment legacy
ALLOW_LEGACY_SECRET            false
```

Nilai `SUPABASE_SERVICE_ROLE_KEY` wajib disimpan hanya di Apps Script. Jangan pernah dimasukkan ke frontend, GitHub, Google AI Studio env, atau file `.env` yang ikut commit.

## Cara Pakai di Google AI Studio

1. Upload ZIP ini ke Google AI Studio.
2. Isi Environment Variable frontend.
3. Pastikan `apps-script/Code.gs` sudah disalin ke Apps Script dan dideploy sebagai Web App.
4. Pastikan email admin sudah ada di tabel `app_access` Supabase dengan `role = admin` dan `is_active = true`.
5. Preview aplikasi dan login memakai Google.

## Cara Deploy ke GitHub Pages

1. Buat repository public, misalnya `sikanda`.
2. Push seluruh isi project.
3. Repository → Settings → Secrets and variables → Actions → isi semua `VITE_*` di atas.
4. Repository → Settings → Pages → Source: GitHub Actions.
5. Push ke branch `main`.

## Validasi Wajib

```bash
npm ci
npx tsc --noEmit
npm run build
```

## Catatan Supabase

Paket ini menghilangkan credential Supabase dari frontend. Untuk hardening maksimal, jalankan policy RLS yang tidak memberikan akses tulis bebas kepada `anon`. Karena aplikasi sudah memakai Apps Script sebagai proxy, kunci service role cukup berada di backend Apps Script.


## Catatan Paket AI Studio Public-Safe
Paket ini sengaja tidak menyertakan runtime direct Supabase Supabase env frontend dan tidak menyertakan `migrate.ts`, agar Google AI Studio tidak meminta secret Supabase di frontend. Seluruh akses data berjalan melalui Apps Script backend dengan Firebase idToken.
