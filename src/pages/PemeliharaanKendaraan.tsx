import React, { useEffect, useState, useMemo } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { Maintenance } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card, CardContent } from "@/components/ui/Card";
import { DetailModal } from '@/components/ui/DetailModal';
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { summarizeBy, toneForStatus, canonKey } from "@/lib/summary";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/LoadingState";

export default function PemeliharaanKendaraan() {
  const [data, setData] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await spreadsheetService.getMaintenance();
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
    () => summarizeBy(data, (d: Maintenance) => d.status).map((b) => ({ ...b, tone: toneForStatus(b.key) })),
    [data]
  );

  const uniqueStatus = Array.from(new Set(data.map(d => d.status).filter(Boolean)));

  const columns: ColumnDef<Maintenance>[] = [
    {
      header: "Tansgal",
      accessorKey: "tanggal",
      sortable: true,
      cell: (row) => <span>{formatDate(row.tanggal)}</span>,
    },
    {
      header: "Nomor Polisi",
      accessorKey: "no_polisi",
      sortable: true,
      cell: (row) => <span className="font-semibold text-blue-600 dark:text-blue-400">{row.no_polisi}</span>,
    },
    {
      header: "Pemohon",
      accessorKey: "pemohon",
      sortable: true,
    },
    {
      header: "Jenis Service",
      accessorKey: "jenis_service",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.jenis_service}</div>
          <div className="text-xs text-gray-500 truncate max-w-[200px]">{row.uraian}</div>
        </div>
      ),
    },
    {
      header: "Benskel",
      accessorKey: "bengkel",
      sortable: true,
    },
    {
      header: "Biaya",
      accessorKey: "biaya",
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(row.biaya || 0)}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (row) => <StatusBadge status={row.status || ""} />
    },
  ];

  const renderMobileCard = (row: Maintenance) => (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{row.no_polisi}</div>
          <div className="text-xs font-medium text-gray-500">{formatDate(row.tanggal)}</div>
        </div>
        <StatusBadge status={row.status || ""} />
      </div>
      
      <div className="space-y-1">
        <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{row.jenis_service}</div>
        <div className="text-xs text-gray-500 leading-relaxed">{row.uraian || "-"}</div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
        <div>
          <span className="block text-[10px] uppercase text-gray-400 dark:text-gray-500 font-semibold mb-1">Bengkel</span>
          <div className="font-medium text-xs truncate">{row.bengkel || "-"}</div>
        </div>
        <div>
          <span className="block text-[10px] uppercase text-gray-400 dark:text-gray-500 font-semibold mb-1">Biaya</span>
          <div className="font-medium text-xs text-gray-900 dark:text-gray-100">{formatCurrency(row.biaya || 0)}</div>
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Riwayat Pemeliharaan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Data riwayat service dan pengadaan suku cadang kendaraan dinas</p>
        </div>
        <div className="flex px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
          Total: {filteredData.length} Riwayat
        </div>
      </div>

      {statusSummary.length > 0 && (
        <SummaryCards
          items={statusSummary}
          totalLabel="Total Riwayat"
          totalCount={data.length}
          activeKey={canonKey(filterStatus)}
          onSelect={(key) => setFilterStatus(key)}
        />
      )}

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput 
            placeholder="Cari no polisi, pemohon, jenis service..." 
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
