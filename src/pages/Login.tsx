import React, { useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { LogIn, ShieldAlert } from "lucide-react";
import { AuthContext } from "../components/layout/AppShell";
import { motion } from "motion/react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import bgUrl from "@/assets/images_landingpage.webp";

export default function Login() {
  const [error, setError] = useState("");
  const { user, loading, loginWithGoogle, loginDev } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e?.message || "Gagal masuk. Pastikan akun Anda sudah didaftarkan admin.");
    }
  };

  // Public-safe: mode developer dinonaktifkan agar seluruh akses memakai Firebase idToken.
  const isDev = false;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-gray-900"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      <div className="absolute inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-[2px]"></div>

      <div className="w-full max-w-lg bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl shadow-2xl border border-white/50 dark:border-gray-700/50 p-6 sm:p-10 rounded-[32px] relative z-10 transition-all duration-300 mx-4 mt-8 sm:-mt-16">
        <div className="flex flex-col items-center text-center w-[450px] h-[198.734px] mb-[31px] ml-0 max-w-full">
          <BrandLogo className="w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] mb-5" />
          <h1 className="text-2xl sm:text-[27px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">Selamat Datang di SIKANDA</h1>
          <p className="text-gray-700 dark:text-gray-300 text-[15px] w-[800px] max-w-full font-bold leading-[22.375px] font-[system-ui] mt-[6px] -ml-[6px] px-0">Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center w-full max-w-[400px] mx-auto py-10 space-y-6">
            <p className="text-gray-700 dark:text-gray-300 font-bold text-center text-lg animate-pulse">Memverifikasi akun Anda...</p>
            <div className="w-full h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner border border-gray-300/30 dark:border-gray-600/30">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: ["0%", "70%", "90%"] }}
                transition={{ duration: 2.2, ease: "easeInOut" }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5 flex flex-col items-center w-full max-w-[400px] mx-auto">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center border border-red-100 dark:border-red-800/50 w-full flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full sm:w-[319px] mt-2 text-base bg-white hover:bg-gray-50 text-gray-800 font-bold py-3.5 rounded-full transition-all shadow-[6px_6px_12px_rgba(11,87,208,0.15),-6px_-6px_12px_rgba(255,255,255,0.8)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.15)] flex justify-center items-center gap-3 border border-gray-200"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 43.5c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 34.6 26.7 35.5 24 35.5c-5.3 0-9.7-3.1-11.3-7.6l-6.6 5.1C9.5 39 16.2 43.5 24 43.5z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C40.9 36.5 43.5 30.8 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
              </svg>
              Masuk dengan Google
            </button>

            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center max-w-[330px]">
              Pilih email yang digunakan untuk login SIKANDA.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[300px] -mt-2">
              Hanya akun yang telah didaftarkan Administrator yang dapat masuk.
            </p>

            {isDev && (
              <button
                type="button"
                onClick={loginDev}
                className="w-full sm:w-[319px] text-sm bg-amber-100/70 hover:bg-amber-200/70 text-amber-800 font-bold py-2.5 rounded-full transition-all flex justify-center items-center gap-2 border border-amber-300"
                title="Hanya tampil saat pengembangan (vite dev). Otomatis hilang di build produksi."
              >
                <LogIn size={16} />
                Masuk sebagai Admin (Mode Pengembangan)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
