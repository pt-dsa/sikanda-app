import assert from "node:assert/strict";
import fs from "node:fs";
import { sessionNeedsRefresh } from "../src/lib/authSession";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const backend = read("apps-script/Code.gs");
const login = read("src/pages/Login.tsx");
const captcha = read("src/components/auth/LogoSliderCaptcha.tsx");
const shell = read("src/components/layout/AppShell.tsx");
const client = read("src/services/backendClient.ts");
const authService = read("src/services/authService.ts");
const accounts = read("src/pages/KelolaAkun.tsx");
const migration = read("supabase/009_sikanda_v1_1_16_supabase_auth.sql");
const pkg = read("package.json");
const env = read(".env.example");

assert(!pkg.includes('"firebase"'), "dependensi Firebase Auth harus dihapus");
assert(!env.includes("VITE_FIREBASE_"), "environment frontend tidak boleh lagi meminta konfigurasi Firebase Auth");
assert(!backend.includes("FIREBASE_API_KEY") && !backend.includes("verifyFirebaseToken_"), "Apps Script tidak boleh menyisakan verifikasi Firebase");

for (const field of ["NIP", "Password", "Registrasi", "Email yang Didaftarkan Administrator/Pimpinan"]) {
  assert(login.includes(field), `halaman autentikasi harus menyediakan ${field}`);
}
assert(!login.includes("Masuk dengan Google"), "login Google harus dihapus");
assert(login.includes("LogoSliderCaptcha") && captcha.includes("logo_kota_tangerang_selatan.png"), "CAPTCHA wajib berupa puzzle geser Logo SIKANDA");
assert(captcha.includes('type="range"') && captcha.includes("elapsedMs") && captcha.includes("track") && captcha.includes("jigsawPath"), "puzzle harus berbentuk jigsaw, mendukung geser, dan mengirim bukti gerakan");

assert(shell.includes("loginWithPassword") && shell.includes("registerAccount") && shell.includes("readAuthSession"), "AuthProvider harus memakai sesi Supabase melalui Apps Script");
assert(client.includes("accessToken") && client.includes('action: "auth_refresh"') && client.includes("refreshPromise"), "client harus mengirim access token dan mencegah refresh token dipakai paralel");
assert(authService.includes('action: "auth_register"') && authService.includes('action: "auth_login"'), "registrasi/login harus melewati Apps Script");

for (const marker of [
  "captcha_challenge", "auth_register", "auth_login", "auth_refresh", "auth_logout",
  "/auth/v1/admin/users", "/auth/v1/token?grant_type=password", "/auth/v1/token?grant_type=refresh_token",
  "/auth/v1/user", "AUTH_PASSWORD_PEPPER", "credentialPassword_", "auth_user_id", "auth_status"
]) {
  assert(backend.includes(marker), `Apps Script Auth wajib memuat ${marker}`);
}
assert(backend.includes("auth_status: 'active'") && backend.includes("String(row.auth_status || '') !== 'active'"), "akun harus langsung aktif setelah registrasi dan selalu diperiksa pada request");
assert(backend.includes("cache.remove(cacheKey); // satu challenge hanya boleh diverifikasi satu kali"), "challenge CAPTCHA harus sekali pakai");
assert(backend.includes("AUTH_LOGIN_RATE_LIMIT") && backend.includes("AUTH_REGISTER_RATE_LIMIT") && backend.includes("enforceAuthRateLimit_"), "login dan registrasi harus memiliki rate limit");
assert(backend.includes("Object.keys(uniquePositions).length") && backend.includes("totalTravel"), "backend harus memeriksa jejak gerakan puzzle");
assert(backend.includes("buatAuthPasswordPepperV1116") && backend.includes("aktifkanRegistrasiV1116") && backend.includes("nonaktifkanRegistrasiV1116"), "Apps Script harus menyediakan fungsi setup dan sakelar darurat registrasi");
assert(backend.includes("authFindUserByEmail_") && backend.includes("user_reset_registration"), "reset registrasi harus dapat membersihkan binding maupun user Auth yatim");

assert(accounts.includes("Siap Registrasi") && accounts.includes("Reset Registrasi") && accounts.includes("userResetRegistration"), "Kelola Akun harus menampilkan status dan reset registrasi");
for (const marker of [
  "auth_user_id uuid", "auth_status text", "app_access_email_lower_uidx", "app_access_nip_uidx",
  "app_access_auth_user_fk", "app_access_nip_format_check", "revoke all on table public.app_access from anon, authenticated"
]) {
  assert(migration.includes(marker), `migrasi 009 wajib memuat ${marker}`);
}

const now = Math.floor(Date.now() / 1000);
assert(sessionNeedsRefresh({ accessToken: "a", refreshToken: "r", expiresAt: now + 30 }), "sesi dekat kedaluwarsa harus direfresh");
assert(!sessionNeedsRefresh({ accessToken: "a", refreshToken: "r", expiresAt: now + 600 }), "sesi yang masih panjang tidak boleh direfresh dini");

console.log("revision-v1116-supabase-auth-tests: OK");
