import React, { Suspense, lazy, useContext } from "react";
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, AppShell, AuthContext } from "@/components/layout/AppShell";
import { canViewMenu, type MenuKey } from "@/lib/rbac";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { LoadingState } from "@/components/ui/LoadingState";

// Login dimuat eager (paint pertama untuk pengguna belum login — tanpa kedip Suspense).
import Login from "@/pages/Login";

// Halaman terproteksi dimuat lazy (code-splitting). Pustaka berat ikut terpisah:
// recharts → chunk Dashboard, leaflet/react-leaflet → chunk PetaSebaran, qrcode.react → chunk masing-masing.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const PegawaiPage = lazy(() => import("@/pages/Pegawai"));
const BukuPenjagaan = lazy(() => import("@/pages/BukuPenjagaan"));
const Kendaraan = lazy(() => import("@/pages/Kendaraan"));
const AlatMesin = lazy(() => import("@/pages/AlatMesin"));
const Inventaris = lazy(() => import("@/pages/Inventaris"));
const PaguAnggaran = lazy(() => import("@/pages/PaguAnggaran"));
const PemeliharaanKendaraan = lazy(() => import("@/pages/PemeliharaanKendaraan"));
const Peminjaman = lazy(() => import("@/pages/Peminjaman"));
const PetaSebaran = lazy(() => import("@/pages/PetaSebaran"));
const Laporan = lazy(() => import("@/pages/Laporan"));
const KelolaAkun = lazy(() => import("@/pages/KelolaAkun"));
const Cleansing = lazy(() => import("@/pages/Cleansing"));
const TanyaSikanda = lazy(() => import("@/pages/TanyaSikanda"));

// Penjaga route per-peran: menolak akses via URL langsung bila peran tak berhak.
// (Sidebar sudah menyembunyikan menunya; ini lapis kedua untuk URL manual.)
function MenuGuard({ menu, children }: { menu: MenuKey; children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (!canViewMenu(user.role, menu)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ProtectedLayout() {
  return (
    <AppShell>
      {/* Fallback Suspense WAJIB pakai LoadingState (anti layar putih).
          Berada DI DALAM AppShell → sidebar & topbar tetap tampil saat halaman dimuat. */}
      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <ToastProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pegawai" element={<PegawaiPage />} />
                <Route path="/buku-penjagaan" element={<BukuPenjagaan />} />
                <Route path="/kendaraan" element={<Kendaraan />} />
                <Route path="/alat-mesin" element={<AlatMesin />} />
                <Route path="/inventaris" element={<Inventaris />} />
                <Route path="/pagu" element={<PaguAnggaran />} />
                <Route path="/pemeliharaan-kendaraan" element={<PemeliharaanKendaraan />} />
                <Route path="/peminjaman" element={<Peminjaman />} />
                <Route path="/peta" element={<PetaSebaran />} />
                <Route path="/laporan" element={<Laporan />} />
                <Route path="/tanya" element={<TanyaSikanda />} />
                <Route
                  path="/kelola-akun"
                  element={
                    <MenuGuard menu="kelola-akun">
                      <KelolaAkun />
                    </MenuGuard>
                  }
                />
                <Route
                  path="/cleansing"
                  element={
                    <MenuGuard menu="cleansing">
                      <Cleansing />
                    </MenuGuard>
                  }
                />
              </Route>
            </Routes>
          </HashRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
