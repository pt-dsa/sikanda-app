import type { Equipment, Vehicle } from "@/types";

export const ASSET_CONDITIONS = [
  "BAIK",
  "RUSAK RINGAN",
  "KURANG BAIK",
  "RUSAK BERAT",
] as const;

export const ASSET_CONDITION_UNSET = "BELUM DIISI";

const EMPTY_MARKERS = new Set(["", "-", "NULL", "UNDEFINED", "N/A", "NA"]);

/** Menormalkan nilai kondisi tanpa mengarang nilai pengganti. */
export function normalizeAssetCondition(value: unknown): string {
  const normalized = String(value ?? "").trim().toUpperCase();
  return EMPTY_MARKERS.has(normalized) ? "" : normalized;
}

/** Label aman untuk UI/laporan; nilai kosong tetap dibedakan dari BAIK. */
export function assetConditionLabel(value: unknown): string {
  return normalizeAssetCondition(value) || ASSET_CONDITION_UNSET;
}

export function isValidAssetCondition(value: unknown): boolean {
  const normalized = normalizeAssetCondition(value);
  return ASSET_CONDITIONS.includes(normalized as (typeof ASSET_CONDITIONS)[number]);
}

export interface MissingAssetConditionIssue {
  id: string;
  assetId: string;
  assetLabel: string;
  holderName: string;
  kind: "vehicle" | "equipment";
  kindLabel: "Kendaraan" | "Alat & Mesin";
  editPath: string;
}

/** Audit baca-saja. Fungsi ini tidak pernah menulis atau mengisi kondisi otomatis. */
export function scanMissingAssetConditions(
  vehicles: Vehicle[],
  equipment: Equipment[]
): MissingAssetConditionIssue[] {
  const vehicleIssues = vehicles
    .filter((item) => !normalizeAssetCondition(item.kondisi))
    .map((item) => ({
      id: `vehicle:${item.asset_id}`,
      assetId: String(item.asset_id || ""),
      assetLabel: [item.no_polisi, item.merk || item.nama_aset].filter(Boolean).join(" · ") || "Kendaraan tanpa nama",
      holderName: String(item.pengguna || "").trim(),
      kind: "vehicle" as const,
      kindLabel: "Kendaraan" as const,
      editPath: `/kendaraan?edit=${encodeURIComponent(String(item.asset_id || ""))}`,
    }));

  const equipmentIssues = equipment
    .filter((item) => !normalizeAssetCondition(item.kondisi))
    .map((item) => ({
      id: `equipment:${item.asset_id}`,
      assetId: String(item.asset_id || ""),
      assetLabel: [item.nama_aset, item.merk].filter(Boolean).join(" · ") || "Alat/mesin tanpa nama",
      holderName: String(item.pengguna || "").trim(),
      kind: "equipment" as const,
      kindLabel: "Alat & Mesin" as const,
      editPath: `/alat-mesin?edit=${encodeURIComponent(String(item.asset_id || ""))}`,
    }));

  return [...vehicleIssues, ...equipmentIssues];
}
