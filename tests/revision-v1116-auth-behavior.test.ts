import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../apps-script/Code.gs", import.meta.url), "utf8");
const cache = new Map<string, string>();
const properties: Record<string, string> = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-test",
  SUPABASE_SERVICE_ROLE_KEY: "service-test",
  AUTH_PASSWORD_PEPPER: "p".repeat(64),
  AUTH_REGISTRATION_ENABLED: "true",
};

const digest = (algorithm: string, value: string) => Array.from(crypto.createHash(algorithm).update(value).digest());
const context = vm.createContext({
  console,
  Date,
  Math,
  JSON,
  encodeURIComponent,
  decodeURIComponent,
  isFinite,
  parseInt,
  parseFloat,
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key: string) => properties[key] ?? null,
      setProperty: (key: string, value: string) => { properties[key] = value; },
      deleteProperty: (key: string) => { delete properties[key]; },
    }),
  },
  CacheService: {
    getScriptCache: () => ({
      get: (key: string) => cache.get(key) || null,
      put: (key: string, value: string) => { cache.set(key, value); },
      remove: (key: string) => { cache.delete(key); },
    }),
  },
  Utilities: {
    DigestAlgorithm: { SHA_256: "sha256", MD5: "md5" },
    Charset: { UTF_8: "utf8" },
    computeDigest: (algorithm: string, value: string) => digest(algorithm, value),
    computeHmacSha256Signature: (value: string, key: string) => Array.from(crypto.createHmac("sha256", key).update(value).digest()),
    base64EncodeWebSafe: (bytes: number[]) => Buffer.from(bytes).toString("base64url"),
    getUuid: () => crypto.randomUUID(),
    formatDate: () => "2026-07-23",
  },
  LockService: {
    getScriptLock: () => ({ waitLock: () => undefined, tryLock: () => true, releaseLock: () => undefined }),
  },
});

vm.runInContext(source, context);

const first = vm.runInContext("credentialPassword_('198001012005011001','Rahasia12345')", context) as string;
const second = vm.runInContext("credentialPassword_('198001012005011002','Rahasia12345')", context) as string;
assert.equal(first.length, 43, "kredensial turunan harus berupa HMAC base64url 256-bit");
assert.notEqual(first, second, "password mentah yang sama harus menghasilkan kredensial berbeda untuk NIP berbeda");
assert.throws(() => vm.runInContext("validateAuthPassword_('pendek')", context), /Password minimal 10 karakter/);

const putCaptcha = (id: string, purpose: "login" | "register", target = 60) => {
  const clientHash = crypto.createHmac("sha256", properties.AUTH_PASSWORD_PEPPER)
    .update("captcha-client|client-key-123456")
    .digest("base64url");
  cache.set(`auth_captcha_${id}`, JSON.stringify({
    purpose,
    clientHash,
    target,
    vertical: 40,
    issuedAt: Date.now() - 700,
  }));
};

putCaptcha("singleuse", "register");
assert.equal(
  vm.runInContext("verifyCaptcha_('register',{challengeId:'singleuse',position:60,elapsedMs:700,track:[0,20,40,60]},'client-key-123456')", context),
  true,
);
assert.throws(
  () => vm.runInContext("verifyCaptcha_('register',{challengeId:'singleuse',position:60,elapsedMs:700,track:[0,20,40,60]},'client-key-123456')", context),
  /kedaluwarsa/,
  "challenge yang sudah dipakai harus ditolak",
);

vm.runInContext(`
  var originalResolveAccessForTest = resolveAccess_;
  supaGet_ = function () {
    return [{
      email:'pegawai@example.go.id', role:'pegawai', nip:'198001012005011001', nama:'Pegawai Uji',
      is_active:false, auth_user_id:'11111111-1111-4111-8111-111111111111', auth_status:'disabled'
    }];
  };
`, context);
assert.throws(
  () => vm.runInContext("originalResolveAccessForTest('pegawai@example.go.id','11111111-1111-4111-8111-111111111111')", context),
  /dinonaktifkan/,
  "binding token lama harus ditolak segera setelah app_access dinonaktifkan",
);

vm.runInContext(`
  supaGet_ = function () {
    return [{
      email:'pegawai@example.go.id', role:'pegawai', nip:'198001012005011001', nama:'Pegawai Uji',
      is_active:true, auth_user_id:null, auth_status:'ready'
    }];
  };
`, context);
assert.throws(
  () => vm.runInContext("originalResolveAccessForTest('pegawai@example.go.id','11111111-1111-4111-8111-111111111111')", context),
  /belum diregistrasikan|belum terhubung/,
  "akun Siap Registrasi tidak boleh mengakses data bisnis",
);

vm.runInContext(`
  var capturedRegistrationPatch = null;
  supaGet_ = function () {
    return [{
      email:'pegawai@example.go.id', role:'pegawai', nip:'198001012005011001', nama:'Pegawai Uji',
      is_active:true, auth_user_id:null, auth_status:'ready'
    }];
  };
  authFindUserByEmail_ = function () { return null; };
  authCreateUser_ = function () { return { id:'11111111-1111-4111-8111-111111111111' }; };
  supaRequest_ = function (method, path, body) { capturedRegistrationPatch = body; return [{}]; };
  resolveAccess_ = function () { return { email:'pegawai@example.go.id', role:'pegawai', nip:'198001012005011001', nama:'Pegawai Uji', auth_user_id:'11111111-1111-4111-8111-111111111111' }; };
  authPasswordGrant_ = function () { return { access_token:'${"a".repeat(80)}', refresh_token:'${"r".repeat(40)}', expires_in:3600, user:{id:'11111111-1111-4111-8111-111111111111'} }; };
  whoamiPayload_ = function (actor) { return { ok:true, email:actor.email, role:actor.role, nip:actor.nip, nama:actor.nama, foto:'', photo_nip:actor.nip }; };
  auditLog_ = function () {};
`, context);

putCaptcha("registerok", "register");
const registration = vm.runInContext(`authRegister_({
  nip:'198001012005011001', email:'pegawai@example.go.id', password:'Rahasia12345', clientKey:'client-key-123456',
  captcha:{challengeId:'registerok',position:60,elapsedMs:700,track:[0,20,40,60]}
})`, context) as any;
assert.equal(registration.ok, true);
assert.equal(registration.user.role, "pegawai", "role registrasi harus berasal dari app_access");
assert.equal(vm.runInContext("capturedRegistrationPatch.auth_status", context), "active", "registrasi valid harus langsung mengaktifkan akun");
assert.equal(vm.runInContext("capturedRegistrationPatch.auth_user_id", context), "11111111-1111-4111-8111-111111111111");

console.log("revision-v1116-auth-behavior-tests: OK");
