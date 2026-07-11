import React, { useState } from "react";
import { Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { spreadsheetService } from "@/services/spreadsheetService";
import Papa from "papaparse";
import { useToast } from "@/components/ui/Toast";

export default function Laporan() {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const handleExport = async (type: string, name: string) => {
    setIsExporting(true);
    try {
      let data: any[] = [];
      const fetchers: Record<string, () => Promise<any[]>> = {
        'kendaraan': spreadsheetService.getVehicles.bind(spreadsheetService),
        'alat_mesin': spreadsheetService.getEquipment.bind(spreadsheetService),
      };

      if (fetchers[type]) {
        data = await fetchers[type]();
      }

      if (data.length === 0) {
        toast.warning("Ekspor Kosong", `Tidak ada data dalam rentang waktu tersebut pada laporan ${name}`);
        return;
      }

      // Format current date YYYYMMDD
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      let filename = `SIKANDA_${name}_${date}`;
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
