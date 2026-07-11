import React, { useEffect, useMemo, useState } from "react";
import { Download, Printer, RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { spreadsheetService } from "@/services/spreadsheetService";
import Papa from "papaparse";
import { useToast } from "@/components/ui/Toast";
import { buildPenjagaanEvents, type PenjagaanEvent } from "@/lib/penjagaan";
import type { Pegawai, Vehicle } from "@/types";
import {
  filterAgendaReport,
  filterPegawaiReport,
  filterVehicleReport,
  uniqueSorted,
  type AgendaReportFilter,
  type PegawaiReportFilter,
  type VehicleReportFilter,
} from "@/lib/reporting";

const inputCls = "w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/50 outline-none focus:ring-2 focus:ring-blue-500/30";

const initialPegawaiFilter: PegawaiReportFilter = { search: "", status: "", kategoriPppk: "", golongan: "", unitKerja: "" };
const initialAgendaFilter: AgendaReportFilter = { search: "", kategori: "", rentang: "", unitKerja: "", tanggalMulai: "", tanggalSelesai: "" };
const initialVehicleFilter: VehicleReportFilter = { search: "", jenis: "", kondisi: "", tahun: "", pengguna: "" };

function statusLabel(p: Pegawai): string {
  if (p.status !== "PPPK") return p.status;
  if (p.kategori_pppk === "penuh_waktu") return "PPPK (Penuh Waktu)";
  if (p.kategori_pppk === "paruh_waktu") return "PPPK (Paruh Waktu)";
  return "PPPK (Belum Dikategorikan)";
}

function employeeRows(rows: Pegawai[]) {
  return rows.map((p) => ({
    nip: p.nip, nama: p.nama, status: statusLabel(p), golongan: p.golongan,
    jabatan: p.jabatan, unit_kerja: p.unit_kerja, tanggal_lahir: p.tgl_lahir,
    tmt_golongan: p.tgl_mulai_golongan, tmt_jabatan: p.tgl_mulai_jabatan,
    masa_kerja_tahun: p.masa_kerja_tahun, masa_kerja_bulan: p.masa_kerja_bulan,
    pendidikan: p.tingkat, jurusan: p.pendidikan_jurusan, universitas: p.universitas,
    tahun_lulus: p.tahun_lulus, riwayat_diklat: p.riwayat_diklat,
    tahun_diklat: p.tahun_diklat, kontak: p.kontak, email: p.email, keterangan: p.keterangan,
  }));
}

function agendaRows(rows: PenjagaanEvent[]) {
  return rows.map((a) => ({
    nip: a.nip, nama: a.nama, status: a.status, golongan: a.golongan,
    jabatan: a.jabatan, unit_kerja: a.bidang, kategori_agenda: a.kategori,
    jenis_agenda: a.kategoriLabel, tanggal_jatuh_tempo: a.tanggal,
    sisa_hari: a.selisihHari, indikator: a.bucket,
  }));
}

function vehicleRows(rows: Vehicle[]) {
  return rows.map((v) => ({
    asset_id: v.asset_id, kode_barang: v.kode_barang, nama_aset: v.nama_aset,
    nomor_polisi: v.no_polisi, merk: v.merk, tipe: v.tipe,
    jenis_kendaraan: v.jenis_kendaraan, tahun: v.tahun, pengguna: v.pengguna,
    penanggung_jawab: v.penanggung_jawab, lokasi: v.lokasi || v.unit_kerja,
    kondisi: v.kondisi, kilometer: v.km_kendaraan, kapasitas_mesin: v.kapasitas_mesin,
    nomor_bpkb: v.no_bpkb, nomor_rangka: v.no_rangka, nomor_mesin: v.no_mesin,
    harga_pembelian: v.harga_pembelian, latitude: v.latitude, longitude: v.longitude, foto: v.foto,
  }));
}

function localDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function filterDescription(filter: Record<string, string>): string {
  const active = Object.entries(filter).filter(([, value]) => String(value || "").trim());
  return active.length ? active.map(([key, value]) => `${key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}: ${value}`).join(" · ") : "Tanpa filter (seluruh data aktif)";
}

function filterSlug(filter: Record<string, string>): string {
  const values = Object.values(filter).map((value) => String(value || "").trim()).filter(Boolean);
  if (!values.length) return "SEMUA";
  return values.join("_").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "FILTER";
}

function rowsToPrintTable(title: string, rows: Record<string, unknown>[], filterText: string): string {
  if (!rows.length) return `<section><h2>${escapeHtml(title)}</h2><p><b>Filter:</b> ${escapeHtml(filterText)}</p><p>Tidak ada data sesuai filter.</p></section>`;
  const keys = Object.keys(rows[0]);
  const head = keys.map((key) => `<th>${escapeHtml(key.replace(/_/g, " "))}</th>`).join("");
  const body = rows.map((row) => `<tr>${keys.map((key) => `<td>${escapeHtml(row[key])}</td>`).join("")}</tr>`).join("");
  return `<section><h2>${escapeHtml(title)} <small>(${rows.length} data)</small></h2><p><b>Filter:</b> ${escapeHtml(filterText)}</p><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></section>`;
}

export default function Laporan() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [agenda, setAgenda] = useState<PenjagaanEvent[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pegawaiFilter, setPegawaiFilter] = useState(initialPegawaiFilter);
  const [agendaFilter, setAgendaFilter] = useState(initialAgendaFilter);
  const [vehicleFilter, setVehicleFilter] = useState(initialVehicleFilter);

  async function load() {
    setLoading(true);
    try {
      const [employeeData, vehicleData] = await Promise.all([
        spreadsheetService.getPegawai(), spreadsheetService.getVehicles(),
      ]);
      setPegawai(employeeData as Pegawai[]);
      setAgenda(buildPenjagaanEvents(employeeData));
      setVehicles(vehicleData as Vehicle[]);
    } catch (error: any) {
      toast.error("Data Laporan Belum Tersedia", String(error?.message || error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filteredPegawai = useMemo(() => filterPegawaiReport(pegawai, pegawaiFilter), [pegawai, pegawaiFilter]);
  const filteredAgenda = useMemo(() => filterAgendaReport(agenda, agendaFilter), [agenda, agendaFilter]);
  const filteredVehicles = useMemo(() => filterVehicleReport(vehicles, vehicleFilter), [vehicles, vehicleFilter]);

  function exportCsv(rows: Record<string, unknown>[], name: string) {
    if (!rows.length) {
      toast.warning("Ekspor Kosong", "Tidak ada data yang sesuai dengan filter aktif.");
      return;
    }
    setIsExporting(true);
    try {
      const csv = `\uFEFF${Papa.unparse(rows)}`;
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `SIKANDA_${name}_${localDateKey()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Ekspor Berhasil", `${rows.length} data berhasil diunduh.`);
    } catch {
      toast.error("Ekspor Gagal", "CSV belum berhasil dibuat. Silakan coba kembali.");
    } finally {
      setIsExporting(false);
    }
  }

  function handlePrint() {
    const employeeData = employeeRows(filteredPegawai);
    const agendaData = agendaRows(filteredAgenda);
    const vehicleData = vehicleRows(filteredVehicles);
    const content = `<!doctype html><html><head><meta charset="utf-8"><title>Rekap SIKANDA</title><style>
      @page{size:A4 landscape;margin:10mm}body{font-family:Arial,sans-serif;color:#172033;font-size:9px}h1{font-size:18px;margin:0}p{color:#536176}section{page-break-before:always}section:first-of-type{page-break-before:auto}h2{font-size:13px;margin:18px 0 7px}small{font-weight:normal;color:#64748b}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:4px;text-align:left;vertical-align:top}th{background:#eaf1fb;text-transform:capitalize}.meta{margin:5px 0 12px}
    </style></head><body><h1>Rekapitulasi Laporan SIKANDA</h1><div class="meta">Dicetak: ${escapeHtml(new Date().toLocaleString("id-ID"))}</div>
      ${rowsToPrintTable("Data ASN / PPPK", employeeData, filterDescription(pegawaiFilter as unknown as Record<string, string>))}
      ${rowsToPrintTable("Buku Penjagaan", agendaData, filterDescription(agendaFilter as unknown as Record<string, string>))}
      ${rowsToPrintTable("Data Kendaraan", vehicleData, filterDescription(vehicleFilter as unknown as Record<string, string>))}
    </body></html>`;
    const frame = document.createElement("iframe");
    frame.title = "Cetak Rekap SIKANDA";
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.opacity = "0";
    frame.style.border = "0";
    frame.onload = () => {
      const target = frame.contentWindow;
      if (!target) {
        frame.remove();
        toast.error("Cetak Gagal", "Dokumen cetak belum dapat dibuka. Silakan coba kembali.");
        return;
      }
      target.focus();
      target.print();
      window.setTimeout(() => frame.remove(), 60_000);
    };
    frame.srcdoc = content;
    document.body.appendChild(frame);
  }

  const options = {
    statuses: uniqueSorted(pegawai.map((p) => p.status)),
    golongan: uniqueSorted(pegawai.map((p) => p.golongan)),
    units: uniqueSorted(pegawai.map((p) => p.unit_kerja)),
    agendaUnits: uniqueSorted(agenda.map((a) => a.bidang)),
    vehicleTypes: uniqueSorted(vehicles.map((v) => v.jenis_kendaraan)),
    conditions: uniqueSorted(vehicles.map((v) => v.kondisi)),
    years: uniqueSorted(vehicles.map((v) => v.tahun)),
    users: uniqueSorted(vehicles.map((v) => v.pengguna)),
  };

  const searchInput = (value: string, onChange: (value: string) => void, placeholder: string) => (
    <div className="relative"><Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-8`} />
    </div>
  );

  const selectInput = (value: string, onChange: (value: string) => void, allLabel: string, values: string[], labels?: Record<string, string>) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">{allLabel}</option>{values.map((item) => <option key={item} value={item}>{labels?.[item] || item}</option>)}
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Rekapitulasi Laporan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Filter data terlebih dahulu; CSV dan cetak mengikuti hasil filter aktif.</p></div>
        <div className="flex gap-2">
          <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 px-4 py-2 neuglass text-sm font-medium rounded-full disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</button>
          <button onClick={handlePrint} disabled={loading} className="flex items-center gap-2 px-4 py-2 neuglass text-sm font-medium rounded-full disabled:opacity-50"><Printer size={18} />Cetak Halaman</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <Card><CardHeader><CardTitle className="text-lg">Data ASN / PPPK</CardTitle><p className="text-xs text-gray-500">{filteredPegawai.length} dari {pegawai.length} data</p></CardHeader>
          <CardContent className="space-y-2.5">
            {searchInput(pegawaiFilter.search, (search) => setPegawaiFilter({ ...pegawaiFilter, search }), "Nama, NIP, jabatan...")}
            <div className="grid grid-cols-2 gap-2">
              {selectInput(pegawaiFilter.status, (status) => setPegawaiFilter({ ...pegawaiFilter, status }), "Semua Status", options.statuses)}
              {selectInput(pegawaiFilter.kategoriPppk, (kategoriPppk) => setPegawaiFilter({ ...pegawaiFilter, kategoriPppk }), "Semua Kategori PPPK", ["penuh_waktu", "paruh_waktu"], { penuh_waktu: "PPPK Penuh Waktu", paruh_waktu: "PPPK Paruh Waktu" })}
              {selectInput(pegawaiFilter.golongan, (golongan) => setPegawaiFilter({ ...pegawaiFilter, golongan }), "Semua Golongan", options.golongan)}
              {selectInput(pegawaiFilter.unitKerja, (unitKerja) => setPegawaiFilter({ ...pegawaiFilter, unitKerja }), "Semua Unit Kerja", options.units)}
            </div>
            <button onClick={() => exportCsv(employeeRows(filteredPegawai), `Data_ASN_PPPK_${filterSlug(pegawaiFilter as unknown as Record<string, string>)}`)} disabled={isExporting || loading} className="w-full flex justify-center items-center gap-2 px-4 py-2.5 neuglass-pressed text-blue-700 font-semibold rounded-full disabled:opacity-50"><Download size={17} />Unduh CSV Hasil Filter</button>
          </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-lg">Buku Penjagaan</CardTitle><p className="text-xs text-gray-500">{filteredAgenda.length} dari {agenda.length} agenda</p></CardHeader>
          <CardContent className="space-y-2.5">
            {searchInput(agendaFilter.search, (search) => setAgendaFilter({ ...agendaFilter, search }), "Nama, NIP, jabatan...")}
            <div className="grid grid-cols-2 gap-2">
              {selectInput(agendaFilter.kategori, (kategori) => setAgendaFilter({ ...agendaFilter, kategori }), "Semua Agenda", ["KGB", "PANGKAT", "BUP"], { KGB: "KGB", PANGKAT: "Kenaikan Pangkat", BUP: "BUP/Pensiun" })}
              {selectInput(agendaFilter.rentang, (rentang) => setAgendaFilter({ ...agendaFilter, rentang }), "Semua Rentang", ["terlambat", "le3", "le6", "le12"], { terlambat: "Terlambat", le3: "≤ 3 Bulan", le6: "≤ 6 Bulan", le12: "≤ 12 Bulan" })}
              <div className="col-span-2">{selectInput(agendaFilter.unitKerja, (unitKerja) => setAgendaFilter({ ...agendaFilter, unitKerja }), "Semua Unit Kerja", options.agendaUnits)}</div>
              <input type="date" title="Tanggal mulai" value={agendaFilter.tanggalMulai} onChange={(e) => setAgendaFilter({ ...agendaFilter, tanggalMulai: e.target.value })} className={inputCls} />
              <input type="date" title="Tanggal selesai" value={agendaFilter.tanggalSelesai} onChange={(e) => setAgendaFilter({ ...agendaFilter, tanggalSelesai: e.target.value })} className={inputCls} />
            </div>
            <button onClick={() => exportCsv(agendaRows(filteredAgenda), `Buku_Penjagaan_${filterSlug(agendaFilter as unknown as Record<string, string>)}`)} disabled={isExporting || loading} className="w-full flex justify-center items-center gap-2 px-4 py-2.5 neuglass-pressed text-blue-700 font-semibold rounded-full disabled:opacity-50"><Download size={17} />Unduh CSV Hasil Filter</button>
          </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-lg">Data Kendaraan</CardTitle><p className="text-xs text-gray-500">{filteredVehicles.length} dari {vehicles.length} data</p></CardHeader>
          <CardContent className="space-y-2.5">
            {searchInput(vehicleFilter.search, (search) => setVehicleFilter({ ...vehicleFilter, search }), "Nopol, merk, pengguna...")}
            <div className="grid grid-cols-2 gap-2">
              {selectInput(vehicleFilter.jenis, (jenis) => setVehicleFilter({ ...vehicleFilter, jenis }), "Semua Jenis", options.vehicleTypes)}
              {selectInput(vehicleFilter.kondisi, (kondisi) => setVehicleFilter({ ...vehicleFilter, kondisi }), "Semua Kondisi", options.conditions)}
              {selectInput(vehicleFilter.tahun, (tahun) => setVehicleFilter({ ...vehicleFilter, tahun }), "Semua Tahun", options.years)}
              {selectInput(vehicleFilter.pengguna, (pengguna) => setVehicleFilter({ ...vehicleFilter, pengguna }), "Semua Pengguna", options.users)}
            </div>
            <button onClick={() => exportCsv(vehicleRows(filteredVehicles), `Data_Kendaraan_${filterSlug(vehicleFilter as unknown as Record<string, string>)}`)} disabled={isExporting || loading} className="w-full flex justify-center items-center gap-2 px-4 py-2.5 neuglass-pressed text-blue-700 font-semibold rounded-full disabled:opacity-50"><Download size={17} />Unduh CSV Hasil Filter</button>
          </CardContent></Card>
      </div>
    </div>
  );
}
