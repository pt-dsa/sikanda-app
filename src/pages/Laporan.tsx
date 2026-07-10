import React, { useState } from "react";
import { Download, Printer, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { spreadsheetService } from "@/services/spreadsheetService";
import Papa from "papaparse";
import { useToast } from "@/components/ui/Toast";

export default function Laporan() {
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const toast = useToast();

  const handleExport = async (type: string, name: string) => {
    setIsExporting(true);
    try {
      let data: any[] = [];
      const fetchers: Record<string, () => Promise<any[]>> = {
        'kendaraan': spreadsheetService.getVehicles.bind(spreadsheetService),
        'alat_mesin': spreadsheetService.getEquipment.bind(spreadsheetService),
        'inventaris': spreadsheetService.getInventory.bind(spreadsheetService),
        'pagu_anggaran': spreadsheetService.getBudgets.bind(spreadsheetService),
        'pemeliharaan': spreadsheetService.getMaintenance.bind(spreadsheetService),
        'peminjaman': spreadsheetService.getLoans.bind(spreadsheetService),
      };

      if (fetchers[type]) {
        data = await fetchers[type]();
      }

      // Filter by date range if provided
      if (startDate || endDate) {
        data = data.filter((item) => {
          // Identify the relevant date field for filtering based on the module
          let itemDateStr = item.tanggal || item.tanggal_pengajuan || item.tanggal_pinjam || "";
          
          if (!itemDateStr) return true; // If no date field, include it by default or reject it? Including it seems safer for master data. Let's include everything that has no date.
          
          const itemDate = new Date(itemDateStr);
          if (isNaN(itemDate.getTime())) return true; // Invalid date format
          
          const start = startDate ? new Date(startDate) : new Date("1900-01-01");
          start.setHours(0, 0, 0, 0);
          
          const end = endDate ? new Date(endDate) : new Date("2100-01-01");
          end.setHours(23, 59, 59, 999);
          
          return itemDate >= start && itemDate <= end;
        });
      }

      if (data.length === 0) {
        toast.warning("Ekspor Kosong", `Tidak ada data dalam rentang waktu tersebut pada laporan ${name}`);
        return;
      }

      // Format current date YYYYMMDD
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      let filename = `SIKANDA_${name}_${date}`;
      if (startDate && endDate) {
         filename += `_${startDate.replace(/-/g, '')}_to_${endDate.replace(/-/g, '')}`;
      }
      filename += `.csv`;

      // Export Client-side using PapaParse
      const csvData = Papa.unparse(data);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Ekspor Berhasil", `Laporan ${name} berhasil diunduh.`);

    } catch (err) {
        console.error("Export failed", err);
        toast.error("Ekspor Gagal", "Gagal melakukan ekspor CSV. Terjadi kesalahan internal.");
    } finally {
        setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reports = [
    { id: 'kendaraan', name: 'Kendaraan', description: 'Master data aset kendaraan dinas roda 2 dan roda 4.' },
    { id: 'alat_mesin', name: 'Alat & Mesin', description: 'Master data peralatan dan mesin yang terdaftar.' },
    { id: 'inventaris', name: 'Inventaris Ruangan', description: 'Daftar barang dalam ruang lingkup kantor/dinas.' },
    { id: 'pagu_anggaran', name: 'Pagu Anggaran', description: 'Rekapitulasi pagu pemeliharaan dan suku cadang.' },
    { id: 'pemeliharaan', name: 'Pemeliharaan', description: 'Riwayat service dan perbaikan aset daerah.' },
    { id: 'peminjaman', name: 'Peminjaman', description: 'Log dan riwayat peminjaman aset.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Rekapitulasi Laporan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Unduh data dalam format CSV atau cetak tampilan layar.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 neuglass hover:neuglass-pressed text-gray-700 dark:text-gray-300 font-medium rounded-full transition-colors"
        >
          <Printer size={18} />
          Cetak Halaman
        </button>
      </div>

      <Card className="print:hidden border-0 shadow-sm mb-6">
        <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            <CardTitle className="text-lg">Filter Waktu Kelola Data</CardTitle>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Pilih rentang tanggal untuk memfilter laporan (berlaku untuk Pemeliharaan dan Peminjaman).</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full flex flex-col space-y-1.5">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Mulai</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div className="hidden sm:block mt-6 text-gray-400">-</div>
            <div className="flex-1 w-full flex flex-col space-y-1.5">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Selesai</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          {(startDate || endDate) && (
             <div className="mt-4 flex justify-end">
               <button
                 onClick={() => { setStartDate(''); setEndDate(''); }}
                 className="text-sm text-gray-500 hover:text-red-500 transition-colors"
               >
                 Reset Filter
               </button>
             </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card
            key={report.id}
            onClick={() => { if (!isExporting) handleExport(report.id, report.name); }}
            className={`print:break-inside-avoid shadow-sm border-0 ${isExporting ? "opacity-60" : "cursor-pointer"}`}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{report.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{report.description}</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleExport(report.id, report.name); }}
                disabled={isExporting}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 neuglass-pressed text-blue-700 dark:text-blue-400 font-semibold rounded-full transition-all hover:bg-white/50 dark:hover:bg-black/40 disabled:opacity-50 border border-blue-200/50 dark:border-blue-800/30"
              >
                <Download size={18} />
                Export Data CSV
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
