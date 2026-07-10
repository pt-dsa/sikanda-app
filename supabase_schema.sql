-- SIKANDA Database Schema for Supabase

-- 1. Pegawai
CREATE TABLE IF NOT EXISTS public.pegawai (
  nip TEXT PRIMARY KEY,
  nama TEXT,
  jabatan TEXT,
  unit_kerja TEXT,
  golongan TEXT,
  status TEXT,
  tgl_lahir TEXT,
  tgl_mulai_golongan TEXT,
  tgl_mulai_jabatan TEXT,
  tgl_kgb TEXT,
  tgl_pangkat TEXT,
  tgl_pensiun TEXT,
  masa_kerja_tahun NUMERIC,
  masa_kerja_bulan NUMERIC,
  tingkat TEXT,
  pendidikan_jurusan TEXT,
  universitas TEXT,
  tahun_lulus TEXT,
  riwayat_diklat TEXT,
  tahun_diklat TEXT,
  usia TEXT,
  kontak TEXT,
  email TEXT,
  keterangan TEXT,
  catatan_mutasi_masuk TEXT,
  catatan_mutasi_keluar TEXT,
  foto TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Assets (Vehicle, Equipment, Inventory)
CREATE TABLE IF NOT EXISTS public.assets_vehicle (
  asset_id TEXT PRIMARY KEY,
  kode_barang TEXT,
  nama_aset TEXT,
  merk TEXT,
  tahun TEXT,
  pengguna TEXT,
  penanggung_jawab TEXT,
  lokasi TEXT,
  kondisi TEXT,
  foto TEXT,
  latitude TEXT,
  longitude TEXT,
  no_polisi TEXT,
  tipe TEXT,
  jenis_kendaraan TEXT,
  km_kendaraan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assets_equipment (
  asset_id TEXT PRIMARY KEY,
  kode_barang TEXT,
  nama_aset TEXT,
  merk TEXT,
  tahun TEXT,
  pengguna TEXT,
  penanggung_jawab TEXT,
  lokasi TEXT,
  kondisi TEXT,
  foto TEXT,
  latitude TEXT,
  longitude TEXT,
  jenis TEXT,
  jumlah NUMERIC,
  satuan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assets_inventory (
  asset_id TEXT PRIMARY KEY,
  kode_barang TEXT,
  nama_aset TEXT,
  merk TEXT,
  tahun TEXT,
  pengguna TEXT,
  penanggung_jawab TEXT,
  lokasi TEXT,
  kondisi TEXT,
  foto TEXT,
  latitude TEXT,
  longitude TEXT,
  jenis TEXT,
  jumlah NUMERIC,
  satuan TEXT,
  lokasi_ruangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Maintenance & Budget
CREATE TABLE IF NOT EXISTS public.vehicle_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_anggaran TEXT,
  no_polisi TEXT,
  asset_id TEXT,
  jenis_kendaraan TEXT,
  pagu_service NUMERIC,
  pagu_suku_cadang NUMERIC,
  realisasi_service NUMERIC,
  realisasi_suku_cadang NUMERIC,
  total_pagu NUMERIC,
  total_realisasi NUMERIC,
  sisa_anggaran NUMERIC,
  persentase_realisasi NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal TEXT,
  no_polisi TEXT,
  asset_id TEXT,
  asset_type TEXT, -- 'vehicle' or 'equipment'
  nama_barang TEXT,
  pemohon TEXT,
  jenis_service TEXT,
  uraian TEXT,
  biaya NUMERIC,
  bengkel TEXT,
  vendor TEXT,
  status TEXT,
  approval TEXT,
  spk TEXT,
  foto TEXT,
  dokumen TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Loans
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal_pengajuan TEXT,
  peminjam TEXT,
  bidang TEXT,
  asset_type TEXT,
  asset_id TEXT,
  nama_aset TEXT,
  tanggal_pinjam TEXT,
  tanggal_kembali TEXT,
  keperluan TEXT,
  status TEXT,
  approval TEXT,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Asset Locations
CREATE TABLE IF NOT EXISTS public.asset_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT,
  nama_aset TEXT,
  latitude TEXT,
  longitude TEXT,
  kondisi TEXT,
  pengguna TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. System Config
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. App Access — gerbang akses aplikasi (MIGRASI TOTAL dari sheet app_access)
--    Email hasil Google Sign-In dicocokkan ke tabel ini untuk peran RBAC.
CREATE TABLE IF NOT EXISTS public.app_access (
  email TEXT PRIMARY KEY,
  role TEXT DEFAULT 'pegawai',          -- admin | pimpinan | pegawai
  nip TEXT,                             -- relasi ke pegawai (teks, jaga 18 digit)
  nama TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- PENGAMAN BOOTSTRAP:
-- Untuk repo public, email admin tidak ditulis di source.
-- Tambahkan admin secara manual melalui Table Editor Supabase atau jalankan contoh berikut
-- setelah mengganti email placeholder:
--
-- INSERT INTO public.app_access (email, role, nama, is_active, created_by)
-- VALUES ('admin@example.com', 'admin', 'Administrator SIKANDA', true, 'manual_bootstrap')
-- ON CONFLICT (email) DO UPDATE SET role = 'admin', is_active = true;
