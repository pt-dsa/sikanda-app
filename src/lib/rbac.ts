// ---------------------------------------------------------------------------
// SIKANDA — RBAC (Role-Based Access Control)
// ---------------------------------------------------------------------------
// SUMBER KEBENARAN IZIN ADA DI KODE INI, BUKAN DI SHEET (disepakati Tahap 3).
// Alasan: aturan keamanan harus ter-review & tidak rawan salah-edit di
// spreadsheet publik. Sheet `app_access` HANYA menyimpan siapa (email) + peran
// (role) + relasi (nip) + status aktif — bukan aturan izinnya.
//
// Tiga peran:
//   - admin    : CRUD penuh, approval, akun, konfigurasi, dan cleansing.
//   - pimpinan : kewenangan identik dengan admin (label dipertahankan untuk audit).
//   - pegawai  : hanya profil sendiri dan Tanya SIKANDA dalam lingkup data sendiri.
// ---------------------------------------------------------------------------

export type Role = "admin" | "pimpinan" | "pegawai";

/** Identitas pengguna aplikasi (hasil pencocokan email → sheet app_access). */
export interface AppUser {
  email: string;
  role: Role;
  nip?: string; // relasi ke sheet pegawai (WAJIB untuk role 'pegawai')
  nama?: string;
  is_active?: boolean;
}

/** Kunci menu — SELARAS dengan route di App.tsx & navItems di AppShell.tsx. */
export type MenuKey =
  | "dashboard"
  | "pegawai"
  | "buku-penjagaan"
  | "kendaraan"
  | "alat-mesin"
  | "inventaris"
  | "pagu"
  | "pemeliharaan-kendaraan"
  | "peminjaman"
  | "peta"
  | "laporan"
  | "kelola-akun" // baru (admin saja)
  | "cleansing" // Tahap 6 (admin/pimpinan)
  | "tanya"; // Tanya SIKANDA — chat AI (semua peran)

/** Aksi berbutir (action-level), ditegakkan di UI dan (Increment 3) di backend. */
export type Action =
  | "pegawai.create"
  | "pegawai.edit.any"
  | "pegawai.edit.own"
  | "pegawai.delete"
  | "asset.write"
  | "config.write"
  | "cleansing.run"
  | "account.manage";

/**
 * Field profil yang BOLEH diubah pegawai pada BARIS MILIKNYA SENDIRI (disepakati).
 * Field yang mengendalikan KGB/Pangkat/Pensiun (NIP, nama, status, golongan,
 * TMT, tgl lahir, masa kerja, jabatan) SENGAJA tidak termasuk demi integritas data.
 */
export const EDITABLE_FIELDS_OWN: readonly string[] = [
  "foto",
  "kontak",
  "email",
  "tingkat",
  "pendidikan_jurusan",
  "universitas",
  "tahun_lulus",
  "riwayat_diklat",
  "tahun_diklat",
  "keterangan",
];

const ALL_MENUS: MenuKey[] = [
  "dashboard",
  "pegawai",
  "buku-penjagaan",
  "kendaraan",
  "alat-mesin",
  "inventaris",
  "pagu",
  "pemeliharaan-kendaraan",
  "peminjaman",
  "peta",
  "laporan",
  "tanya", // Tanya SIKANDA — semua peran boleh bertanya (konteks SIKANDA saja)
];

const MANAGER_MENUS: MenuKey[] = [...ALL_MENUS, "kelola-akun", "cleansing"];

const MENU_BY_ROLE: Record<Role, MenuKey[]> = {
  admin: MANAGER_MENUS,
  pimpinan: MANAGER_MENUS,
  pegawai: ["pegawai", "tanya"],
};

const ACTIONS_BY_ROLE: Record<Role, Action[]> = {
  admin: [
    "pegawai.create",
    "pegawai.edit.any",
    "pegawai.delete",
    "asset.write",
    "config.write",
    "cleansing.run",
    "account.manage",
  ],
  pimpinan: [
    "pegawai.create",
    "pegawai.edit.any",
    "pegawai.delete",
    "asset.write",
    "config.write",
    "cleansing.run",
    "account.manage",
  ],
  pegawai: ["pegawai.edit.own"],
};

/** Apakah peran ini boleh MELIHAT menu tertentu (filter sidebar & route). */
export function canViewMenu(role: Role | undefined, menu: MenuKey): boolean {
  if (!role) return false;
  return MENU_BY_ROLE[role]?.includes(menu) ?? false;
}

/** Apakah peran ini boleh melakukan aksi tertentu. */
export function can(role: Role | undefined, action: Action): boolean {
  if (!role) return false;
  return ACTIONS_BY_ROLE[role]?.includes(action) ?? false;
}

/**
 * Kepemilikan baris: benar bila user adalah 'pegawai' DAN nip-nya sama persis
 * dengan nip baris. NIP dibandingkan sebagai STRING eksak (Aturan: NIP selalu
 * string; 18 digit, jangan jadi number).
 */
export function isOwnRow(
  user: AppUser | null | undefined,
  nip: string | undefined
): boolean {
  if (!user || user.role !== "pegawai") return false;
  const a = String(user.nip ?? "").trim();
  const b = String(nip ?? "").trim();
  return a !== "" && a === b;
}

/** Bolehkah user mengedit baris pegawai dengan nip tertentu? */
export function canEditPegawaiRow(
  user: AppUser | null | undefined,
  nip: string | undefined
): boolean {
  if (!user) return false;
  if (can(user.role, "pegawai.edit.any")) return true; // admin/pimpinan
  return isOwnRow(user, nip); // pegawai: hanya baris sendiri
}

/** Bolehkah FIELD tertentu diubah oleh user pada baris pegawai ini? */
export function canEditField(
  user: AppUser | null | undefined,
  nip: string | undefined,
  field: string
): boolean {
  if (!user) return false;
  if (can(user.role, "pegawai.edit.any")) return true; // admin/pimpinan: semua field
  if (isOwnRow(user, nip)) return EDITABLE_FIELDS_OWN.includes(field); // pegawai: terbatas
  return false;
}

/** Daftar menu yang boleh dilihat peran (untuk membangun sidebar). */
export function visibleMenus(role: Role | undefined): MenuKey[] {
  if (!role) return [];
  return MENU_BY_ROLE[role] ?? [];
}
