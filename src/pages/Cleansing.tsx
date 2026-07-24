import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ScanSearch, RefreshCw, CheckCircle2, AlertTriangle,
  ShieldAlert, Info, ChevronDown, ChevronUp, Zap, Check,
  UserCheck2, ExternalLink, Wrench,
} from "lucide-react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { apiService } from "@/services/apiService";
import { AuthContext } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { Card, CardContent } from "@/components/ui/Card";
import { ConfirmModal, CONFIRM_CLOSED, type ConfirmState } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { can } from "@/lib/rbac";
import {
  scanPegawai, buildCorrectionPayload, issueKey,
  ISSUE_META, LEVEL_META,
  scanAssetEmployeeLinks, type AssetNameIssue,
  type CleansingIssue, type IssueCode, type IssueLevel,
} from "@/lib/cleansing";
import { buildUnifiedAssets } from "@/lib/kelengkapan";
import type { Pegawai } from "@/types";
import { scanMissingAssetConditions, type MissingAssetConditionIssue } from "@/lib/assetCondition";
import { EmployeeAutocomplete } from "@/components/ui/EmployeeAutocomplete";

// ---------------------------------------------------------------------------
// Halaman Cleansing (Tahap 6)
// ---------------------------------------------------------------------------

// Urutan level untuk sorting isu
const LEVEL_ORDER: IssueLevel[] = ["kritis", "tinggi", "sedang", "info"];

// Tab filter
type FilterTab = "semua" | IssueCode;

const TABS: Array<{ id: FilterTab; label: string; short: string }> = [
  { id: "semua",              label: "Semua Masalah",      short: "Semua"    },
  { id: "NIP_KOSONG",         label: "NIP Kosong",         short: "NIP ⬚"   },
  { id: "NIP_BUKAN_18_DIGIT", label: "NIP Tidak 18 Digit", short: "NIP ≠18" },
  { id: "NIP_DUPLIKAT",       label: "NIP Duplikat",       short: "Duplikat" },
  { id: "FIELD_WAJIB_KOSONG", label: "Field Wajib Kosong", short: "Kosong"   },
  { id: "STATUS_TIDAK_VALID", label: "Status",             short: "Status"   },
  { id: "TANGGAL_TIDAK_STANDAR",label:"Format Tanggal",    short: "Tanggal"  },
  { id: "NAMA_SPASI_GANDA",   label: "Spasi Nama",         short: "Spasi"    },
  { id: "MATCH_ASET_NONE",    label: "Match Aset",         short: "Aset"     },
];

export default function Cleansing() {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetNip = String(searchParams.get("nip") || "").trim();

  const [pegawaiList, setPegawaiList]   = useState<Pegawai[]>([]);
  const [loading, setLoading]           = useState(true);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<FilterTab>("semua");
  const [applied, setApplied]           = useState<Set<string>>(new Set());
  const [applyingKey, setApplyingKey]   = useState<string | null>(null);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(CONFIRM_CLOSED);
  const [expandedNip, setExpandedNip]   = useState<string | null>(null);

  // Kecocokan nama pegawai ↔ aset (Tahap 6 — fuzzy matching, validasi manual)
  const [assetIssues, setAssetIssues]       = useState<AssetNameIssue[]>([]);
  const [assetApplied, setAssetApplied]     = useState<Set<string>>(new Set());
  const [applyingAssetKey, setApplyingAssetKey] = useState<string | null>(null);
  const [assetScanLoading, setAssetScanLoading] = useState(true);
  const [conditionIssues, setConditionIssues] = useState<MissingAssetConditionIssue[]>([]);
  const [assetSelections, setAssetSelections] = useState<Record<string, Pegawai | undefined>>({});
  const [assetQueries, setAssetQueries] = useState<Record<string, string>>({});

  // Peta NIP → Pegawai (untuk buildCorrectionPayload)
  const pegawaiByNip = useMemo(() => {
    const m = new Map<string, Pegawai>();
    for (const p of pegawaiList) {
      const k = String(p.nip ?? "").trim();
      if (k) m.set(k, p);
    }
    return m;
  }, [pegawaiList]);

  async function load(force = false) {
    if (force) spreadsheetService.clearCache();
    setLoading(true);
    setAssetScanLoading(true);
    setErrorMsg(null);
    setApplied(new Set());     // reset applied saat scan ulang
    setAssetApplied(new Set());
    try {
      const result = await spreadsheetService.getPegawai();
      setPegawaiList(result as Pegawai[]);

      // Pindai kecocokan nama pegawai pada modul aktif V1.
      const [vehicles, equipment] = await Promise.all([
        spreadsheetService.getVehicles(),
        spreadsheetService.getEquipment(),
      ]);
      // Bentuk baku baris aset — builder BERSAMA dengan halaman Pegawai &
      // getDashboardMetrics (@/lib/kelengkapan), satu definisi tanpa duplikasi.
      const unifiedAssets = buildUnifiedAssets(vehicles, equipment);

      const employeeRows = result as Pegawai[];
      const linkIssues = scanAssetEmployeeLinks(employeeRows, unifiedAssets);
      setAssetIssues(linkIssues);
      const initialSelections: Record<string, Pegawai | undefined> = {};
      const initialQueries: Record<string, string> = {};
      for (const issue of linkIssues) {
        const suggestion = employeeRows.find((employee) => String(employee.nip || "") === String(issue.matchedNip || ""));
        initialSelections[issue.id] = suggestion;
        initialQueries[issue.id] = suggestion?.nama || "";
      }
      setAssetSelections(initialSelections);
      setAssetQueries(initialQueries);
      setConditionIssues(scanMissingAssetConditions(vehicles, equipment));
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal memuat data pegawai.");
    } finally {
      setLoading(false);
      setAssetScanLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!targetNip || loading || assetScanLoading) return;
    const timer = window.setTimeout(() => {
      document.getElementById("asset-verification-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [assetScanLoading, loading, targetNip]);

  // Semua isu aktif (yang belum di-apply)
  const allIssues: CleansingIssue[] = useMemo(() => {
    if (pegawaiList.length === 0) return [];
    return scanPegawai(pegawaiList)
      .filter((i) => !applied.has(issueKey(i)))
      .sort((a, b) =>
        LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
      );
  }, [pegawaiList, applied]);

  // Isu yang ditampilkan per tab
  const visibleIssues = useMemo(() => {
    if (activeTab === "semua") return allIssues;
    return allIssues.filter((i) => i.kode === activeTab);
  }, [allIssues, activeTab]);

  // Hitung statistik
  const stats = useMemo(() => {
    const auto   = allIssues.filter((i) => i.bisaAutoKoreksi).length;
    const manual = allIssues.filter((i) => !i.bisaAutoKoreksi && i.level !== "info").length;
    const info   = allIssues.filter((i) => i.level === "info").length;
    return { total: allIssues.length, auto, manual, info };
  }, [allIssues]);

  // Hitung per tab (untuk badge angka)
  const countByTab = useMemo(() => {
    const c: Record<string, number> = { semua: allIssues.length };
    for (const i of allIssues) c[i.kode] = (c[i.kode] ?? 0) + 1;
    return c;
  }, [allIssues]);

  // --- Apply satu isu ---
  async function applyOne(issue: CleansingIssue) {
    if (!can(user?.role, "pegawai.edit.any")) {
      toast.error("Akses Ditolak", "Hanya admin/pimpinan yang dapat menerapkan koreksi.");
      return;
    }
    const p = pegawaiByNip.get(issue.nip);
    if (!p) { toast.error("Data Tidak Ditemukan", "Pegawai tidak ditemukan di data lokal."); return; }
    const payload = buildCorrectionPayload(p, issue);
    if (!payload) return;
    const key = issueKey(issue);
    setApplyingKey(key);
    try {
      await apiService.savePegawai(payload as any, false);
      setApplied((prev) => new Set([...prev, key]));
      toast.success("Koreksi Diterapkan", `${issue.fieldLabel} untuk ${issue.nama} berhasil diperbaiki.`);
    } catch (err: any) {
      toast.error("Gagal", err?.message || "Gagal menerapkan koreksi.");
    } finally {
      setApplyingKey(null);
    }
  }

  // Isu kecocokan nama aset yang masih aktif (belum diterapkan)
  const visibleAssetIssues = useMemo(
    () => assetIssues.filter((a) => !assetApplied.has(a.id) && (!targetNip || String(a.matchedNip) === targetNip)),
    [assetIssues, assetApplied, targetNip]
  );

  // --- Terapkan satu koreksi nama aset (SELALU individual, tidak ada bulk) ---
  async function applyAssetFix(issue: AssetNameIssue) {
    if (!can(user?.role, "pegawai.edit.any")) {
      toast.error("Akses Ditolak", "Hanya admin/pimpinan yang dapat menerapkan koreksi.");
      return;
    }
    const selectedEmployee = assetSelections[issue.id];
    if (!selectedEmployee?.nip) {
      toast.warning("Pilih Pegawai", "Cari lalu pilih nama pegawai dari Data ASN / PPPK terlebih dahulu.");
      return;
    }
    setApplyingAssetKey(issue.id);
    try {
      await apiService.linkAssetEmployee(issue.sheet, issue.assetId, selectedEmployee.nip);
      setAssetApplied((prev) => new Set([...prev, issue.id]));
      spreadsheetService.clearCache();
      toast.success(
        "Nama Pengguna Aset Diperbarui",
        `"${issue.currentHolder}" → "${selectedEmployee.nama}" (NIP ${selectedEmployee.nip}) pada ${issue.sheetLabel}.`
      );
    } catch (err: any) {
      toast.error("Gagal", err?.message || "Gagal memperbarui nama pengguna aset.");
    } finally {
      setApplyingAssetKey(null);
    }
  }

  // --- Apply semua auto-koreksi (satu per satu, jeda 500ms) ---
  async function doApplyAll() {
    if (!can(user?.role, "pegawai.edit.any")) {
      toast.error("Akses Ditolak", "Hanya admin/pimpinan yang dapat menerapkan koreksi.");
      return;
    }
    const autoItems = allIssues.filter((i) => i.bisaAutoKoreksi);
    if (autoItems.length === 0) return;
    setIsApplyingAll(true);
    let berhasil = 0;
    let gagal = 0;
    for (const issue of autoItems) {
      const p = pegawaiByNip.get(issue.nip);
      if (!p) { gagal++; continue; }
      const payload = buildCorrectionPayload(p, issue);
      if (!payload) { gagal++; continue; }
      try {
        await apiService.savePegawai(payload as any, false);
        setApplied((prev) => new Set([...prev, issueKey(issue)]));
        berhasil++;
      } catch {
        gagal++;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    setIsApplyingAll(false);
    spreadsheetService.clearCache();
    if (berhasil > 0) {
      toast.success(
        "Selesai",
        `${berhasil} koreksi berhasil diterapkan${gagal > 0 ? `, ${gagal} gagal` : ""}.`
      );
    } else {
      toast.error("Semua Gagal", `${gagal} koreksi gagal diterapkan.`);
    }
  }

  const canEdit = can(user?.role, "pegawai.edit.any");
  const canEditAssets = can(user?.role, "asset.write");

  if (loading) return <LoadingState />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 space-y-5 min-h-screen"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScanSearch size={24} className="text-blue-600" /> Data Cleansing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Deteksi dan perbaikan inkonsistensi data pegawai serta aset
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && stats.auto > 0 && (
            <button
              disabled={isApplyingAll}
              onClick={() =>
                setConfirmState({
                  open: true,
                  title: "Terapkan Semua Perbaikan Otomatis",
                  message: `Akan menerapkan ${stats.auto} koreksi otomatis secara berurutan.\n\nProses ini tidak dapat diurungkan. Lanjutkan?`,
                  confirmLabel: "Ya, Terapkan Semua",
                  confirmClass: "bg-blue-600 hover:bg-blue-700",
                  onConfirm: doApplyAll,
                })
              }
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-60 transition-colors"
            >
              {isApplyingAll ? (
                <><RefreshCw size={15} className="animate-spin" /> Menerapkan...</>
              ) : (
                <><Zap size={15} /> Terapkan Semua ({stats.auto})</>
              )}
            </button>
          )}
          <button
            onClick={() => load(true)}
            disabled={loading || isApplyingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Scan Ulang
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-sm font-extrabold text-gray-700 dark:text-gray-200 mt-1">Total Masalah</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.auto}</div>
            <div className="text-sm font-extrabold text-gray-700 dark:text-gray-200 mt-1">Dapat Diperbaiki</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.manual}</div>
            <div className="text-sm font-extrabold text-gray-700 dark:text-gray-200 mt-1">Perlu Ditinjau</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">{stats.info}</div>
            <div className="text-sm font-extrabold text-gray-700 dark:text-gray-200 mt-1">Informasi Saja</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{conditionIssues.length}</div>
            <div className="text-sm font-extrabold leading-snug text-gray-700 dark:text-gray-200 mt-1">Kondisi Aset Belum Diisi</div>
          </CardContent>
        </Card>
      </div>

      {/* Data legacy wajib diverifikasi; tidak pernah dikoreksi massal menjadi BAIK. */}
      <section id="asset-condition-section" className="scroll-mt-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wrench size={18} className="text-orange-600" /> Kondisi Aset Belum Diisi
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-3xl">
              Nilai kosong tidak dianggap BAIK. Periksa kondisi fisik setiap aset lalu simpan melalui tombol Perbaiki. Demi integritas data, tidak tersedia pengisian otomatis atau massal.
            </p>
          </div>
          <span className="text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5 rounded-full self-start sm:self-auto">
            {conditionIssues.length} perlu verifikasi
          </span>
        </div>

        {conditionIssues.length === 0 ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/20">
            <CheckCircle2 size={28} className="mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Seluruh aset telah memiliki data kondisi.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-orange-200 bg-white dark:border-orange-900/60 dark:bg-gray-800 overflow-hidden">
            <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
              {conditionIssues.map((issue) => (
                <div key={issue.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full">{issue.kindLabel}</span>
                      <span className="text-xs font-mono text-gray-400">{issue.assetId}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white break-words">{issue.assetLabel}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pengguna: {issue.holderName || "Belum diisi"}</p>
                  </div>
                  {canEditAssets ? (
                    <Link to={issue.editPath} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700">
                      <ExternalLink size={13} /> Perbaiki
                    </Link>
                  ) : (
                    <span className="text-xs italic text-gray-400">Perlu admin/pimpinan</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-1">
          {TABS.map((tab) => {
            const count = countByTab[tab.id] ?? 0;
            if (tab.id !== "semua" && count === 0) return null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {tab.short}
                {count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabel isu */}
      {visibleIssues.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {stats.total === 0
              ? "Tidak ada masalah data yang ditemukan!"
              : "Tidak ada isu pada kategori ini."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-semibold">Pegawai</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Tingkat</th>
                <th className="px-4 py-3 font-semibold">Masalah &amp; Field</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Nilai Saat Ini</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Saran Perbaikan</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {visibleIssues.map((issue) => {
                const key   = issueKey(issue);
                const isBusy = applyingKey === key || isApplyingAll;
                const lvl   = LEVEL_META[issue.level];
                const expanded = expandedNip === key;

                return (
                  <tr
                    key={key}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{issue.nama || "-"}</div>
                      <div className="text-xs text-gray-400 font-mono">{issue.nip || "-"}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${lvl.badge}`}>
                        {lvl.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {ISSUE_META[issue.kode].label}
                      </div>
                      <div className="text-xs text-gray-400">{issue.fieldLabel}</div>
                      {/* Mobile: tampilkan detail saat di-expand */}
                      <button
                        className="lg:hidden text-xs text-blue-500 mt-1 flex items-center gap-1"
                        onClick={() => setExpandedNip(expanded ? null : key)}
                      >
                        {expanded ? <><ChevronUp size={12} /> Sembunyikan</> : <><ChevronDown size={12} /> Lihat detail</>}
                      </button>
                      {expanded && (
                        <div className="lg:hidden mt-2 space-y-1 text-xs">
                          <div className="text-gray-500">Saat ini: <span className="text-red-600 dark:text-red-400 font-mono">{issue.nilaiLama}</span></div>
                          {issue.bisaAutoKoreksi && (
                            <div className="text-gray-500">Saran: <span className="text-green-600 dark:text-green-400 font-mono">{issue.saranPerbaikan}</span></div>
                          )}
                          {!issue.bisaAutoKoreksi && (
                            <div className="text-gray-500 italic">{issue.saranPerbaikan}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded break-all">
                        {issue.nilaiLama}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {issue.bisaAutoKoreksi ? (
                        <span className="text-xs font-mono text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded break-all">
                          {issue.saranPerbaikan}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">{issue.saranPerbaikan}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {issue.bisaAutoKoreksi && canEdit ? (
                        <button
                          disabled={isBusy}
                          onClick={() => applyOne(issue)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {applyingKey === key ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          Terapkan
                        </button>
                      ) : issue.level === "info" ? (
                        <Info size={16} className="text-blue-400 ml-auto" />
                      ) : (
                        <span className="text-xs text-gray-400 italic">Tinjau</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
            Menampilkan {visibleIssues.length} isu
            {activeTab !== "semua" && ` kategori "${ISSUE_META[activeTab as IssueCode]?.label ?? activeTab}"`}
          </div>
        </div>
      )}

      {/* Nama sumber tetap disimpan; NIP pegawai ditetapkan satu per satu. */}
      <div id="asset-verification-section" className="scroll-mt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck2 size={18} className="text-indigo-600" /> Cleansing Nama Pengguna Aset
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Hubungkan setiap nama pengguna dengan pegawai resmi pada menu Data ASN / PPPK. Cari berdasarkan nama, NIP, atau jabatan, lalu simpan satu per satu.
            </p>
          </div>
          {assetScanLoading ? (
            <RefreshCw size={16} className="animate-spin text-gray-400 shrink-0" />
          ) : (
            <span className="text-xs text-gray-400 shrink-0">{visibleAssetIssues.length} ditemukan</span>
          )}
        </div>

        {targetNip && (
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <span>
              Menampilkan data <strong>Perlu Verifikasi</strong> untuk NIP <span className="font-mono font-bold">{targetNip}</span>.
            </span>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-gray-900 dark:text-amber-300"
            >
              Tampilkan Semua
            </button>
          </div>
        )}

        {assetScanLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400 text-sm">
            Memindai data aset...
          </div>
        ) : visibleAssetIssues.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
            <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              {targetNip
                ? "Tidak ada data yang masih memerlukan verifikasi untuk pegawai ini."
                : "Tidak ada ketidaksesuaian nama pegawai-aset yang ditemukan."}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
            {visibleAssetIssues.map((issue) => {
              const isBusy = applyingAssetKey === issue.id;
              const confPct = Math.round(issue.similarity * 100);
              const selectedEmployee = assetSelections[issue.id];
              const confBadge = issue.confidence === "tinggi"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : issue.confidence === "sedang"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
              return (
                <div key={issue.id} className="p-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{issue.sheetLabel}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{issue.assetLabel}</span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${confBadge}`}>
                        {issue.confidence === "belum" ? "Belum terhubung" : `${confPct}% cocok`}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Nama pada data lama/import</p>
                    <p className="mt-1 break-words rounded-lg bg-red-50 px-2 py-1 text-sm font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">{issue.currentHolder}</p>
                    {issue.currentNip && <p className="mt-1 text-xs text-gray-400">NIP lama: {issue.currentNip}</p>}
                  </div>
                  <div className="min-w-0">
                    <EmployeeAutocomplete
                      label="Hubungkan dengan pegawai"
                      value={assetQueries[issue.id] || ""}
                      selectedNip={selectedEmployee?.nip || ""}
                      employees={pegawaiList}
                      onChange={(value) => {
                        setAssetQueries((previous) => ({ ...previous, [issue.id]: value }));
                        setAssetSelections((previous) => ({ ...previous, [issue.id]: undefined }));
                      }}
                      onSelect={(employee) => {
                        setAssetSelections((previous) => ({ ...previous, [issue.id]: employee || undefined }));
                        if (employee) setAssetQueries((previous) => ({ ...previous, [issue.id]: employee.nama }));
                      }}
                      placeholder="Cari nama, NIP, atau jabatan pegawai..."
                    />
                  </div>
                  {canEdit ? (
                    <button
                      disabled={isBusy || !selectedEmployee?.nip}
                      onClick={() => setConfirmState({
                        open: true,
                        title: "Hubungkan Nama Pengguna",
                        message: `Hubungkan pengguna pada ${issue.sheetLabel} (${issue.assetLabel}) dari:\n"${issue.currentHolder}"\n\ndengan pegawai:\n"${selectedEmployee?.nama}"\nNIP ${selectedEmployee?.nip}\nJabatan: ${selectedEmployee?.jabatan || "Belum tersedia"}\n\nPastikan orangnya benar sebelum menyimpan.`,
                        confirmLabel: "Ya, Hubungkan",
                        confirmClass: "bg-indigo-600 hover:bg-indigo-700",
                        onConfirm: () => applyAssetFix(issue),
                      })}
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {isBusy ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                      Hubungkan
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 italic shrink-0">Perlu admin/pimpinan</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(CONFIRM_CLOSED)} />
    </motion.div>
  );
}
