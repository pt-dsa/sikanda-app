import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  UserCog, Plus, Save, X, RefreshCw, ShieldAlert, ShieldCheck, Download,
  CheckCircle2, Ban, Pencil, Mail, IdCard, Users as UsersIcon, RotateCcw,
  Search, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiService, type AccessUser } from "@/services/apiService";
import { spreadsheetService } from "@/services/spreadsheetService";
import type { Pegawai } from "@/types";
import { AuthContext } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { Card, CardContent } from "@/components/ui/Card";
import { ConfirmModal, CONFIRM_CLOSED, type ConfirmState } from "@/components/ui/ConfirmModal";
import { employmentStatusLabel, matchesEmploymentStatus } from "@/lib/employmentStatus";
import { useToast } from "@/components/ui/Toast";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  pimpinan: "Pimpinan",
  pegawai: "Pegawai",
};
const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  pimpinan: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  pegawai: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const inputCls =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none read-only:opacity-60";
const labelCls = "block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1";

function accountStatus(user: AccessUser) {
  if (!user.is_active || user.auth_status === "disabled") return { label: "Dinonaktifkan", className: "text-gray-500 dark:text-gray-400", icon: Ban };
  if (user.auth_status === "active") return { label: "Aktif", className: "text-emerald-600 dark:text-emerald-400", icon: ShieldCheck };
  return { label: "Siap Registrasi", className: "text-amber-600 dark:text-amber-400", icon: IdCard };
}



interface FormState {
  email: string;
  role: "admin" | "pimpinan" | "pegawai";
  nip: string;
  nama: string;
  is_active: boolean;
  auth_status: "ready" | "active" | "disabled";
}
const emptyForm: FormState = { email: "", role: "pegawai", nip: "", nama: "", is_active: true, auth_status: "ready" };

export default function KelolaAkun() {
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pegawaiStatusFilter, setPegawaiStatusFilter] = useState("all");

  // Ganti window.confirm — aman di dalam iframe
  const [confirm, setConfirm] = useState<ConfirmState>(CONFIRM_CLOSED);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const searchStr = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || (
        (u.nama || "").toLowerCase().includes(searchStr) ||
        (u.email || "").toLowerCase().includes(searchStr) ||
        (u.nip || "").includes(searchQuery)
      );
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      
      let matchStatus = true;
      if (statusFilter !== "all") {
        const statusLabel = accountStatus(u).label;
        if (statusFilter === "aktif" && statusLabel !== "Aktif") matchStatus = false;
        if (statusFilter === "siap_registrasi" && statusLabel !== "Siap Registrasi") matchStatus = false;
        if (statusFilter === "nonaktif" && statusLabel !== "Dinonaktifkan") matchStatus = false;
      }

      let matchPegawaiStatus = true;
      if (pegawaiStatusFilter !== "all") {
        const p = pegawai.find((p) => p.nip === u.nip);
        if (!p) {
          matchPegawaiStatus = false;
        } else {
          matchPegawaiStatus = matchesEmploymentStatus(p, pegawaiStatusFilter);
        }
      }

      return matchSearch && matchRole && matchStatus && matchPegawaiStatus;
    });
  }, [users, pegawai, searchQuery, roleFilter, statusFilter, pegawaiStatusFilter]);

  function askConfirm(opts: Omit<ConfirmState, "open">) {
    setConfirm({ ...opts, open: true });
  }
  function closeConfirm() { setConfirm(CONFIRM_CLOSED); }

  async function load(showFullLoading = true, force = false) {
    if (showFullLoading) setLoading(true);
    if (force) spreadsheetService.clearCache();
    setError(null);
    setDenied(false);
    try {
      const [res, employeeRows] = await Promise.all([
        apiService.userList(),
        spreadsheetService.getPegawai(),
      ]);
      const sorted = (res.users || []).slice().sort((a, b) => a.email.localeCompare(b.email));
      setUsers(sorted);
      setPegawai((employeeRows || []).filter((p: Pegawai) => p.is_active !== false));
      return true;
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/admin|akses ditolak|ditolak/i.test(msg)) setDenied(true);
      else setError(msg);
      return false;
    } finally {
      if (showFullLoading) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    const ok = await load(false, true);
    setSyncing(false);
    if (ok) toast.success("Sinkronisasi Berhasil", "Daftar akun dan data pegawai telah diperbarui.");
  }

  function openAdd() {
    setForm(emptyForm);
    setEmployeeQuery("");
    setSuggestionsOpen(false);
    setIsEdit(false);
    setError(null);
    setIsFormOpen(true);
  }

  function openEdit(u: AccessUser) {
    setForm({ email: u.email, role: u.role, nip: String(u.nip || ""), nama: u.nama || "", is_active: u.is_active, auth_status: u.auth_status || "ready" });
    setEmployeeQuery(u.nama || "");
    setSuggestionsOpen(false);
    setIsEdit(true);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSave(e: any) {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Email yang valid wajib diisi.");
      return;
    }
    if (!isEdit && !/^\d{18}$/.test(form.nip.trim())) {
      setError("Pilih nama dari daftar pegawai terlebih dahulu.");
      return;
    }
    setSaving(true);
    try {
      await apiService.userSave(
        { email, role: form.role, nip: form.nip.trim(), nama: form.nama.trim(), is_active: form.is_active },
        !isEdit
      );
      setNotice(isEdit ? `Akun ${email} diperbarui.` : `Akun ${email} ditambahkan.`);
      toast.success(isEdit ? "Perubahan Data Berhasil Disimpan" : "Akun Berhasil Ditambahkan", isEdit ? `Perubahan akun ${email} telah tersimpan.` : `Akun ${email} telah terhubung dengan data pegawai.`);
      setIsFormOpen(false);
      await load();
    } catch (e: any) {
      const message = String(e?.message || e);
      setError(message);
      toast.error("Penyimpanan Akun Gagal", message);
    } finally {
      setSaving(false);
    }
  }

  const candidateEmployees = useMemo(() => {
    const query = employeeQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    const registeredNips = new Set(users.map((u) => String(u.nip || "").trim()).filter(Boolean));
    return pegawai
      .filter((p) => {
        const text = `${p.nama || ""} ${p.nip || ""} ${p.email || ""}`.toLowerCase();
        return text.includes(query) && !registeredNips.has(String(p.nip || "").trim());
      })
      .slice(0, 8);
  }, [employeeQuery, pegawai, users]);
  const selectedEmployee = useMemo(() => pegawai.find((p) => String(p.nip) === String(form.nip)), [pegawai, form.nip]);

  function selectEmployee(employee: Pegawai) {
    const email = String(employee.email || "").toLowerCase().trim();
    setForm((current) => ({
      ...current,
      nip: String(employee.nip || "").trim(),
      nama: String(employee.nama || "").trim(),
      email,
    }));
    setEmployeeQuery(String(employee.nama || "").trim());
    setSuggestionsOpen(false);
    setError(null);
  }

  function handleDeactivate(u: AccessUser) {
    if (u.email === (user?.email || "").toLowerCase()) {
      askConfirm({
        title: "Tidak Dapat Menonaktifkan",
        message: "Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan.",
        confirmLabel: "Mengerti",
        confirmClass: "bg-gray-600 hover:bg-gray-700",
        onConfirm: () => {},
      });
      return;
    }
    askConfirm({
      title: "Nonaktifkan Akun",
      message: `Nonaktifkan akses untuk "${u.email}"?\n\nAkses SIKANDA dan kredensial login akan dinonaktifkan. Jika diaktifkan kembali melalui Edit, user harus melakukan registrasi ulang dan membuat password baru.`,
      confirmLabel: "Nonaktifkan",
      confirmClass: "bg-red-600 hover:bg-red-700",
      onConfirm: async () => {
        try {
          await apiService.userDelete(u.email);
          setNotice(`Akses ${u.email} dinonaktifkan.`);
          toast.success("Akun Dinonaktifkan", `Akses ${u.email} berhasil dinonaktifkan.`);
          await load();
        } catch (e: any) {
          const message = String(e?.message || e);
          setError(message);
          toast.error("Perubahan Akun Gagal", message);
        }
      },
    });
  }

  function handleResetRegistration(u: AccessUser) {
    askConfirm({
      title: "Reset Registrasi",
      message: `Reset password dan registrasi untuk "${u.email}"?\n\nKredensial lama akan dihapus. User harus membuka menu Registrasi dan membuat password baru menggunakan NIP serta email yang sama.`,
      confirmLabel: "Reset Registrasi",
      confirmClass: "bg-amber-600 hover:bg-amber-700",
      onConfirm: async () => {
        try {
          await apiService.userResetRegistration(u.email);
          setNotice(`Registrasi ${u.email} telah direset. User dapat membuat password baru.`);
          toast.success("Reset Registrasi Berhasil", `Akun ${u.email} kembali berstatus Siap Registrasi.`);
          await load();
        } catch (e: any) {
          const message = String(e?.message || e);
          setError(message);
          toast.error("Reset Registrasi Gagal", message);
        }
      },
    });
  }

  function handleSeed() {
    askConfirm({
      title: "Buat dari Data Pegawai",
      message:
        "Buat akun untuk setiap pegawai aktif ber-NIP yang belum terdaftar?\n\n" +
        "• Bila email pegawai valid, akses dibuat dengan status SIAP REGISTRASI.\n" +
        "• User membuat password sendiri melalui halaman Registrasi.\n" +
        "• Bila email kosong/tidak valid, data dilewati dan harus dilengkapi melalui Data ASN/PPPK.",
      confirmLabel: "Tarik Sekarang",
      confirmClass: "bg-blue-600 hover:bg-blue-700",
      onConfirm: async () => {
        setSeeding(true);
        setError(null);
        try {
          const res = await apiService.userSeedFromPegawai();
          setNotice(`Selesai. ${res.added} akun pegawai ditambahkan. ${res.note || ""}`);
          toast.success("Sinkronisasi Akun Berhasil", `${res.added} akun pegawai berhasil ditambahkan. ${res.note || ""}`);
          await load();
        } catch (e: any) {
          const message = String(e?.message || e);
          setError(message);
          toast.error("Sinkronisasi Akun Gagal", message);
        } finally {
          setSeeding(false);
        }
      },
    });
  }

  if (loading) return <LoadingState />;

  if (denied) {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldAlert className="mx-auto mb-3 text-red-500" size={40} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Akses Ditolak</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Halaman Kelola Akun hanya untuk Administrator dan Pimpinan. Peran akun Anda saat ini tidak memiliki izin ini.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dapatLogin = users.filter((u) => u.is_active && u.auth_status === "active").length;
  const siapRegistrasi = users.filter((u) => u.is_active && u.auth_status !== "active").length;

  return (
    <div className="space-y-6">
      {/* Modal konfirmasi (menggantikan window.confirm) */}
      <AnimatePresence>
        {confirm.open && <ConfirmModal state={confirm} onClose={closeConfirm} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCog size={24} /> Kelola Akun
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Daftar NIP, email, status registrasi, dan peran · {users.length} akun ({dapatLogin} dapat login, {siapRegistrasi} siap registrasi)
          </p>
        </div>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 min-h-11 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
            title="Perbarui daftar akun dan data pegawai"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Menyinkronkan..." : "Sinkronisasi"}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center justify-center gap-2 min-h-11 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
            title="Buat akun dari data pegawai aktif"
          >
            {seeding ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            Buat dari Data Pegawai
          </button>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 min-h-11 px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shrink-0"
          >
            <Plus size={16} /> Tambah Akun
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-white/50 dark:bg-gray-800/30">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cari nama, email, atau NIP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="text-gray-400 shrink-0 hidden sm:block" size={16} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-40 px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Semua Peran</option>
                <option value="pegawai">Pegawai</option>
                <option value="admin">Administrator</option>
                <option value="pimpinan">Pimpinan</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Semua Status Akun</option>
                <option value="siap_registrasi">Siap Registrasi</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Dinonaktifkan</option>
              </select>
              <select
                value={pegawaiStatusFilter}
                onChange={(e) => setPegawaiStatusFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Semua Status Pegawai</option>
                <option value="ASN">ASN</option>
                <option value="PPPK_PENUH_WAKTU">PPPK (Penuh Waktu)</option>
                <option value="PPPK_PARUH_WAKTU">PPPK (Paruh Waktu)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {notice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm flex items-start gap-2 border border-emerald-200 dark:border-emerald-800/50">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl text-sm flex items-start gap-2 border border-red-200 dark:border-red-800/50">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabel akun */}
      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              <UsersIcon className="mx-auto mb-3 text-gray-300" size={36} />
              Belum ada akun terdaftar. Tambahkan akun atau buat dari data pegawai.
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              <Search className="mx-auto mb-3 text-gray-300" size={36} />
              Tidak ada akun yang cocok dengan filter pencarian Anda.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
                {filteredUsers.map((u) => (
                  <article key={u.email} className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white/50 dark:bg-gray-800/40 p-4 shadow-sm min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 break-all">
                          {u.email || <span className="text-amber-500 italic font-normal">Email belum diisi</span>}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">{u.nama || "Nama belum ditautkan"}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_BADGE[u.role] || ""}`}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                      <span className="font-mono text-xs text-gray-500 break-all">NIP {u.nip || "—"}</span>
                      {(() => { const status = accountStatus(u); const StatusIcon = status.icon; return <span className={`inline-flex items-center gap-1 text-xs font-bold ${status.className}`}><StatusIcon size={14} /> {status.label}</span>; })()}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button onClick={() => openEdit(u)} className="min-h-11 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-xl" title="Edit">
                          <Pencil size={15} /> Edit
                        </button>
                        {u.is_active && (
                          <button onClick={() => handleDeactivate(u)} className="min-h-11 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/30 rounded-xl" title="Nonaktifkan">
                            <Ban size={15} /> Nonaktifkan
                          </button>
                        )}
                        {u.auth_status === "active" && u.email !== (user?.email || "").toLowerCase() && (
                          <button onClick={() => handleResetRegistration(u)} className="col-span-2 min-h-11 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 dark:bg-amber-900/30 rounded-xl" title="Reset registrasi dan password">
                            <RotateCcw size={15} /> Reset Registrasi
                          </button>
                        )}
                    </div>
                  </article>
                ))}
              </div>
              <div className="hidden md:block overflow-auto max-h-[65vh] rounded-b-xl">
                <table className="w-full text-sm text-left border-collapse relative">
                  <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm">
                    <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 font-bold">Email</th>
                      <th className="px-4 py-3 font-bold">Peran</th>
                      <th className="px-4 py-3 font-bold">Nama</th>
                      <th className="px-4 py-3 font-bold">NIP</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.email} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {u.email || <span className="text-amber-500 dark:text-amber-400 italic text-xs font-normal">(email belum diisi — klik Edit)</span>}
                        </td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_BADGE[u.role] || ""}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.nama || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{u.nip || "—"}</td>
                        <td className="px-4 py-3">
                          {(() => { const status = accountStatus(u); const StatusIcon = status.icon; return <span className={`inline-flex items-center gap-1 text-xs font-bold ${status.className}`}><StatusIcon size={14} /> {status.label}</span>; })()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(u)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Edit"><Pencil size={15} /></button>
                            {u.auth_status === "active" && u.email !== (user?.email || "").toLowerCase() && <button onClick={() => handleResetRegistration(u)} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg" title="Reset Registrasi"><RotateCcw size={15} /></button>}
                            {u.is_active && <button onClick={() => handleDeactivate(u)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Nonaktifkan"><Ban size={15} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal form tambah/edit */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[100dvh] sm:max-h-[90dvh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                  {isEdit ? "Edit Akun" : "Tambah Akun"}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto overscroll-contain">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2 border border-red-200">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {!isEdit && (
                  <div className="relative">
                    <label className={labelCls}>Nama Pegawai <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={employeeQuery}
                      onFocus={() => setSuggestionsOpen(true)}
                      onChange={(e: any) => {
                        setEmployeeQuery(e.target.value);
                        setSuggestionsOpen(true);
                        setForm((current) => ({ ...current, nip: "", nama: "", email: "" }));
                        setError(null);
                      }}
                      placeholder="Ketik minimal 2 huruf nama pegawai..."
                      className={inputCls}
                    />
                    {suggestionsOpen && employeeQuery.trim().length >= 2 && (
                      <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl">
                        {candidateEmployees.length > 0 ? candidateEmployees.map((p) => (
                          <button
                            type="button"
                            key={p.nip}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectEmployee(p)}
                            className="w-full px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b last:border-b-0 border-gray-100 dark:border-gray-800"
                          >
                            <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{p.nama}</span>
                            <span className="block text-xs text-gray-500">NIP {p.nip} · {employmentStatusLabel(p)} · {p.jabatan || "jabatan belum tersedia"} · {p.email || "email belum tersedia"}</span>
                          </button>
                        )) : (
                          <div className="px-3 py-3 text-xs text-gray-500">Nama tidak ditemukan atau pegawai sudah memiliki akun.</div>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">Daftar hanya menampilkan pegawai aktif yang belum memiliki akun.</p>
                  </div>
                )}

                <div>
                  <label className={labelCls}><Mail size={12} className="inline mr-1" />Email untuk Registrasi</label>
                  <input
                    type="email"
                    value={form.email}
                    readOnly={isEdit && form.auth_status === "active"}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="Masukkan email yang akan diverifikasi saat registrasi"
                    className={inputCls}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    {isEdit && form.auth_status === "active" ? "Jalankan Reset Registrasi sebelum mengganti email akun aktif." : "Email ini akan dicocokkan saat user melakukan registrasi."}
                  </p>
                </div>

                <div>
                  <label className={labelCls}>Peran <span className="text-red-500">*</span></label>
                  <select
                    value={form.role}
                    onChange={(e: any) => setForm({ ...form, role: e.target.value })}
                    className={inputCls}
                  >
                    <option value="admin">Administrator — CRUD penuh, konfigurasi, dan kelola akun</option>
                    <option value="pimpinan">Pimpinan — kewenangan penuh setara Administrator</option>
                    <option value="pegawai">Pegawai — akses baca dan perubahan profil sendiri yang diizinkan</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}><IdCard size={12} className="inline mr-1" />NIP</label>
                  <input
                    type="text"
                    value={form.nip}
                    readOnly
                    placeholder="Terisi otomatis dari data pegawai"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Nama</label>
                  <input
                    type="text"
                    value={form.nama}
                    readOnly
                    placeholder="Terisi otomatis dari data pegawai"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Status Pegawai</label>
                  <input type="text" value={selectedEmployee ? employmentStatusLabel(selectedEmployee) : "-"} readOnly className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Jabatan Pegawai</label>
                  <input type="text" value={selectedEmployee?.jabatan || "-"} readOnly placeholder="Terisi otomatis dari data pegawai" className={inputCls} />
                </div>

                {isEdit && <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e: any) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  Izinkan akses akun (user tetap harus menyelesaikan registrasi)
                </label>}
              </div>

              <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end gap-3 safe-area-bottom">
                <button onClick={() => setIsFormOpen(false)} disabled={saving} className="flex-1 sm:flex-none min-h-11 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                  Batal
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none min-h-11 flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                  {saving ? <><RefreshCw size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
