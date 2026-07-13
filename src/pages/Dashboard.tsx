import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { spreadsheetService } from "@/services/spreadsheetService";
import { DashboardMetrics } from "@/types";
import { formatNumber, formatCurrency } from "@/lib/utils";
import {
  Users, UserCheck, AlertTriangle, Clock, Calendar, Bell,
  
  GraduationCap, Award, Timer, ShieldCheck, ClipboardList,
  ExternalLink, RefreshCw,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { motion } from "motion/react";
import { useToast } from "@/components/ui/Toast";

const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVars = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } } };
const CHART_COLORS = ["#0B57D0", "#34A853", "#FBBC04", "#EA4335", "#9B59B6", "#1ABC9C"];

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KpiCard({ title, value, icon: Icon, colorClass, subtitle }: {
  title: string; value: number | string; icon: any; colorClass: string; subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-2xl shrink-0 ${colorClass}`}><Icon size={22} /></div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-snug">{title}</p>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
            {typeof value === "number" && (title.toLowerCase().includes("pagu") || title.toLowerCase().includes("realisasi"))
              ? formatCurrency(value) : typeof value === "number" ? formatNumber(value) : value}
          </h4>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Alert Card (Buku Penjagaan)
// ---------------------------------------------------------------------------
function AlertCard({ title, count, subtitle, colorScheme, icon }: {
  title: string; count: number; subtitle: string; colorScheme: "yellow" | "blue" | "red"; icon?: any;
}) {
  const P = {
    yellow: { wrap: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50", icon: "bg-yellow-100 dark:bg-yellow-800/50 text-yellow-600", title: "text-yellow-800 dark:text-yellow-400", sub: "text-yellow-700 dark:text-yellow-500", dot: count > 0 ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600" },
    blue: { wrap: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50", icon: "bg-blue-100 dark:bg-blue-800/50 text-blue-600", title: "text-blue-800 dark:text-blue-400", sub: "text-blue-700 dark:text-blue-500", dot: count > 0 ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600" },
    red: { wrap: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50", icon: "bg-red-100 dark:bg-red-800/50 text-red-600", title: "text-red-800 dark:text-red-400", sub: "text-red-700 dark:text-red-500", dot: count > 0 ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600" },
  }[colorScheme];
  const IconMap = { yellow: AlertTriangle, blue: Calendar, red: Clock };
  const Icon = icon || IconMap[colorScheme];
  return (
    <div className={`border p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-all ${P.wrap}`}>
      <div className={`p-3 rounded-full shrink-0 ${P.icon}`}><Icon size={22} /></div>
      <div className="min-w-0">
        <h3 className={`font-bold ${P.title}`}>{title}</h3>
        <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
          {count} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">Pegawai</span>
        </p>
        <p className={`text-xs mt-1 ${P.sub}`}>{subtitle}</p>
        {count > 0 && (
          <div className="flex gap-1 mt-2">
            {Array.from({ length: Math.min(count, 8) }).map((_, i) => <span key={i} className={`w-2 h-2 rounded-full ${P.dot}`} />)}
            {count > 8 && <span className="text-xs text-gray-500">+{count - 8}</span>}
          </div>
  
      )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal Bar Chart
// ---------------------------------------------------------------------------
function HorizontalBarChart({ data, labelClass = "w-16" }: { data: { name: string; value: number }[]; labelClass?: string }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 py-6 text-center">Tidak ada data</p>;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5 w-full">
      {data.map((item, idx) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className={`text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0 text-right truncate ${labelClass}`} title={item.name}>{item.name}</span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
            <motion.div
              className="h-full rounded-full flex items-center justify-end pr-2"
              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
              initial={{ width: 0 }} animate={{ width: `${(item.value / maxVal) * 100}%` }}
              transition={{ duration: 0.6, delay: idx * 0.08, ease: "easeOut" }}
            >
              <span className="text-[10px] font-bold text-white">{item.value}</span>
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup Guide — muncul ketika backend belum bisa memuat data pegawai
// ---------------------------------------------------------------------------
function PegawaiSetupGuide({ errorMsg, onRetry }: { errorMsg: string; onRetry: () => void }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-100 dark:bg-amber-800/50 rounded-full shrink-0">
          <ClipboardList size={24} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-amber-800 dark:text-amber-400 text-lg mb-1">
            Data Pegawai Belum Berhasil Dimuat
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-500 mb-4">
            Aplikasi belum berhasil membaca Database Pegawai. Ini biasanya karena sesi pengguna belum valid atau konfigurasi layanan belum lengkap.
          </p>

          <div className="bg-white/60 dark:bg-gray-900/40 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Langkah Setup:</p>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-none">
              {[
                `Logout lalu masuk kembali dengan Google, bukan Mode Pengembangan`,
                `Pastikan alamat layanan aplikasi menggunakan deployment terbaru`,
                `Pastikan konfigurasi layanan aplikasi sudah dilengkapi oleh Administrator`,
                `Pastikan email Google sudah aktif pada Kelola Akun, lalu klik tombol "Coba Lagi"`,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={14} /> Coba Lagi
            </button>
          </div>

          {errorMsg && (
            <details className="mt-3">
              <summary className="text-xs text-amber-600 cursor-pointer hover:underline">Lihat detail teknis</summary>
              <p className="mt-1 text-xs font-mono bg-white/60 dark:bg-gray-900/40 p-2 rounded text-red-600 dark:text-red-400 break-all">{errorMsg}</p>
            </details>
    
      )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const toast = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPegawaiSetupNeeded, setIsPegawaiSetupNeeded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = async (force = false) => {
    if (force) {
      setSyncing(true);
      spreadsheetService.clearCache();
    }
    setLoading(true);
    setErrorMsg(null);
    setIsPegawaiSetupNeeded(false);
    try {
      const data = await spreadsheetService.getDashboardMetrics();
      setMetrics(data);
      if (force) toast.success("Sinkronisasi Berhasil", "Seluruh informasi Dashboard telah diperbarui dari data aktif dan dihitung ulang.");
    } catch (err: any) {
      const msg = err.message || "Gagal memuat data.";
      if (msg.includes("pegawai") || msg.includes("tidak ditemukan")) {
        setIsPegawaiSetupNeeded(true);
        setErrorMsg(msg);
        // Tetap fetch metrik aset saja (tanpa pegawai) agar dashboard partial bisa tampil
        try {
          const [vehicles, equipment] = await Promise.all([
            spreadsheetService.getVehicles(),
            spreadsheetService.getEquipment(),
          ]);
          setMetrics({
            totalPegawai: 0, pegawaiAktif: 0, pegawaiPensiun: 0,
            pegawaiASN: 0, pegawaiPPPK: 0, pegawaiPPPKPenuhWaktu: 0, pegawaiPPPKParuhWaktu: 0,
            peringatanKGB: 0, peringatanPangkat: 0, peringatanPensiun: 0, peringatanTerlambat: 0,
            distribusiGolongan: [], distribusiPendidikan: [], distribusiMasaKerja: [],
            totalKendaraan: vehicles.length, totalAlatMesin: equipment.length,
            totalInventaris: 0, totalAset: vehicles.length + equipment.length,
            totalPeminjaman: 0, totalPemeliharaan: 0,
            totalPagu: 0, totalRealisasi: 0,
            persenRealisasi: 0,
            lastUpdated: spreadsheetService.getLastUpdated(),
          });
        } catch { /* silently ignore partial load errors */ }
      } else {
        setErrorMsg(msg);
      }
      if (force) toast.error("Sinkronisasi Gagal", msg);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    spreadsheetService.clearCache();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingState />;

  const formattedDate = metrics?.lastUpdated
    ? new Intl.DateTimeFormat("id-ID", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(metrics.lastUpdated))
    : "—";


  return (
    <motion.div className="space-y-5" variants={containerVars} initial="hidden" animate="show">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3">
        <motion.div variants={itemVars}>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dashboard SIKANDA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sistem Informasi Kepegawaian dan Pengelolaan Aset Daerah</p>
        </motion.div>
        <motion.div variants={itemVars} className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/60 dark:bg-gray-800/60 px-3 py-2 rounded-full border border-gray-100 dark:border-gray-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Terakhir sinkronisasi: {formattedDate}
          </div>
          <button type="button" onClick={() => void load(true)} disabled={syncing} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm disabled:opacity-60">
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Menyinkronkan..." : "Sinkronisasi Data"}
          </button>
        </motion.div>
      </div>

      {/* Setup Guide — hanya muncul jika pegawai sheet belum dikonfigurasi */}
      {isPegawaiSetupNeeded && (
        <motion.div variants={itemVars}>
          <PegawaiSetupGuide errorMsg={errorMsg || ""} onRetry={() => void load(true)} />
        </motion.div>

      )}

      {/* Fatal error non-pegawai */}
      {errorMsg && !isPegawaiSetupNeeded && (
        <motion.div variants={itemVars} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 p-5 rounded-xl flex items-start gap-3">
          <ShieldCheck size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Terjadi Kesalahan</p>
            <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">{errorMsg}</p>
          </div>
        </motion.div>

      )}

      {metrics && (
        <div className="flex flex-col gap-6">
          {/* ── SECTION 1: Metrik Kepegawaian Utama ── */}
          <section className="order-1">
            <h2 className="text-sm font-extrabold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              Metrik Kepegawaian Utama
            </h2>
            <motion.div variants={itemVars} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
              <Link to="/pegawai" className="block transition-transform hover:-translate-y-0.5">
                <KpiCard title="Total Pegawai" value={metrics.totalPegawai} icon={Users} colorClass="bg-blue-100/60 text-blue-600" subtitle="Seluruh pegawai aktif" />
              </Link>
              <Link to="/pegawai?status=ASN" className="block transition-transform hover:-translate-y-0.5">
                <KpiCard title="ASN" value={metrics.pegawaiASN} icon={UserCheck} colorClass="bg-green-100/60 text-green-600" subtitle="Aparatur Sipil Negara" />
              </Link>
              <Link to="/pegawai?status=PPPK_PENUH_WAKTU" className="block transition-transform hover:-translate-y-0.5">
                <KpiCard title="PPPK (Penuh Waktu)" value={metrics.pegawaiPPPKPenuhWaktu} icon={Users} colorClass="bg-purple-100/60 text-purple-600" subtitle="Termasuk data PPPK lama tanpa kategori" />
              </Link>
              <Link to="/pegawai?status=PPPK_PARUH_WAKTU" className="block transition-transform hover:-translate-y-0.5">
                <KpiCard title="PPPK (Paruh Waktu)" value={metrics.pegawaiPPPKParuhWaktu} icon={Users} colorClass="bg-fuchsia-100/60 text-fuchsia-600" subtitle="Pegawai pemerintah paruh waktu" />
              </Link>
            </motion.div>
          </section>

          {/* ── SECTION 2: Buku Penjagaan ── */}
          <section className="order-2">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                Buku Penjagaan — Rekapitulasi Agenda ≤ 12 Bulan
              </h2>
              <Link to="/buku-penjagaan" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0">
                Lihat Buku Penjagaan <ExternalLink size={12} />
              </Link>
            </div>
            <motion.div variants={itemVars} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/buku-penjagaan?kategori=KGB&rentang=le12">
                <AlertCard title="KGB ≤ 12 Bulan" count={metrics.peringatanKGB} subtitle="Akan jatuh tempo dalam 12 bulan (siklus 2 tahun)" colorScheme="yellow" />
              </Link>
              <Link to="/buku-penjagaan?kategori=PANGKAT&rentang=le12">
                <AlertCard title="Kenaikan Pangkat ≤ 12 Bulan" count={metrics.peringatanPangkat} subtitle="Usulan kenaikan pangkat akan datang" colorScheme="blue" />
              </Link>
              <Link to="/buku-penjagaan?kategori=BUP&rentang=le12">
                <AlertCard title="Pensiun / BUP ≤ 12 Bulan" count={metrics.peringatanPensiun} subtitle="Mendekati batas usia pensiun" colorScheme="red" />
              </Link>
              <Link to="/buku-penjagaan?rentang=terlambat">
                <AlertCard title="Terlewat" count={metrics.peringatanTerlambat} subtitle="Agenda telah melewati jatuh tempo" colorScheme="red" icon={Bell} />
              </Link>
            </motion.div>
          </section>

          {/* ── SECTION 2b: Kelengkapan Data Pegawai (Core Value) ── */}
          {typeof metrics.kelengkapanLengkap === "number" && (
            <section className="order-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-sm font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  Kelengkapan Data Pegawai &amp; Relasi Aset
                </h2>
                <Link to="/pegawai" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0">
                  Lihat Data ASN / PPPK <ExternalLink size={12} />
                </Link>
              </div>
              <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
                  <Link to="/pegawai?kelengkapan=lengkap" className="block h-full transition-transform hover:-translate-y-0.5">
                    <KpiCard
                      title="Data Lengkap"
                      value={metrics.kelengkapanLengkap ?? 0}
                      icon={ShieldCheck}
                      colorClass="bg-green-100/60 text-green-600"
                      subtitle="Pegawai memenuhi 9 kriteria kelengkapan"
                    />
                  </Link>
                  <Link to="/pegawai?kelengkapan=belum" className="block h-full transition-transform hover:-translate-y-0.5">
                    <KpiCard
                      title="Belum Lengkap"
                      value={metrics.kelengkapanBelum ?? 0}
                      icon={AlertTriangle}
                      colorClass="bg-amber-100/60 text-amber-600"
                      subtitle={`Rata-rata kelengkapan ${metrics.kelengkapanRata ?? 0}%`}
                    />
                  </Link>
                <Card className="md:col-span-2 xl:col-span-2 h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} className="text-amber-500" />
                      <ClipboardList size={16} className="text-amber-500" />
                      <CardTitle className="text-sm">Kriteria yang Paling Sering Belum Terpenuhi</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {metrics.kelengkapanFieldKosong && metrics.kelengkapanFieldKosong.length > 0 ? (
                      <>
                        <HorizontalBarChart data={metrics.kelengkapanFieldKosong.slice(0, 6)} labelClass="w-36" />
                        <p className="text-[11px] text-gray-400 mt-3">
                          Kriteria: NIP 18 digit, Jabatan, Golongan, TMT Golongan, Tanggal Lahir, Foto, Email, Kontak,
                          serta relasi nama pegawai ↔ aset yang bersih (tanpa temuan fuzzy).
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ShieldCheck size={32} className="text-green-500 mb-2" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Seluruh data pegawai sudah lengkap 🎉
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </section>
          )}

          {/* ── SECTION 3: Komposisi SDM ── */}
          <section className="order-3">
            <h2 className="text-sm font-extrabold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              Komposisi SDM
            </h2>
            <motion.div variants={itemVars} className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-stretch">
              {/* Golongan Donut */}
              <Card className="h-full min-h-[310px]">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2"><Award size={16} className="text-blue-500" /><CardTitle className="text-sm">Distribusi Golongan</CardTitle></div>
                </CardHeader>
                <CardContent className="pb-5 min-h-[250px] flex items-center justify-center">
                  {metrics.distribusiGolongan && metrics.distribusiGolongan.length > 0 ? (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-[170px_150px] xl:grid-cols-1 2xl:grid-cols-[170px_150px] items-center justify-center gap-4">
                      <div className="w-[170px] h-[170px] relative shrink-0 mx-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={metrics.distribusiGolongan} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">
                              {metrics.distribusiGolongan.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => [`${v} orang`, ""]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.totalPegawai}</span>
                          <span className="text-[10px] text-gray-500">Pegawai</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full max-w-[132px] min-w-0">
                        {metrics.distribusiGolongan.map((item, i) => (
                          <div key={item.name} className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">Gol. {item.name}</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <p className="text-sm text-gray-400 py-8">Data pegawai belum tersedia</p>}
                </CardContent>
              </Card>
              
              {/* Pendidikan */}
              <Card className="h-full min-h-[310px]">
                <CardHeader className="pb-2"><div className="flex items-center gap-2"><GraduationCap size={16} className="text-green-500" /><CardTitle className="text-sm">Distribusi Pendidikan</CardTitle></div></CardHeader>
                <CardContent className="pb-5 min-h-[250px] flex flex-col justify-center"><HorizontalBarChart data={(metrics.distribusiPendidikan || []).slice(0, 9)} labelClass="w-24" /></CardContent>
              </Card>
              {/* Masa Kerja */}
              <Card className="h-full min-h-[310px]">
                <CardHeader className="pb-2"><div className="flex items-center gap-2"><Timer size={16} className="text-orange-500" /><CardTitle className="text-sm">Distribusi Masa Kerja</CardTitle></div></CardHeader>
                <CardContent className="pb-5 min-h-[250px] flex flex-col justify-center"><HorizontalBarChart data={metrics.distribusiMasaKerja || []} labelClass="w-24" /></CardContent>
              </Card>
            </motion.div>
          </section>


        </div>
      )}
    </motion.div>
  );
}
