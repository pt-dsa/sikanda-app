# Deploy Backend Apps Script SIKANDA — Public Safe

## 1. Salin Code.gs

Buka Google Apps Script project backend SIKANDA, lalu ganti isi `Code.gs` dengan file `apps-script/Code.gs` dari paket ini.

## 2. Isi Script Properties

Apps Script → Project Settings → Script properties → Add script property.

Wajib:

| Key | Isi |
|---|---|
| `SUPABASE_URL` | URL project Supabase, contoh `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key. Jangan taruh di frontend/GitHub. |
| `FIREBASE_API_KEY` | Firebase Web API key dari project Authentication |
| `GEMINI_API_KEY` | API key Gemini untuk Tanya SIKANDA |
| `BOOTSTRAP_ADMIN_EMAIL` | Email admin pertama |
| `DRIVE_FOLDER_NAME` | Nama folder Google Drive untuk foto, contoh `SIKANDA_Foto_Pegawai` |
| `ALLOW_LEGACY_SECRET` | Isi `false` untuk mode public-safe |

Opsional:

| Key | Isi |
|---|---|
| `SPREADSHEET_ID` | Spreadsheet legacy, hanya untuk attachment fallback/arsip |
| `SHARED_SECRET` | Tidak dipakai jika `ALLOW_LEGACY_SECRET=false` |

## 3. Deploy Web App

1. Klik Deploy → New deployment.
2. Type: Web app.
3. Execute as: Me.
4. Who has access: Anyone.
5. Copy URL `/exec`.
6. Masukkan URL tersebut ke env frontend `VITE_APPS_SCRIPT_URL`.

## 4. Test

Buka URL `/exec` di browser. Respons normal:

```json
{"ok":true,"service":"SIKANDA","time":"..."}
```

Untuk operasi POST, frontend akan mengirim Firebase idToken. Backend akan memverifikasi token dan mencocokkan email ke Supabase `app_access`.
