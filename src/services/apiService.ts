import { callBackend } from "@/services/backendClient";
import type { Pegawai } from "@/types";

export interface UploadFotoResult { ok: true; fileId: string; url: string; viewUrl: string; }
export interface NotificationAgendaItem {
  nip: string; nama: string; jabatan: string; kategori: "KGB" | "PANGKAT" | "BUP";
  kategoriLabel: string; tanggal: string; selisihHari: number;
}
export interface NotificationFeed {
  ok: true; generated_at: string;
  birthdays: Array<{ nip: string; nama: string; jabatan: string; tanggal: string; daysUntil: number }>;
  overdue: NotificationAgendaItem[]; kgb: NotificationAgendaItem[]; pangkat: NotificationAgendaItem[]; bup: NotificationAgendaItem[];
}

// Tipe akses tetap di-re-export dari accessService agar kontrak lama tidak berubah.
export type { WhoamiResult, AccessUser } from "./accessService";

export const apiService = {
  ping: () => callBackend({ action: "ping" }),

  // Identitas / sesi — diverifikasi di Apps Script memakai Firebase idToken,
  // lalu dicocokkan ke Supabase app_access.
  whoami: async (idToken?: string) => {
    return callBackend<{ ok: true; email: string; role: "admin" | "pimpinan" | "pegawai"; nip: string; nama: string }>(
      { action: "whoami" },
      idToken ? { idToken } : undefined
    );
  },

  // Pegawai — tulis via Apps Script agar RLS/secret Supabase tidak ada di frontend.
  savePegawai: async (data: Partial<Pegawai>, isNew: boolean) =>
    callBackend<{ ok: true; mode?: string; nip?: string }>({ action: "pegawai_save", data, isNew }),

  deletePegawai: async (nip: string) =>
    callBackend<{ ok: true; nip: string }>({ action: "pegawai_delete", nip }),

  saveAsset: async (table: "assets_vehicle" | "assets_equipment", data: Record<string, any>, isNew: boolean) =>
    callBackend<{ ok: true; mode: string; asset_id: string }>({ action: "asset_save", table, data, isNew }),

  deleteAsset: async (table: "assets_vehicle" | "assets_equipment", assetId: string) =>
    callBackend<{ ok: true; asset_id: string }>({ action: "asset_delete", table, assetId }),

  uploadFoto: (params: { nip: string; base64: string; mimeType: string; fileName: string }) =>
    callBackend<UploadFotoResult>({ action: "upload_foto", ...params }),

  uploadAssetFoto: (params: {
    table: "assets_vehicle" | "assets_equipment";
    assetId: string;
    holderName?: string;
    base64: string;
    mimeType: string;
    fileName: string;
  }) => callBackend<UploadFotoResult>({ action: "upload_asset_foto", ...params }),

  // Aset: koreksi nama pengguna (Tahap 6 — Data Cleansing fuzzy matching).
  fixAssetHolder: async (table: string, assetId: string, newHolderName: string) => {
    if (table !== "assets_vehicle" && table !== "assets_equipment") {
      throw new Error("Jenis aset tidak dikenali.");
    }
    return callBackend<{ ok: true; sheet: string; assetId: string; newHolderName: string }>({
      action: "asset_fix_holder", table, assetId, newHolderName,
    });
  },

  getConfig: async (): Promise<{ ok: true; config: Record<string, any> }> =>
    callBackend({ action: "get_config" }),

  // Feed fakta tunggal dari Apps Script: dipakai lonceng dan diparitas dengan
  // router database-first Tanya SIKANDA.
  getNotificationFeed: async (): Promise<NotificationFeed> => callBackend({ action: "notification_feed" }),

  setConfig: async (key: string, value: string): Promise<{ ok: true }> =>
    callBackend({ action: "set_config", key, value }),

  runNotifikasi: () => callBackend({ action: "notifikasi_run" }),

  // Tanya SIKANDA — via Apps Script. GEMINI_API_KEY disimpan di Script Properties,
  // tidak pernah masuk ke source public atau bundle frontend.
  askAI: async (
    question: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    dataContext: string
  ): Promise<{ ok: true; answer: string; model?: string; route?: "database" | "gemini" }> => {
    return callBackend({ action: "ai_ask", question, history, dataContext });
  },

  // Kelola Akun — via Supabase app_access di backend.
  userList: async () => callBackend<{ ok: true; users: import("./accessService").AccessUser[] }>({ action: "user_list" }),

  userSave: async (data: Partial<import("./accessService").AccessUser>, isNew: boolean) =>
    callBackend<{ ok: true; mode?: string; email?: string }>({ action: "user_save", data, isNew }),

  userDelete: async (email: string) =>
    callBackend<{ ok: true; email: string }>({ action: "user_delete", email }),

  userSeedFromPegawai: async () =>
    callBackend<{ ok: true; added: number; skipped_missing_email?: number; note?: string }>({ action: "user_seed_from_pegawai" }),
};

// Helper: ubah File -> base64 (tanpa prefix data URL) untuk dikirim ke backend.
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve({ base64, mimeType: file.type || "image/jpeg", fileName: file.name || "foto.jpg" });
    };
    reader.onerror = () => reject(new Error("Gagal membaca berkas foto."));
    reader.readAsDataURL(file);
  });
}
