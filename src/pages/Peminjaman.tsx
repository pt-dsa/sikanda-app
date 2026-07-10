import React, { useEffect, useState, useMemo } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { Loan } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card, CardContent } from "@/components/ui/Card";
import { DetailModal } from '@/components/ui/DetailModal';
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { summarizeBy, toneForStatus, canonKey } from "@/lib/summary";
import { formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/LoadingState";

export default function Peminjaman() {
  const [data, setData] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await spreadsheetService.getLoans();
        setData(res);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchStatus = filterStatus ? canonKey(item.status) === canonKey(filterStatus) : true;
      return matchStatus;
    });
  }, [data, filterStatus]);

  const statusSummary = useMemo(
    () => summarizeBy(data, (d: Loan) => d.status).map((b) => ({ ...b, tone: toneForStatus(b.key) })),
    [data]
  );

  const uniqueStatus = Array.from(new Set(data.map(d => d.status).filter(Boolean)));

  const columns: ColumnDef<Loan>[] = [
    {
      header: "Tansgal Pengajuan",
      accessorKey: "tanggal_pengajuan",
      sortable: true,
      cell: (row) => <span>{formatDate(row.tanggal_pengajuan)}</span>,
    },
    {
      header: "Peminjam",
      accessorKey: "peminjam",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{row.peminjam}</div>
          <div className="text-xs text-gray-500">{row.bidang}</div>
        </div>
      ),
    },
    {
      header: "Nama Aset",
      accessorKey: "nama_aset",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.nama_aset || row.asset_id}</div>
          <div className="text-xs text-gray-500 uppercase">{row.asset_type}</div>
        </div>
      ),
    },
    {
      header: "Masa Pinjam",
      sortable: false,
      cell: (row) => (
         <div className="text-sm">
           <span className="block">{formatDate(row.tanggal_pinjam)}</span>
           <span className="block text-gray-500">s/d {formatDate(row.tanggal_kembali)}</span>
         </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (row) => {
        let isLate = false;
        if (String(row.status || "").toLowerCase() === 'dipinjam' && row.tanggal_kembali) {
            const today = new Date();
            const kembali = new Date(row.tanggal_kembali);
            if (today > kembali) isLate = true;
        }

        return (
          <div className="flex flex-col gap-1 items-start">
            <StatusBadge status={row.status || ""} />
            {isLate && <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">Terlambat</span>}
          </div>
        )
      }
    },
  ];

  const renderMobileCard = (row: Loan) => {
    let isLate = false;
    if (String(row.status || "").toLowerCase() === 'dipinjam' && row.tanggal_kembali) {
        const today = new Date();
        const kembali = new Date(row.tanggal_kembali);
        if (today > kembali) isLate = true;
    }

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold text-base text-gray-900 dark:text-gray-100">{row.nama_aset || row.asset_id}</div>
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">{row.asset_type}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
             <StatusBadge status={row.status || ""} />
             {isLate && <span className="text-[10px] text-red-500 font-semibold uppercase">Terlambat</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-sm text-gray-800 dark:text-gray-200"><span className="text-gray-500">Peminjam:</span> {row.peminjam}</div>
          <div className="text-xs text-gray-500">Bidang: {row.bidang}</div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
          <div>
            <span className="block text-[10px] uppercase text-gray-400 dark:text-gray-500 font-semibold mb-1">Tgl Pinjam</span>
            <div className="font-medium text-xs">{formatDate(row.tanggal_pinjam)}</div>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-gray-400 dark:text-gray-500 font-semibold mb-1">Tgl Kembali</span>
            <div className={`font-medium text-xs ${isLate ? "text-red-500" : ""}`}>{formatDate(row.tanggal_kembali)}</div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Peminjaman Aset</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring pengajuan dan riwayat peminjaman aset daerah</p>
        </div>
        <div className="flex px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
          Total: {filteredData.length} Peminjaman
        </div>
      </div>

      {statusSummary.length > 0 && (
        <SummaryCards
          items={statusSummary}
          totalLabel="Total Peminjaman"
          totalCount={data.length}
          activeKey={canonKey(filterStatus)}
          onSelect={(key) => setFilterStatus(key)}
        />
      )}

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput 
            placeholder="Cari aset, peminjam..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            {uniqueStatus.map((j: any) => <option key={j} value={j}>{j}</option>)}
          </select>
        </CardContent>
      </Card>

      <DataTable 
        data={filteredData} 
        columns={columns} 
        searchQuery={search}
        renderMobileCard={renderMobileCard}
        onRowClick={(row) => setSelectedItem(row)} 
      />

      <DetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detail Informasi" data={selectedItem} />
    </div>
  );
}
