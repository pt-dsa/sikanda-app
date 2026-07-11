export interface Asset {
  id?: string | number;
  asset_id?: string;
  kode_barang?: string;
  nama_aset?: string;
  merk?: string;
  tahun?: string | number;
  pengguna?: string;
  penanggung_jawab?: string;
  lokasi?: string;
  kondisi?: string;
  foto?: string;
  latitude?: number | string;
  longitude?: number | string;
}

export interface Vehicle extends Asset {
  no_polisi: string;
  tipe?: string;
  jenis_kendaraan?: string;
  km_kendaraan?: string | number;
}

export interface Equipment extends Asset {
  jenis?: string;
  jumlah?: number;
  satuan?: string;
}

export interface Inventory extends Asset {
  jenis?: string;
  jumlah?: number;
  satuan?: string;
  lokasi_ruangan?: string;
}

export interface Budget {
  id?: string;
  tahun_anggaran?: string;
  no_polisi?: string;
  asset_id?: string;
  jenis_kendaraan?: string;
  pagu_service?: number;
  pagu_suku_cadang?: number;
  realisasi_service?: number;
  realisasi_suku_cadang?: number;
  total_pagu?: number;
  total_realisasi?: number;
  sisa_anggaran?: number;
  persentase_realisasi?: number;
}

export interface Maintenance {
  id?: string;
  tanggal?: string;
  no_polisi?: string;
  asset_id?: string;
  nama_barang?: string;
  pemohon?: string;
  jenis_service?: string;
  uraian?: string;
  biaya?: number;
  bengkel?: string;
  vendor?: string;
  status?: string;
  approval?: string;
  spk?: string;
  foto?: string;
  dokumen?: string;
}

export interface Loan {
  id?: string;
  tanggal_pengajuan?: string;
  peminjam?: string;
  bidang?: string;
  asset_type?: string;
  asset_id?: string;
  nama_aset?: string;
  tanggal_pinjam?: string;
  tanggal_kembali?: string;
  keperluan?: string;
  status?: string;
  approval?: string;
  catatan?: string;
}

export interface Pegawai {
  // Core identity (from sheet)
  nip: string;
  nama: string;
  jabatan: string;
  unit_kerja: string;
  golongan: string;
  status: string; // "ASN" | "PPPK"
  kategori_pppk?: "penuh_waktu" | "paruh_waktu" | "";

  // Dates (from sheet, raw string)
  tgl_lahir: string;
  tgl_mulai_golongan: string; // TERHITUNG MULAI TANGGAL (GOLONGAN)
  tgl_mulai_jabatan: string;  // TERHITUNG MULAI TANGGAL (JABATAN)

  // Computed alert dates (YYYY-MM-DD)
  tgl_kgb: string;
  tgl_pangkat: string;
  tgl_pensiun: string;
  kgb_cycle_years?: number;
  pangkat_cycle_years?: number;
  bup_usia?: number;

  // Work metrics (from sheet)
  masa_kerja_tahun: number;
  masa_kerja_bulan: number;

  // Education (from sheet)
  tingkat: string;            // STRATA I, STRATA II, DIPLOMA III, etc.
  pendidikan_jurusan: string;
  universitas: string;
  tahun_lulus: string;

  // Training (from sheet)
  riwayat_diklat: string;
  tahun_diklat: string;

  // Personal / contact
  usia: string;
  kontak: string;
  email: string;
  keterangan: string;
  catatan_mutasi_masuk: string;
  catatan_mutasi_keluar: string;

  // Photo (Google Drive direct URL)
  foto: string;

  // Linked assets (populated after matching)
  assets: any[];
  assets_kendaraan: any[];
  assets_alat_mesin: any[];
  assets_inventaris: any[];
  match_quality: "exact" | "fuzzy" | "none";
  is_incomplete?: boolean;
  is_active?: boolean;
}

// Distribution data point (for charts)
export interface DistribusiItem {
  name: string;
  value: number;
}

export interface DashboardMetrics {
  // HR — Core counts
  totalPegawai: number;
  pegawaiAktif: number;
  pegawaiPensiun: number;
  pegawaiASN: number;
  pegawaiPPPK: number;

  // HR — Buku Penjagaan (akan datang ≤12 bulan; terlambat dihitung TERPISAH)
  peringatanKGB: number;
  peringatanPangkat: number;
  peringatanPensiun: number;
  peringatanTerlambat: number;

  // HR — Kelengkapan Data (Core Value: profil + relasi aset bersih)
  kelengkapanLengkap?: number;              // pegawai 100% lengkap
  kelengkapanBelum?: number;                // pegawai belum lengkap
  kelengkapanRata?: number;                 // rata-rata persen kelengkapan
  kelengkapanFieldKosong?: DistribusiItem[]; // kriteria paling sering kosong

  // HR — Composition charts
  distribusiGolongan: DistribusiItem[];
  distribusiPendidikan: DistribusiItem[];
  distribusiMasaKerja: DistribusiItem[];

  // Assets
  totalAset: number;
  totalKendaraan: number;
  totalAlatMesin: number;
  totalInventaris: number;

  // Transactions
  totalPeminjaman: number;
  totalPemeliharaan: number;

  // Budget
  totalPagu: number;
  totalRealisasi: number;
  persenRealisasi: number;

  // Meta
  lastUpdated?: string | null;

  // Analytics
  assetTrends?: { name: string; Vehicles: number; Equipment: number; Inventory: number }[];
  maintenanceForecast?: {
    avgMonthlyCost: number;
    sixMonthTotal: number;
    forecastData: { name: string; PredictedCost: number }[];
  };
}
