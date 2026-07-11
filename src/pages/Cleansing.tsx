import React, { useContext, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ScanSearch, RefreshCw, CheckCircle2, AlertTriangle,
  ShieldAlert, Info, ChevronDown, ChevronUp, Zap, Check,
  UserCheck2, ArrowRight,
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
  scanAssetNameMismatches, type AssetNameIssue,
  type CleansingIssue, type IssueCode, type IssueLevel,
} from "@/lib/cleansing";
import { buildUnifiedAssets } from "@/lib/kelengkapan";
import type { Pegawai } from "@/types";

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

      setAssetIssues(scanAssetNameMismatches(result as Pegawai[], unifiedAssets));
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal memuat data pegawai.");
    } finally {
      setLoading(false);
      setAssetScanLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
    () => assetIssues.filter((a) => !assetApplied.has(a.id)),
    [assetIssues, assetApplied]
  );

  // --- Terapkan satu koreksi nama aset (SELALU individual, tidak ada bulk) ---
  async function applyAssetFix(issue: AssetNameIssue) {
    if (!can(user?.role, "pegawai.edit.any")) {
      toast.error("Akses Ditolak", "Hanya admin/pimpinan yang dapat menerapkan koreksi.");
      return;
    }
    setApplyingAssetKey(issue.id);
    try {
      await apiService.fixAssetHolder(issue.sheet, issue.assetId, issue.matchedNama);
      setAssetApplied((prev) => new Set([...prev, issue.id]));
      spreadsheetService.clearCache();
      toast.success(
        "Nama Pengguna Aset Diperbarui",
        `"${issue.currentHolder}" → "${issue.matchedNama}" pada ${issue.sheetLabel}.`
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
            Deteksi dan perbaikan inkonsistensi data pegawai
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && stats.auto > 0 && (
            <button
              disabled={isApplyingAll}
              onClick={() =>
                setConfirmState({
                  open: true,
                  title: "Terapkan Semua Auto-Koreksi",
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
                <><Zap size={15} /> Terapkan Semua Auto ({stats.auto})</>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Masalah</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.auto}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Siap Auto-Koreksi</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.manual}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Perlu Review Manual</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">{stats.info}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Informasi Saja</div>
          </CardContent>
        </Card>
      </div>

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
                        <span className="text-xs text-gray-400 italic">Manual</span>
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

      {/* ── SECTION: Kecocokan Nama Pegawai ↔ Aset (fuzzy matching, validasi manual) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck2 size={18} className="text-indigo-600" /> Kecocokan Nama Pegawai ↔ Aset
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Nama pengguna aset yang mirip namun tidak identik dengan nama baku di sheet pegawai.
              Setiap item harus ditinjau &amp; diterapkan satu per satu (tidak ada penerapan massal).
            </p>
          </div>
          {assetScanLoading ? (
            <RefreshCw size={16} className="animate-spin text-gray-400 shrink-0" />
          ) : (
            <span className="text-xs text-gray-400 shrink-0">{visibleAssetIssues.length} ditemukan</span>
          )}
        </div>

        {assetScanLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400 text-sm">
            Memindai data aset...
          </div>
        ) : visibleAssetIssues.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
            <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Tidak ada ketidaksesuaian nama pegawai-aset yang ditemukan.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
            {visibleAssetIssues.map((issue) => {
              const isBusy = applyingAssetKey === issue.id;
              const confPct = Math.round(issue.similarity * 100);
              const confBadge =
                issue.confidence === "tinggi"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
              return (
                <div key={issue.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        {issue.sheetLabel}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{issue.assetLabel}</span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${confBadge}`}>
                        {confPct}% mirip
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                        {issue.currentHolder}
                      </span>
                      <ArrowRight size={14} className="text-gray-400 shrink-0" />
                      <span className="font-mono text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                        {issue.matchedNama}
                      </span>
                      <span className="text-xs text-gray-400">(NIP {issue.matchedNip})</span>
                    </div>
                  </div>
                  {canEdit ? (
                    <button
                      disabled={isBusy}
                      onClick={() =>
                        setConfirmState({
                          open: true,
                          title: "Terapkan Koreksi Nama Aset",
                          message: `Ubah nama pengguna pada ${issue.sheetLabel} (${issue.assetLabel}) dari:\n"${issue.currentHolder}"\n\nmenjadi:\n"${issue.matchedNama}"\n\nPastikan ini benar-benar orang yang sama sebelum menerapkan.`,
                          confirmLabel: "Ya, Terapkan",
                          confirmClass: "bg-indigo-600 hover:bg-indigo-700",
                          onConfirm: () => applyAssetFix(issue),
                        })
                      }
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {isBusy ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                      Terapkan
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 italic shrink-0">Manual (perlu admin/pimpinan)</span>
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
