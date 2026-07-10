import React, { useEffect, useState, useMemo } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { Budget } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card, CardContent } from "@/components/ui/Card";
import { DetailModal } from '@/components/ui/DetailModal';
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { paguStatusOf, paguStatusLabel, toneForPaguStatus, type PaguStatus } from "@/lib/summary";
import { formatCurrency } from "@/lib/utils";
import { LoadingState } from "@/components/ui/LoadingState";

export default function PaguAnggaran() {
  const [data, setData] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | PaguStatus>("");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await spreadsheetService.getBudgets();
        setData(res);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchTahun = filterTahun ? item.tahun_anggaran?.toString() === filterTahun : true;
      // Status serapan memakai ambang IDENTIK dengan kolom Realisasi(%) di tabel.
      const matchStatus = filterStatus ? paguStatusOf(item.persentase_realisasi || 0) === filterStatus : true;
      return matchTahun && matchStatus;
    });
  }, [data, filterTahun, filterStatus]);

  const uniqueTahun = Array.from(new Set(data.map(d => d.tahun_anggaran).filter(Boolean)));

  // Ringkasan status serapan dari data NYATA. Total = semua baris pagu.
  const statusSummary = useMemo(() => {
    const order: PaguStatus[] = ["aman", "monitoring", "kritis"];
    const counts: Record<PaguStatus, number> = { aman: 0, monitoring: 0, kritis: 0 };
    for (const b of data) counts[paguStatusOf(b.persentase_realisasi || 0)]++;
    return order
      .filter((s) => counts[s] > 0)
      .map((s) => ({ key: s, label: paguStatusLabel(s), count: counts[s], tone: toneForPaguStatus(s) }));
  }, [data]);

  const columns: ColumnDef<Budget>[] = [
    {
      header: "Nomor Polisi",
      accessorKey: "no_polisi",
      sortable: true,
      cell: (row) => <span className="font-semibold">{row.no_polisi}</span>,
    },
    {
      header: "Tahun",
      accessorKey: "tahun_anggaran",
      sortable: true,
    },
    {
      header: "Total Pasu",
      accessorKey: "total_pagu",
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(row.total_pagu || 0)}</span>,
    },
    {
      header: "Total Realisasi",
      accessorKey: "total_realisasi",
      sortable: true,
      cell: (row) => <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(row.total_realisasi || 0)}</span>,
    },
    {
      header: "Sisa Anggaran",
      accessorKey: "sisa_anggaran",
      sortable: true,
      cell: (row) => <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(row.sisa_anggaran || 0)}</span>,
    },
    {
      header: "Realisasi (%)",
      accessorKey: "persentase_realisasi",
      sortable: true,
      cell: (row) => {
        const pct = row.persentase_realisasi || 0;
        let colorObj = "bg-green-500";
        let status = "Aman";
        if (pct > 70) { colorObj = "bg-amber-500"; status = "Perlu Monitoring"; }
        if (pct > 90) { colorObj = "bg-red-500"; status = "Kritis"; }
        
        return (
          <div className="flex flex-col gap-1 w-32">
            <div className="flex justify-between text-xs">
              <span>{pct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className={`${colorObj} h-full rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">{status}</span>
          </div>
        );
      },
    },
  ];

  const renderMobileCard = (row: Budget) => {
    const pct = row.persentase_realisasi || 0;
    let colorObj = "bg-green-500";
    let status = "Aman";
    if (pct > 70) { colorObj = "bg-amber-500"; status = "Monitoring"; }
    if (pct > 90) { colorObj = "bg-red-500"; status = "Kritis"; }

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{row.no_polisi}</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahun: {row.tahun_anggaran}</div>
          </div>
          <StatusBadge status={status} />
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
          <div>
            <span className="block text-[10px] uppercase text-gray-400 dark:text-gray-500 font-semibold mb-1">Pagu</span>
            <div className="font-medium text-xs">{formatCurrency(row.total_pagu || 0)}</div>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-gray-400 dark:text-gray-500 font-semibold mb-1">Realisasi</span>
            <div className="font-medium text-xs text-blue-600 dark:text-blue-400">{formatCurrency(row.total_realisasi || 0)}</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Persentase</span>
            <span className="font-medium">{pct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div className={`${colorObj} h-full rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Pagu & Realisasi Anggaran</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring anggaran pemeliharaan dan suku cadang kendaraan</p>
        </div>
      </div>

      {statusSummary.length > 0 && (
        <SummaryCards
          items={statusSummary as any}
          totalLabel="Total Pagu"
          totalCount={data.length}
          activeKey={filterStatus}
          onSelect={(key) => setFilterStatus(key as any)}
        />
      )}

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput 
            placeholder="Cari no polisi..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
          >
            <option value="">Semua Tahun</option>
            {uniqueTahun.map((j: any) => <option key={j} value={j}>{j}</option>)}
          </select>
        </CardContent>
      </Card>

      <DataTable 
        data={data} 
        columns={columns} 
        searchQuery={search}
        renderMobileCard={renderMobileCard}
        onRowClick={(row) => setSelectedItem(row)} 
      />

      <DetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detail Informasi" data={selectedItem} />
    </div>
  );
}
