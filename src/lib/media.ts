/** Satu resolver foto aset untuk Drive, URL aplikasi lama, data URL, dan blob. */
export function resolveAssetPhotoUrl(raw: unknown, assetType: "kendaraan" | "alat_mesin"): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(value)) return value;
  const tableName = assetType === "kendaraan" ? "Kendaraan" : "Alat%20%26%20Mesin";
  return `https://www.appsheet.com/template/gettablefileurl?appName=SIMOSDA-845158139&tableName=${tableName}&fileName=${encodeURIComponent(value)}`;
}
