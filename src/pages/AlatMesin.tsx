import React, { useEffect, useState, useMemo } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { Equipment, Pegawai } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card, CardContent } from "@/components/ui/Card";
import { QrCode, MapPin, ImageOff, ZoomIn, X, Plus, Edit2, Trash2, CheckSquare } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { DetailModal } from '@/components/ui/DetailModal';
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { summarizeBy, toneForKondisi, canonKey } from "@/lib/summary";
import { LoadingState } from "@/components/ui/LoadingState";
import { useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal, CONFIRM_CLOSED, type ConfirmState } from "@/components/ui/ConfirmModal";
import { EmployeeAutocomplete, isOfficialEmployeeName } from "@/components/ui/EmployeeAutocomplete";
import { AssetMediaFields } from "@/components/ui/AssetMediaFields";
import { apiService, fileToBase64 } from "@/services/apiService";

export default function AlatMesin() {
  const location = useLocation();
  const toast = useToast();
  const [confirmState, setConfirmState] = useState<ConfirmState>(CONFIRM_CLOSED);
  const [data, setData] = useState<Equipment[]>([]);
  const [employees, setEmployees] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("");

  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Equipment[]>([]);

  // CRUD states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Equipment>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search");
    if (q) setSearch(q);
  }, [location.search]);

  // Fungsi muat data di lingkup komponen agar bisa dipanggil ulang
  // (mis. sinkronisasi ulang saat operasi tulis gagal).
  const load = async () => {
    try {
      const [res, employeeRows] = await Promise.all([
        spreadsheetService.getEquipment(),
        spreadsheetService.getPegawai(),
      ]);
      setData(res);
      setEmployees(employeeRows as Pegawai[]);
    } catch (err: any) {
      toast.error("Gagal Memuat", err?.message || "Tidak dapat memuat data alat/mesin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: "Hapus Data Alat/Mesin",
      message: "Apakah Anda yakin ingin menghapus data alat/mesin ini?",
      confirmLabel: "Hapus",
      confirmClass: "bg-red-600 hover:bg-red-700",
      onConfirm: async () => {
        try {
          await spreadsheetService.deleteEquipment(id);
          setData(prev => prev.filter(item => item.asset_id !== id));
          setSelectedRows(prev => prev.filter(r => r.asset_id !== id));
          toast.success("Data Dihapus", "Data alat/mesin berhasil dihapus.");
        } catch (err: any) {
          toast.error("Gagal Menghapus", err.message);
          load();
        }
      },
    });
  };

  const handleBulkDelete = () => {
    setConfirmState({
      open: true,
      title: "Hapus Massal",
      message: `Apakah Anda yakin ingin menghapus ${selectedRows.length} data alat/mesin secara massal?`,
      confirmLabel: "Hapus Semua",
      confirmClass: "bg-red-600 hover:bg-red-700",
      onConfirm: async () => {
        try {
          for (const r of selectedRows) {
            if (r.asset_id) await spreadsheetService.deleteEquipment(r.asset_id);
          }
          const idsToDelete = new Set(selectedRows.map(r => r.asset_id));
          setData(prev => prev.filter(item => !idsToDelete.has(item.asset_id)));
          setSelectedRows([]);
          toast.success("Data Dihapus", `${selectedRows.length} data alat/mesin berhasil dihapus.`);
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
            if (r.asset_id) await spreadsheetService.saveEquipment({ asset_id: r.asset_id, kondisi: newStatus }, false);
          }
          const idsToUpdate = new Set(selectedRows.map(r => r.asset_id));
          setData(prev => prev.map(item => idsToUpdate.has(item.asset_id) ? { ...item, kondisi: newStatus } : item));
          setSelectedRows([]);
          toast.success("Status Diperbarui", `${selectedRows.length} data alat & mesin berhasil diperbarui.`);
        } catch (err: any) {
          toast.error("Gagal Memperbarui", err.message);
          load();
        }
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(formData.kode_barang || "").trim() || !String(formData.nama_aset || "").trim()) {
      toast.warning("Data Belum Lengkap", "Kode Barang dan Nama Barang wajib diisi.");
      return;
    }
    if (!isOfficialEmployeeName(formData.pengguna, employees) || !isOfficialEmployeeName(formData.penanggung_jawab, employees)) {
      toast.error("Nama Pegawai Tidak Valid", "Pengguna dan Penanggung Jawab harus dipilih dari suggestion Database Pegawai.");
      return;
    }
    const lat = formData.latitude === "" || formData.latitude === undefined ? undefined : Number(formData.latitude);
    const lng = formData.longitude === "" || formData.longitude === undefined ? undefined : Number(formData.longitude);
    if ((lat === undefined) !== (lng === undefined) || (lat !== undefined && (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || Number(lng) < -180 || Number(lng) > 180))) {
      toast.error("Koordinat Tidak Valid", "Latitude dan longitude harus diisi berpasangan dalam rentang koordinat yang benar.");
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !formData.asset_id;
      const result = await spreadsheetService.saveEquipment({ ...formData, latitude: lat, longitude: lng, kondisi: formData.kondisi || "BAIK", jumlah: Number(formData.jumlah || 1) }, isNew);
      if (photoFile) {
        try {
          const encoded = await fileToBase64(photoFile);
          await apiService.uploadAssetFoto({
            table: "assets_equipment",
            assetId: result.asset_id,
            holderName: String(formData.pengguna || ""),
            ...encoded,
          });
        } catch (photoError: any) {
          setFormData({ ...formData, asset_id: result.asset_id });
          await load();
          toast.warning("Data Tersimpan, Foto Belum Terunggah", photoError?.message || "Silakan pilih foto dan simpan kembali.");
          return;
        }
      }
      setIsEditing(false);
      setFormData({});
      setPhotoFile(null);
      spreadsheetService.clearCache();
      await load();
      toast.success(isNew ? "Data Alat & Mesin Berhasil Ditambahkan" : "Perubahan Data Berhasil Disimpan", isNew ? "Data alat & mesin dan media telah tersimpan." : "Perubahan data alat & mesin telah tersimpan dan tervalidasi.");
    } catch (err: any) {
      toast.error("Gagal Menyimpan", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openForm = (item?: Equipment) => {
    setPhotoFile(null);
    if (item) {
      setFormData(item);
    } else {
      setFormData({ kondisi: "BAIK", jumlah: 1, satuan: "Unit" });
    }
    setIsEditing(true);
  };


  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = search ? (
        item.nama_aset?.toLowerCase().includes(search.toLowerCase()) ||
        item.merk?.toLowerCase().includes(search.toLowerCase()) ||
        item.jenis?.toLowerCase().includes(search.toLowerCase()) ||
        item.pengguna?.toLowerCase().includes(search.toLowerCase()) ||
        item.penanggung_jawab?.toLowerCase().includes(search.toLowerCase())
      ) : true;
      const matchJenis = filterJenis ? String(item.jenis || "").toLowerCase() === String(filterJenis || "").toLowerCase() : true;
      const matchKondisi = filterKondisi ? canonKey(item.kondisi) === canonKey(filterKondisi) : true;
      return matchSearch && matchJenis && matchKondisi;
    });
  }, [data, search, filterJenis, filterKondisi]);

  const kondisiSummary = useMemo(
    () => summarizeBy(data, (d: Equipment) => d.kondisi).map((b) => ({ ...b, tone: toneForKondisi(b.key) })),
    [data]
  );

  const uniqueJenis = Array.from(new Set(data.map(d => d.jenis).filter(Boolean)));
  const uniqueKondisi = Array.from(new Set(data.map(d => d.kondisi).filter(Boolean)));

  const columns: ColumnDef<Equipment>[] = [
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
      header: "Jenis",
      accessorKey: "jenis",
      sortable: true,
    },
    {
      header: "Jumlah",
      accessorKey: "jumlah",
      sortable: true,
      cell: (row) => <span>{row.jumlah} {row.satuan}</span>
    },
    {
      header: "Penanggung Jawab",
      accessorKey: "penanggung_jawab",
      sortable: true,
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
            onClick={(e) => { e.stopPropagation(); setSelectedQR((row as any).qr_url || row.asset_id || "N/A"); }}
            className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 transition-colors"
            title="Generate QR Code"
          >
            <QrCode size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); openForm(row); }}
            className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400 transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete((row as any).asset_id || (row as any).id || ""); }}
            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 transition-colors"
            title="Hapus"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const renderMobileCard = (row: Equipment) => (
    <div className="space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{row.nama_aset}</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{row.merk} {row.tahun ? `(${row.tahun})` : ""}</div>
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={row.kondisi || ""} />
        </div>
      </div>
      
      <div className="hidden sm:grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="min-w-0">
          <span className="block text-xs text-gray-400 dark:text-gray-500">Jenis</span>
          <span className="truncate block">{row.jenis || "-"}</span>
        </div>
        <div className="min-w-0">
          <span className="block text-xs text-gray-400 dark:text-gray-500">Penanggung Jawab</span>
          <span className="truncate block">{row.penanggung_jawab || "-"}</span>
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
        <button 
          onClick={(e) => { e.stopPropagation(); openForm(row); }}
          className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400 transition-colors"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleDelete((row as any).asset_id || (row as any).id || ""); }}
          className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 transition-colors"
          title="Hapus"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Data Alat & Mesin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manajemen master data alat berat dan permesinan daerah</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
            Total: {filteredData.length} Aset
          </div>
          <button 
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={16} />
            Tambah Data
          </button>
        </div>
      </div>

      <SummaryCards
        items={kondisiSummary}
        totalLabel="Total Aset"
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
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
          >
            <option value="">Semua Jenis</option>
            {uniqueJenis.map((j: any) => <option key={j} value={j}>{j}</option>)}
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
        title="Detail Alat & Mesin" 
        data={selectedItem ? {
          "Asset ID": selectedItem.asset_id,
          "Kode Barang": selectedItem.kode_barang,
          "Nama Barang": selectedItem.nama_aset,
          "Merk": selectedItem.merk,
          "Jenis": selectedItem.jenis,
          "Jumlah": selectedItem.jumlah ? `${selectedItem.jumlah} ${selectedItem.satuan || ''}` : '',
          "Kondisi": selectedItem.kondisi,
          "Tahun": selectedItem.tahun,
          "Pengguna": selectedItem.pengguna,
          "Penanggung Jawab": selectedItem.penanggung_jawab,
          "Harga Pembelian": selectedItem.harga_pembelian,
        } : null} 
      >
        {selectedItem && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Alat & Mesin</span>
              <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center relative group">
                {(() => {
                  const f = (selectedItem as any).foto || (selectedItem as any).foto_alat_mesin || (selectedItem as any).foto_alat__mesin || (selectedItem as any).gambar || "";
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
                    : `https://www.appsheet.com/template/gettablefileurl?appName=SIMOSDA-845158139&tableName=Alat%20%26%20Mesin&fileName=${encodeURIComponent(f)}`;
                  
                  return (
                    <>
                      <img 
                        src={src} 
                        alt="Foto" 
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity bg-white"
                        onClick={(e) => setZoomedImage(e.currentTarget.src)}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.dataset.retried) {
                            img.dataset.retried = 'true';
                            // Try the other table name variant
                            img.src = `https://www.appsheet.com/template/gettablefileurl?appName=SIMOSDA-845158139&tableName=AlatMesin&fileName=${encodeURIComponent(f)}`;
                          } else {
                            img.src = `https://placehold.co/600x400/e2e8f0/64748b?text=Image+Not+Found`;
                            img.onerror = null;
                          }
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
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm"
                        >
                          Buka di Maps
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
              <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 dark:border-none">
                 <QRCodeSVG value={(selectedItem as any).qr_url || selectedItem.asset_id || "N/A"} size={100} />
              </div>
            </div>
          </div>
        )}
      </DetailModal>

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

      {/* Editing Form */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {formData.asset_id || (formData as any).id ? "Edit Alat & Mesin" : "Tambah Alat & Mesin"}
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden max-h-full">
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.asset_id && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300">Asset ID</label>
                    <input readOnly value={formData.asset_id} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-sm opacity-70" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300">Kode Barang *</label>
                  <input required value={formData.kode_barang || ""} onChange={e => setFormData({...formData, kode_barang: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Kode barang sesuai database" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300">Nama Barang *</label>
                  <input required value={formData.nama_aset || ""} onChange={e => setFormData({...formData, nama_aset: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: Papan Tulis" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Merk</label>
                  <input required value={formData.merk || ""} onChange={e => setFormData({...formData, merk: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: Panasonic" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Jenis</label>
                  <input value={formData.jenis || ""} onChange={e => setFormData({...formData, jenis: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: Elektronik" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Jumlah</label>
                  <input type="number" value={formData.jumlah || ""} onChange={e => setFormData({...formData, jumlah: parseInt(e.target.value) || undefined})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: 10" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Satuan</label>
                  <input value={formData.satuan || ""} onChange={e => setFormData({...formData, satuan: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: Buah" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Tahun Pembelian</label>
                  <input type="number" value={formData.tahun || ""} onChange={e => setFormData({...formData, tahun: parseInt(e.target.value) || undefined})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: 2018" />
                </div>
                <div className="md:col-span-2">
                  <EmployeeAutocomplete label="Pengguna" value={String(formData.pengguna || "")} employees={employees} onChange={(pengguna) => setFormData({ ...formData, pengguna })} placeholder="Ketik nama pengguna alat/mesin..." />
                </div>
                <div className="md:col-span-2">
                  <EmployeeAutocomplete label="Penanggung Jawab" value={String(formData.penanggung_jawab || "")} employees={employees} onChange={(penanggung_jawab) => setFormData({ ...formData, penanggung_jawab })} placeholder="Ketik nama penanggung jawab..." />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Kondisi</label>
                  <select value={formData.kondisi || "BAIK"} onChange={e => setFormData({...formData, kondisi: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-gray-100">
                    <option value="BAIK" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">BAIK</option>
                    <option value="KURANG BAIK" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">KURANG BAIK</option>
                    <option value="RUSAK BERAT" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">RUSAK BERAT</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Harga Pembelian</label>
                  <input type="number" min="0" step="1" value={formData.harga_pembelian || ""} onChange={e => setFormData({...formData, harga_pembelian: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Nilai rupiah tanpa pemisah" />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Lokasi</label>
                  <input value={formData.lokasi || ""} onChange={e => setFormData({...formData, lokasi: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Lokasi/unit penempatan" />
                </div>
                <div className="md:col-span-2 text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-blue-100 pb-2 mt-2">Lokasi Koordinat dan Media</div>
                <AssetMediaFields
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  existingPhoto={formData.foto}
                  selectedFile={photoFile}
                  onCoordinatesChange={(latitude, longitude) => setFormData({ ...formData, latitude, longitude })}
                  onFileChange={setPhotoFile}
                  onError={(message) => toast.error("Lokasi/Media Belum Siap", message)}
                  photoLabel="Foto Alat & Mesin"
                  autoLocate={!formData.asset_id}
                />
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500">URL / Isi QR</label>
                  <input value={formData.qr_url || ""} onChange={e => setFormData({...formData, qr_url: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Kosongkan untuk memakai Asset ID" />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
                <button type="button" disabled={isSaving} onClick={() => { setIsEditing(false); setPhotoFile(null); }} className="px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full font-medium text-sm transition-all border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-50">
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm transition-all disabled:opacity-50">
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setZoomedImage(null)}>
          <button 
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedImage(null);
            }}
          >
            <X size={24} />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed foto" 
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/800x600/e2e8f0/64748b?text=Image+Not+Found`;
              (e.target as HTMLImageElement).onerror = null;
            }}
          />
        </div>
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(CONFIRM_CLOSED)} />
    </div>
  );
}
