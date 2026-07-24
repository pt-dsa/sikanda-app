import React, { useContext, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Eye, EyeOff, IdCard, KeyRound, Mail, ShieldAlert, UserPlus } from "lucide-react";
import { AuthContext } from "@/components/layout/AppShell";
import { LogoSliderCaptcha } from "@/components/auth/LogoSliderCaptcha";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LoadingState } from "@/components/ui/LoadingState";
import type { CaptchaProof } from "@/services/authService";
import bgUrl from "@/assets/images_landingpage.webp";

type Mode = "login" | "register";

function getClientKey(): string {
  const key = "sikanda_auth_client_key";
  try {
    const current = sessionStorage.getItem(key);
    if (current) return current;
    const next = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(key, next);
    return next;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

const inputClass = "w-full rounded-xl border border-white/70 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 py-3 pl-11 pr-4 text-sm font-semibold text-gray-900 dark:text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";

export default function Login() {
  const { user, loading, loginWithPassword, registerAccount } = useContext(AuthContext);
  const clientKey = useMemo(getClientKey, []);
  const [mode, setMode] = useState<Mode>("login");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaProof | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  function changeMode(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirmation("");
    setCaptcha(null);
    setCaptchaReset((value) => value + 1);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    const cleanNip = nip.replace(/\D/g, "");
    if (!/^\d{18}$/.test(cleanNip)) {
      setError("NIP wajib terdiri dari 18 digit angka.");
      return;
    }
    if (mode === "register" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Masukkan email yang telah didaftarkan Administrator/Pimpinan.");
      return;
    }
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password minimal 10 karakter dan harus memuat huruf serta angka.");
      return;
    }
    if (mode === "register" && password !== confirmation) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    if (!captcha) {
      setError("Selesaikan puzzle Logo SIKANDA terlebih dahulu.");
      return;
    }

    try {
      if (mode === "login") {
        await loginWithPassword({ nip: cleanNip, password, captcha, clientKey });
      } else {
        const result = await registerAccount({ nip: cleanNip, email: email.trim().toLowerCase(), password, captcha, clientKey });
        if (result.requiresLogin) {
          setMode("login");
          setPassword("");
          setConfirmation("");
          setNotice(result.message || "Registrasi berhasil. Silakan masuk menggunakan NIP dan password Anda.");
        }
      }
    } catch (caught: any) {
      setError(caught?.message || "Permintaan autentikasi gagal. Silakan coba kembali.");
    } finally {
      setCaptcha(null);
      setCaptchaReset((value) => value + 1);
    }
  }

  return (
    <main className="min-h-screen bg-cover bg-center bg-no-repeat bg-gray-950 px-4 py-8" style={{ backgroundImage: `url(${bgUrl})` }}>
      <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[2px]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/55 bg-white/45 p-5 shadow-2xl backdrop-blur-2xl dark:bg-gray-950/55 sm:p-8">
          <div className="mb-5 flex flex-col items-center text-center">
            <BrandLogo className="mb-3 h-20 w-20 sm:h-24 sm:w-24" />
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">Selamat Datang di SIKANDA</h1>
            <p className="mt-1 text-sm font-bold text-gray-700 dark:text-gray-300">Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah</p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-white/50 p-1 dark:bg-gray-900/50">
            <button type="button" onClick={() => changeMode("login")} className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${mode === "login" ? "bg-blue-600 text-white shadow" : "text-gray-600 dark:text-gray-300"}`}>Masuk</button>
            <button type="button" onClick={() => changeMode("register")} className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${mode === "register" ? "bg-blue-600 text-white shadow" : "text-gray-600 dark:text-gray-300"}`}>Registrasi</button>
          </div>

          {loading ? <LoadingState compact label={mode === "login" ? "Memverifikasi akun" : "Mendaftarkan akun"} /> : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-sm font-semibold text-emerald-700">{notice}</div>}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/90 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/70 dark:text-red-300">
                  <ShieldAlert size={17} className="mt-0.5 shrink-0" /><span>{error}</span>
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-700 dark:text-gray-300">NIP</span>
                <span className="relative block">
                  <IdCard className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input value={nip} onChange={(event) => setNip(event.target.value.replace(/\D/g, "").slice(0, 18))} inputMode="numeric" autoComplete="username" placeholder="18 digit NIP" className={inputClass} />
                </span>
              </label>

              {mode === "register" && (
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-700 dark:text-gray-300">Email yang Didaftarkan Administrator/Pimpinan</span>
                  <span className="relative block">
                    <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="nama@instansi.go.id" className={inputClass} />
                  </span>
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-700 dark:text-gray-300">Password</span>
                <span className="relative block">
                  <KeyRound className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value.slice(0, 72))} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Minimal 10 karakter" className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 rounded-lg p-1 text-gray-500" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>

              {mode === "register" && (
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-700 dark:text-gray-300">Konfirmasi Password</span>
                  <span className="relative block">
                    <KeyRound className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                    <input type={showPassword ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value.slice(0, 72))} autoComplete="new-password" placeholder="Ulangi password" className={inputClass} />
                  </span>
                </label>
              )}

              <LogoSliderCaptcha purpose={mode} clientKey={clientKey} resetKey={captchaReset} onChange={setCaptcha} />

              <button type="submit" disabled={!captcha} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-emerald-600 px-5 py-3 font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55">
                {mode === "login" ? <><KeyRound size={18} /> Masuk ke SIKANDA</> : <><UserPlus size={18} /> Daftarkan Akun</>}
              </button>
              <p className="text-center text-xs font-medium text-gray-600 dark:text-gray-300">
                {mode === "login" ? "Gunakan NIP dan password yang dibuat saat registrasi." : "NIP, email, dan peran harus sudah ditetapkan Administrator/Pimpinan."}
              </p>
              {mode === "login" && (
                <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
                  Lupa password? Hubungi Administrator/Pimpinan untuk menjalankan Reset Registrasi.
                </p>
              )}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
