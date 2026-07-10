import React, { useEffect, useState, useMemo } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { Inventory } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card, CardContent } from "@/components/ui/Card";
import { QrCode, MapPin, ImageOff, ZoomIn, X, CheckSquare, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { DetailModal } from '@/components/ui/DetailModal';
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { summarizeBy, toneForKondisi, canonKey } from "@/lib/summary";
import { LoadingState } from "@/components/ui/LoadingState";
import { SafeImage } from "@/components/ui/SafeImage";
import { useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal, CONFIRM_CLOSED, type ConfirmState } from "@/components/ui/ConfirmModal";

export default function Inventaris() {
  const location = useLocation();
  const toast = useToast();
  const [confirmState, setConfirmState] = useState<ConfirmState>(CONFIRM_CLOSED);
  const [data, setData] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterRuangan, setFilterRuangan] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("");

  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Inventory[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search");
    if (q) setSearch(q);
  }, [location.search]);

  // Fungsi muat data di lingkup komponen agar bisa dipanggil ulang
  // (mis. sinkronisasi ulang saat operasi tulis gagal).
  const load = async () => {
    try {
      const res = await spreadsheetService.getInventory();
      setData(res);
    } catch (err: any) {
      toast.error("Gagal Memuat", err?.message || "Tidak dapat memuat data inventaris.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = search ? (
        item.nama_aset?.toLowerCase().includes(search.toLowerCase()) ||
        item.merk?.toLowerCase().includes(search.toLowerCase()) ||
        item.lokasi_ruangan?.toLowerCase().includes(search.toLowerCase()) ||
        item.pengguna?.toLowerCase().includes(search.toLowerCase()) ||
        item.penanggung_jawab?.toLowerCase().includes(search.toLowerCase())
      ) : true;
      const matchRuangan = filterRuangan ? String(item.lokasi_ruangan || "").toLowerCase() === String(filterRuangan || "").toLowerCase() : true;
      const matchKondisi = filterKondisi ? canonKey(item.kondisi) === canonKey(filterKondisi) : true;
      return matchSearch && matchRuangan && matchKondisi;
    });
  }, [data, search, filterRuangan, filterKondisi]);

  const kondisiSummary = useMemo(
    () => summarizeBy(data, (d: Inventory) => d.kondisi).map((b) => ({ ...b, tone: toneForKondisi(b.key) })),
    [data]
  );

  const uniqueRuangan = Array.from(new Set(data.map(d => d.lokasi_ruangan).filter(Boolean)));
  const uniqueKondisi = Array.from(new Set(data.map(d => d.kondisi).filter(Boolean)));

  const handleBulkDelete = () => {
    setConfirmState({
      open: true,
      title: "Hapus Massal",
      message: `Apakah Anda yakin ingin menghapus ${selectedRows.length} data inventaris secara massal?`,
      confirmLabel: "Hapus Semua",
      confirmClass: "bg-red-600 hover:bg-red-700",
      onConfirm: async () => {
        try {
          for (const r of selectedRows) {
            if (r.asset_id) await spreadsheetService.deleteInventory(r.asset_id);
          }
          const idsToDelete = new Set(selectedRows.map(r => r.asset_id));
          setData(prev => prev.filter(item => !idsToDelete.has(item.asset_id)));
          setSelectedRows([]);
          toast.success("Data Dihapus", `${selectedRows.length} data inventaris berhasil dihapus.`);
        } catch (err: any) {
          toast.error("Gagal Menghapus", err.message);
          load();
        }
      },
    });
  };

  const handleBulkUpdateStatus = (newStatus: string) => {
    setConfirmState({
      open: true,
      title: "Ubah Status Massal",
      message: `Apakah Anda yakin ingin mengubah status ${selectedRows.length} item menjadi "${newStatus}"?`,
      confirmLabel: "Ubah Status",
      confirmClass: "bg-blue-600 hover:bg-blue-700",
      onConfirm: async () => {
        try {
          // Persistenkan ke basis data — bukan hanya tampilan (anti data semu).
          for (const r of selectedRows) {
            if (r.asset_id) await spreadsheetService.saveInventory({ asset_id: r.asset_id, kondisi: newStatus }, false);
          }
          const idsToUpdate = new Set(selectedRows.map(r => r.asset_id));
          setData(prev => prev.map(item => idsToUpdate.has(item.asset_id) ? { ...item, kondisi: newStatus } as Inventory : item));
          setSelectedRows([]);
          toast.success("Status Diperbarui", `${selectedRows.length} data inventaris berhasil diperbarui.`);
        } catch (err: any) {
          toast.error("Gagal Memperbarui", err.message);
          load();
        }
      },
    });
  };

  const columns: ColumnDef<Inventory>[] = [
    {
      header: "Nama Barang",
      accessorKey: "nama_aset",
      sortable: true,
      cell: (row) => <span className="font-semibold">{row.nama_aset}</span>,
    },
    {
      header: "Merk",
      accessorKey: "merk",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.merk}</div>
          <div className="text-xs text-gray-500">{row.tahun ? `Tahun: ${row.tahun}` : ""}</div>
        </div>
      ),
    },
    {
      header: "Lokasi Ruangan",
      accessorKey: "lokasi_ruangan",
      sortable: true,
    },
    {
      header: "Jumlah",
      accessorKey: "jumlah",
      sortable: true,
      cell: (row) => <span>{row.jumlah} {row.satuan}</span>
    },
    {
      header: "Kondisi",
      accessorKey: "kondisi",
      sortable: true,
      cell: (row) => (
        <StatusBadge status={row.kondisi || ""} />
      ),
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {row.latitude && row.longitude && (
            <a 
              href={`https://maps.google.com/?q=${String(row.latitude).replace(',', '.').trim()},${String(row.longitude).replace(',', '.').trim()}`}
              target="_blank" rel="noreferrer"
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
              title="Buka di Maps"
            >
              <MapPin size={16} />
            </a>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedQR((row as any).id_aset || (row as any).id || JSON.stringify(row)); }}
            className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 transition-colors"
            title="Generate QR Code"
          >
            <QrCode size={16} />
          </button>
        </div>
      ),
    },
  ];

  const renderMobileCard = (row: Inventory) => (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{row.nama_aset}</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.merk} {row.tahun ? `(${row.tahun})` : ""}</div>
        </div>
        <StatusBadge status={row.kondisi || ""} />
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
        <div>
          <span className="block text-xs text-gray-400 dark:text-gray-500">Lokasi</span>
          {row.lokasi_ruangan || "-"}
        </div>
        <div>
          <span className="block text-xs text-gray-400 dark:text-gray-500">Jumlah</span>
          {row.jumlah} {row.satuan}
        </div>
      </div>
      
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 justify-end">
        {row.latitude && row.longitude && (
          <a 
            href={`https://maps.google.com/?q=${String(row.latitude).replace(',', '.').trim()},${String(row.longitude).replace(',', '.').trim()}`}
            target="_blank" rel="noreferrer"
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
            title="Buka di Maps"
          >
            <MapPin size={16} />
          </a>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); setSelectedQR((row as any).id_aset || (row as any).id || JSON.stringify(row)); }}
          className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 transition-colors"
          title="Generate QR Code"
        >
          <QrCode size={16} />
        </button>
      </div>
    </div>
  );

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Data Inventaris Ruangan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manajemen daftar inventaris berbagai ruangan/bidang</p>
        </div>
        <div className="flex px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
          Total: {filteredData.length} Barang
        </div>
      </div>

      <SummaryCards
        items={kondisiSummary}
        totalLabel="Total Barang"
        totalCount={data.length}
        activeKey={canonKey(filterKondisi)}
        onSelect={(key) => setFilterKondisi(key)}
      />

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput 
            placeholder="Cari nama barang, merk..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={filterRuangan}
            onChange={(e) => setFilterRuangan(e.target.value)}
          >
            <option value="">Semua Lokasi Ruangan</option>
            {uniqueRuangan.map((j: any) => <option key={j} value={j}>{j}</option>)}
          </select>
          <select 
            className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={filterKondisi}
            onChange={(e) => setFilterKondisi(e.target.value)}
          >
            <option value="">Semua Kondisi</option>
            {uniqueKondisi.map((k: any) => <option key={k} value={k}>{k}</option>)}
          </select>
        </CardContent>
      </Card>

      {selectedRows.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium">
            <CheckSquare size={18} />
            <span>{selectedRows.length} Item Terpilih</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Ubah Status:</span>
            <button onClick={() => handleBulkUpdateStatus("BAIK")} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold transition-colors">BAIK</button>
            <button onClick={() => handleBulkUpdateStatus("KURANG BAIK")} className="px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-semibold transition-colors">KURANG BAIK</button>
            <button onClick={() => handleBulkUpdateStatus("RUSAK BERAT")} className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-semibold transition-colors">RUSAK BERAT</button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full text-xs font-semibold transition-colors shadow-sm">
              <Trash2 size={12} />
              Hapus Massal
            </button>
          </div>
        </div>
      )}

      <DataTable 
        data={filteredData} 
        columns={columns} 
        searchQuery={search}
        renderMobileCard={(row, isSelected, onToggle) => (
          <div className="relative">
            {onToggle && (
              <div 
                className="absolute -left-2 -top-2 z-10 p-3 cursor-pointer" 
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
              >
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  readOnly 
                  className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 shadow-sm pointer-events-none" 
                />
              </div>
            )}
            {renderMobileCard(row)}
          </div>
        )}
        onRowClick={(row) => setSelectedItem(row)} 
        selectable={true}
        selectedItems={selectedRows}
        onSelectionChange={setSelectedRows}
        getId={(row) => (row.asset_id || (row as any).id) as string}
      />

      <DetailModal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        title="Detail Inventaris" 
        data={selectedItem ? {
          "Asset ID": selectedItem.asset_id,
          "Kode Barang": selectedItem.kode_barang,
          "Nama Barang": selectedItem.nama_aset,
          "Merk": selectedItem.merk,
          "Lokasi Ruangan": selectedItem.lokasi_ruangan,
          "Jumlah": selectedItem.jumlah ? `${selectedItem.jumlah} ${selectedItem.satuan || ''}` : '',
          "Kondisi": selectedItem.kondisi,
          "Tahun": selectedItem.tahun,
          "Pengguna": selectedItem.pengguna,
          "Harga Pembelian": selectedItem.harga_pembelian,
        } : null} 
      >
        {selectedItem && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Inventaris</span>
              <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center relative group">
                {(() => {
                  const f = selectedItem.foto || selectedItem.foto_1_legacy || selectedItem.photo_1_legacy || "";
                  if (!f) {
                    return (
                      <div className="flex flex-col items-center text-gray-400">
                        <ImageOff size={24} className="mb-2" />
                        <span className="text-xs">Tidak ada foto</span>
                      </div>
                    );
                  }
                  const src = f.startsWith('http') 
                    ? f 
                    : `https://www.appsheet.com/template/gettablefileurl?appName=SIMOSDA-845158139&tableName=Inventaris&fileName=${encodeURIComponent(f)}`;
                  
                  return (
                    <>
                      <img 
                        src={src} 
                        alt="Foto" 
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-white"
                        onClick={(e) => setZoomedImage(e.currentTarget.src)}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = `https://placehold.co/600x400/e2e8f0/64748b?text=Image+Not+Found`;
                          img.onerror = null;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <ZoomIn className="text-white drop-shadow-md" size={32} />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi Terakhir</span>
              <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative group">
                {(() => {
                  let lat, lng;
                  if (selectedItem.latitude && selectedItem.longitude) {
                    lat = String(selectedItem.latitude).replace(',', '.').trim();
                    lng = String(selectedItem.longitude).replace(',', '.').trim();
                  } else if (selectedItem.lokasi) {
                    const parts = String(selectedItem.lokasi).split(',');
                    if (parts.length >= 2) {
                      lat = parts[0].replace(',', '.').trim();
                      lng = parts[1].replace(',', '.').trim();
                    }
                  }

                  if (lat && lng && lat !== 'null' && lng !== 'null') {
                    return (
                      <>
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`} 
                          allowFullScreen 
                          title="Lokasi"
                          loading="lazy"
                        />
                        <a 
                          href={`https://maps.google.com/?q=${lat},${lng}`}
                          target="_blank" rel="noreferrer"
                          className="absolute bottom-2 right-2 p-2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-800 rounded-lg shadow-lg text-xs font-semibold backdrop-blur-sm transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
                        >
                          <MapPin size={14} /> Buka Maps
                        </a>
                      </>
                    );
                  }
                  
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-gray-400">
                      <MapPin size={24} className="mb-2 opacity-50" />
                      <span className="text-xs">Lokasi tidak tersedia</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">QR Code</span>
              <div className="w-full aspect-video bg-white rounded-xl flex items-center justify-center shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset]">
                <QRCodeSVG value={selectedItem.qr_url || selectedItem.asset_id || "N/A"} size={100} />
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X size={24} />
          </button>
          <SafeImage 
            src={zoomedImage} 
            alt="Zoomed" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Basic QR Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300" onClick={() => setSelectedQR(null)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[32px] shadow-xl max-w-sm w-full mx-4 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">QR Code Aset</h3>
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
              <QRCodeSVG value={selectedQR} size={200} />
            </div>
            <button 
              onClick={() => setSelectedQR(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(CONFIRM_CLOSED)} />
    </div>
  );
}
