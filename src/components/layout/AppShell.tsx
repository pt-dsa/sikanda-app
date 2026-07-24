import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Navigate, NavLink, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, CarFront, Wrench, Package, WalletCards, 
  Settings, LogOut, Menu, Map, FileText, CalendarClock, Users, Bell, CalendarCheck, UserCog, ScanSearch, MessagesSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { spreadsheetService } from "@/services/spreadsheetService";
import { apiService } from "@/services/apiService";
import { authService, type CaptchaProof } from "@/services/authService";
import { clearAuthSession, readAuthSession } from "@/lib/authSession";
import { canViewMenu, type AppUser, type MenuKey } from "@/lib/rbac";
import { motion, AnimatePresence } from "motion/react";
import { PegawaiFormModal } from "@/components/ui/PegawaiFormModal";
import { PegawaiAvatar } from "@/components/ui/PegawaiDetailModal";
import { useToast } from "@/components/ui/Toast";
import type { Pegawai } from "@/types";
import type { NotificationAgendaItem, NotificationFeed } from "@/services/apiService";

function birthdayTimeLabel(item: { daysUntil: number }) {
  return item.daysUntil === 0 ? "Hari ini" : item.daysUntil === 1 ? "Besok" : `${item.daysUntil} hari lagi`;
}

function agendaTimeLabel(item: NotificationAgendaItem) {
  if (item.selisihHari < 0) return `Terlewat ${Math.abs(item.selisihHari)} hari`;
  if (item.selisihHari === 0) return "Jatuh tempo hari ini";
  return item.selisihHari < 30 ? `${item.selisihHari} hari lagi` : `${Math.floor(item.selisihHari / 30)} bulan lagi`;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  loginWithPassword: (params: { nip: string; password: string; captcha: CaptchaProof; clientKey: string }) => Promise<void>;
  registerAccount: (params: { nip: string; email: string; password: string; captcha: CaptchaProof; clientKey: string }) => Promise<{ requiresLogin: boolean; message?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  loginWithPassword: async () => {},
  registerAccount: async () => ({ requiresLogin: false }),
  logout: async () => {},
});

function appUserFromIdentity(identity: any): AppUser {
  return {
    email: String(identity?.email || ""),
    role: identity?.role,
    nip: String(identity?.nip || ""),
    nama: String(identity?.nama || ""),
    foto: String(identity?.foto || ""),
    foto_nip: String(identity?.photo_nip || identity?.foto_nip || ""),
    is_active: true,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Otorisasi selalu dimulai kosong. Role tidak pernah dipulihkan dari
  // localStorage; backend whoami adalah satu-satunya sumber kebenaran.
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fail-closed: profil/role tidak disimpan di browser. Sesi Supabase yang ada
  // selalu diverifikasi ulang oleh Apps Script sebelum aplikasi dibuka.
  useEffect(() => {
    let active = true;
    const restore = async () => {
      spreadsheetService.clearCache();
      setUser(null);
      setLoading(true);
      try {
        if (!readAuthSession()) return;
        const identity = await apiService.whoami();
        if (active) setUser(appUserFromIdentity(identity));
      } catch (e: any) {
        console.error("[SIKANDA] verifikasi sesi gagal:", e);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    restore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const invalidate = () => {
      clearAuthSession();
      spreadsheetService.clearCache();
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("sikanda:auth-invalid", invalidate);
    return () => window.removeEventListener("sikanda:auth-invalid", invalidate);
  }, []);

  const loginWithPassword: AuthContextValue["loginWithPassword"] = async (params) => {
    setLoading(true);
    try {
      const result = await authService.login(params.nip, params.password, params.captcha, params.clientKey);
      if (!result.user) throw new Error("Identitas akun tidak tersedia.");
      spreadsheetService.clearCache();
      setUser(appUserFromIdentity(result.user));
    } catch (e) {
      setUser(null);
      spreadsheetService.clearCache();
      clearAuthSession();
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const registerAccount: AuthContextValue["registerAccount"] = async (params) => {
    setLoading(true);
    try {
      const result = await authService.register(params.nip, params.email, params.password, params.captcha, params.clientKey);
      if (result.user) setUser(appUserFromIdentity(result.user));
      return { requiresLogin: result.requiresLogin, message: result.message };
    } catch (error) {
      setUser(null);
      clearAuthSession();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setLoading(true);
    spreadsheetService.clearCache();
    try {
      await authService.logout();
    } finally {
      clearAuthSession();
      spreadsheetService.clearCache();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithPassword, registerAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const navItems: { icon: any; label: string; href: string; menu: MenuKey }[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", menu: "dashboard" },
  { icon: Users, label: "Data ASN / PPPK", href: "/pegawai", menu: "pegawai" },
  { icon: CalendarCheck, label: "Buku Penjagaan", href: "/buku-penjagaan", menu: "buku-penjagaan" },
  { icon: CarFront, label: "Data Kendaraan", href: "/kendaraan", menu: "kendaraan" },
  { icon: Wrench, label: "Inventaris", href: "/alat-mesin", menu: "alat-mesin" },
  { icon: Package, label: "Alat & Mesin", href: "/inventaris", menu: "inventaris" },
  { icon: WalletCards, label: "Pagu Anggaran", href: "/pagu", menu: "pagu" },
  { icon: Wrench, label: "Pemeliharaan Kendaraan", href: "/pemeliharaan-kendaraan", menu: "pemeliharaan-kendaraan" },
  { icon: CalendarClock, label: "Peminjaman", href: "/peminjaman", menu: "peminjaman" },
  { icon: Map, label: "Peta Sebaran", href: "/peta", menu: "peta" },
  { icon: FileText, label: "Rekap Laporan", href: "/laporan", menu: "laporan" },
  { icon: MessagesSquare, label: "Tanya SIKANDA", href: "/tanya", menu: "tanya" },
  { icon: UserCog, label: "Kelola Akun", href: "/kelola-akun", menu: "kelola-akun" },
  { icon: ScanSearch, label: "Data Cleansing", href: "/cleansing", menu: "cleansing" },
];

function Sidebar({ mobileOpen, desktopOpen, setMobileOpen }: { mobileOpen: boolean, desktopOpen: boolean, setMobileOpen: (v: boolean) => void }) {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const items = useMemo(
    () => navItems.filter((it) => canViewMenu(user?.role, it.menu)),
    [user?.role]
  );

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#e2e8f0]/40 dark:bg-[#1e293b]/40 backdrop-blur-2xl border-r border-white/60 dark:border-white/5 shadow-[8px_0_16px_rgba(163,177,198,0.2)] dark:shadow-[8px_0_16px_rgba(0,0,0,0.6)] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
      "w-64",
      mobileOpen ? "translate-x-0" : "-translate-x-full",
      desktopOpen ? "md:translate-x-0 md:w-64" : "md:translate-x-0 md:w-20"
    )}>
      <div className={cn("flex flex-col items-center justify-center border-b border-gray-100/50 dark:border-gray-800/50 overflow-hidden py-4", desktopOpen ? "px-4" : "md:px-2 md:justify-center px-4")}>
        <div className="flex flex-col items-center gap-2 text-blue-700 dark:text-blue-500 font-bold tracking-tight whitespace-nowrap neuglass rounded-2xl p-3 w-full">
          <BrandLogo className="w-16 h-16" />
          <span className={cn("transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] origin-top text-lg w-[88.625px] text-center leading-[28px]", desktopOpen ? "opacity-100 scale-100 h-auto mt-1" : "md:opacity-0 md:scale-0 md:h-0 opacity-100 scale-100 h-auto mt-1")}>SIKANDA</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          const notifyBadge = false;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              title={!desktopOpen ? item.label : undefined}
              className={cn(
                "flex items-center justify-between rounded-full text-[15px] font-bold transition-all duration-300 whitespace-nowrap",
                desktopOpen ? "px-3 py-2.5" : "md:px-0 md:py-2.5 md:justify-center px-3 py-2.5",
                isActive 
                  ? "neuglass-pressed text-blue-700 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400 hover:neuglass hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Icon size={18} strokeWidth={2.5} className={cn("flex-shrink-0", isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-400")} />
                  {notifyBadge && !desktopOpen && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#e2e8f0] dark:border-[#1e293b]"></div>
                  )}
                </div>
                <span className={cn("transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] origin-left", desktopOpen ? "opacity-100 scale-100 w-auto" : "md:opacity-0 md:scale-0 md:w-0 opacity-100 scale-100 w-auto")}>
                  {item.label}
                </span>
              </div>
              {notifyBadge && desktopOpen && (
                <span />
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = time.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const timeStr = time.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="hidden lg:block text-sm font-bold text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-gray-800/40 px-3 py-1.5 rounded-full border border-gray-200/50 dark:border-gray-700/50">
      {dateStr.replace(', ', ',')} | Pukul {timeStr.replace(/\./g, ':')} WIB
    </div>
  );
}

function NotifSection({
  title, items, dot, to, seeAll, close, limit = 5,
}: {
  title: string;
  items: NotificationAgendaItem[];
  dot: string;
  to: (e: NotificationAgendaItem) => string;
  seeAll: string;
  close: () => void;
  limit?: number;
}) {
  if (!items || items.length === 0) return null;
  const shown = items.slice(0, limit);
  const extra = items.length - shown.length;
  return (
    <div className="py-1">
      <div className="px-4 pt-2 pb-1 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</span>
        <span className="ml-auto text-[11px] font-bold text-gray-400">{items.length}</span>
      </div>
      {shown.map((e, i) => (
        <Link
          key={`${e.nip}-${e.kategori}-${i}`}
          to={to(e)}
          onClick={close}
          className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
        >
          <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{e.nama || "-"}</div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{e.kategoriLabel}</span>
            <span className={`text-[11px] font-semibold shrink-0 ${e.selisihHari < 0 ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
              {agendaTimeLabel(e)}
            </span>
          </div>
        </Link>
      ))}
      {extra > 0 && (
        <Link to={seeAll} onClick={close} className="block px-4 py-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          Lihat semua ({items.length}) →
        </Link>
      )}
    </div>
  );
}

function BirthdaySection({ items, close }: { items: NotificationFeed["birthdays"]; close: () => void }) {
  if (!items || !items.length) return null;
  return (
    <div className="py-1">
      <div className="px-4 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Ulang Tahun Hari Ini–7 Hari</span>
        <span className="ml-auto text-[11px] font-bold text-gray-400">{items.length}</span>
      </div>
      {items.slice(0, 8).map((item) => (
        <Link key={`${item.nip}-${item.tanggal}`} to={`/pegawai?profile=${encodeURIComponent(item.nip)}`} onClick={close} className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
          <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{item.nama}</div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{item.jabatan || "Jabatan belum tersedia"} · {item.tanggal}</span>
            <span className={`text-[11px] font-bold shrink-0 ${item.daysUntil === 0 ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-gray-500 dark:text-gray-400"}`}>{birthdayTimeLabel(item)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Topbar({ setMobileSidebarOpen, desktopSidebarOpen, setDesktopSidebarOpen, onEditProfile }: { setMobileSidebarOpen: (v: boolean) => void, desktopSidebarOpen: boolean, setDesktopSidebarOpen: (v: boolean) => void, onEditProfile: () => void }) {
  const { user, logout } = useContext(AuthContext);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [feed, setFeed] = useState<NotificationFeed | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        if (!readAuthSession()) return;
        setFeed(await apiService.getNotificationFeed());
      } catch (err: any) {
        if (!/Sesi/i.test(err?.message || "")) {
          console.error("Error loading alerts:", err);
        }
      }
    }
    void loadAlerts();
    const refresh = () => void loadAlerts();
    window.addEventListener("sikanda:data-changed", refresh);
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => {
      window.removeEventListener("sikanda:data-changed", refresh);
      window.clearInterval(timer);
    };
  }, []);

  const notif = feed || { overdue: [], kgb: [], pangkat: [], bup: [], birthdays: [] };

  const totalNotif = (notif.overdue?.length || 0) + (notif.kgb?.length || 0) + (notif.pangkat?.length || 0) + (notif.bup?.length || 0) + (notif.birthdays?.length || 0);

  const getGreeting = () => {
    const hour = parseInt(new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      hour12: false
    }).format(new Date()), 10);
    
    if (hour >= 5 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  return (
    <header className="flex-shrink-0 sticky top-0 z-40 flex min-h-16 flex-wrap sm:flex-nowrap items-center justify-between gap-y-2 neuglass rounded-none border-t-0 border-x-0 px-3 py-2 sm:py-0 md:px-6">
      <div className="order-1 flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <button 
          className="md:hidden p-2.5 rounded-xl neuglass text-gray-600 dark:text-gray-300 active:neuglass-pressed transition-all hover:text-blue-600 dark:hover:text-blue-400 active:scale-95"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <button 
          className="hidden md:block p-2.5 rounded-xl neuglass text-gray-600 dark:text-gray-300 active:neuglass-pressed transition-all hover:text-blue-600 dark:hover:text-blue-400 active:scale-95"
          onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
        >
          <Menu size={20} />
        </button>

      </div>
      
      <div className={cn(
        "order-3 basis-full min-w-0 px-0 flex justify-center sm:order-2 sm:basis-auto sm:flex-1 sm:max-w-2xl sm:px-4 lg:px-8",
        user?.role === "pegawai" && "hidden sm:flex"
      )}>
        {user?.role !== "pegawai" ? <GlobalSearch /> : <div className="flex-1" />}
      </div>

      <div className="order-2 sm:order-3 ml-auto flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
        <LiveClock />
        
        {/* Notification Bell + panel agenda */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifikasi agenda kepegawaian"
            className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Bell size={20} />
            {totalNotif > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-900">
                {totalNotif > 99 ? '99+' : totalNotif}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className={cn(
                "fixed left-2 right-2 overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-[70] animate-in fade-in slide-in-from-top-2 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px] sm:max-h-[72vh]",
                user?.role !== "pegawai" ? "top-[7.25rem] max-h-[calc(100dvh-7.75rem)]" : "top-[4.25rem] max-h-[calc(100dvh-4.75rem)]"
              )}>
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifikasi Kepegawaian</span>
                  </div>
                  <Link
                    to="/buku-penjagaan"
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Buka semua
                  </Link>
                </div>

                {totalNotif === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    Tidak ada agenda terdekat. 🎉
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    <BirthdaySection items={notif.birthdays} close={() => setNotifOpen(false)} />
                    <NotifSection
                      title="Terlewat (Lewat Tenggat)"
                      items={notif.overdue}
                      dot="bg-red-500"
                      to={(e) => `/pegawai?profile=${encodeURIComponent(e.nip)}`}
                      seeAll="/buku-penjagaan?rentang=terlambat"
                      close={() => setNotifOpen(false)}
                    />
                    <NotifSection
                      title="KGB ≤ 6 bulan"
                      items={notif.kgb}
                      dot="bg-amber-500"
                      to={(e) => `/pegawai?profile=${encodeURIComponent(e.nip)}`}
                      seeAll="/buku-penjagaan?kategori=KGB&rentang=le6"
                      close={() => setNotifOpen(false)}
                    />
                    <NotifSection
                      title="Kenaikan Pangkat ≤ 6 bulan"
                      items={notif.pangkat}
                      dot="bg-blue-500"
                      to={(e) => `/pegawai?profile=${encodeURIComponent(e.nip)}`}
                      seeAll="/buku-penjagaan?kategori=PANGKAT&rentang=le6"
                      close={() => setNotifOpen(false)}
                    />
                    <NotifSection
                      title="Pensiun / BUP ≤ 6 bulan"
                      items={notif.bup}
                      dot="bg-rose-500"
                      to={(e) => `/pegawai?profile=${encodeURIComponent(e.nip)}`}
                      seeAll="/buku-penjagaan?kategori=BUP&rentang=le6"
                      close={() => setNotifOpen(false)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <ThemeToggle />
        <div className="flex items-center gap-2 sm:gap-3 sm:ml-2 relative">
          <div className="hidden text-right md:block">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{getGreeting()}, {user?.nama}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</div>
          </div>
          <button 
            className="h-9 w-9 overflow-hidden rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-label="Buka menu profil pengguna"
          >
            <PegawaiAvatar
              foto={String(user?.foto || "")}
              nama={String(user?.nama || "Administrator SIKANDA")}
              nip={String(user?.foto_nip || user?.nip || "")}
              size="sm"
            />
          </button>
          
          {profileDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setProfileDropdownOpen(false)}
              ></div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <button 
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onEditProfile();
                  }}
                >
                  <Settings size={16} />
                  <span>Edit Profile</span>
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>
                <button 
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isMapPage = location.pathname.startsWith("/peta");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [profileEmployee, setProfileEmployee] = useState<Pegawai | null>(null);

  const openOwnProfile = async () => {
    try {
      const rows = await spreadsheetService.getPegawai();
      const nip = String(user?.nip || "").trim();
      const email = String(user?.email || "").trim().toLowerCase();
      const own = rows.find((p: Pegawai) => (nip && String(p.nip) === nip) || (!nip && email && String(p.email || "").trim().toLowerCase() === email));
      if (!own) {
        toast.warning("Profil Belum Tertaut", "Akun ini belum tertaut ke data pegawai. Administrator perlu menautkan NIP melalui Kelola Akun.");
        return;
      }
      setProfileEmployee(own);
    } catch (error: any) {
      toast.error("Profil Belum Dapat Dibuka", String(error?.message || "Data pegawai belum berhasil dimuat."));
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#e2e8f0] dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        desktopOpen={desktopSidebarOpen}
        setMobileOpen={setMobileSidebarOpen} 
      />
      
      {/* Backdrop for mobile sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-gray-900/20 dark:bg-gray-950/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "flex flex-col h-screen transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        desktopSidebarOpen ? "md:pl-64" : "md:pl-20"
      )}>
        <Topbar 
          setMobileSidebarOpen={setMobileSidebarOpen} 
          desktopSidebarOpen={desktopSidebarOpen}
          setDesktopSidebarOpen={setDesktopSidebarOpen}
          onEditProfile={() => void openOwnProfile()}
        />
        <AnimatePresence>
          {profileEmployee && (
            <PegawaiFormModal
              isOpen
              initialData={profileEmployee}
              user={user}
              bidangOptions={[]}
              onClose={() => setProfileEmployee(null)}
              onSuccess={() => {
                spreadsheetService.clearCache();
                setProfileEmployee(null);
              }}
            />
          )}
        </AnimatePresence>
        <main className={cn("flex-1 min-h-0 overscroll-y-contain", isMapPage ? "overflow-hidden" : "overflow-y-auto")}>
          <div className={cn("mx-auto w-full", isMapPage ? "h-full max-w-none p-0" : "p-4 md:p-6 lg:p-8 max-w-[1600px] md:h-full")}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
