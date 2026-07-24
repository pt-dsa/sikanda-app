import { callBackend } from "@/services/backendClient";

export type AccessRole = "admin" | "pimpinan" | "pegawai";

export interface WhoamiResult {
  ok: true;
  email: string;
  role: AccessRole;
  nip: string;
  nama: string;
}

export interface AccessUser {
  email: string;
  role: AccessRole;
  nip: string;
  nama: string;
  is_active: boolean;
  last_login?: string;
  auth_status?: "ready" | "active" | "disabled";
  registered_at?: string;
}

export const accessService = {
  whoami: async (_email?: string): Promise<WhoamiResult> =>
    callBackend<WhoamiResult>({ action: "whoami" }),

  userList: async (): Promise<{ ok: true; users: AccessUser[] }> =>
    callBackend({ action: "user_list" }),

  userSave: async (data: Partial<AccessUser>, isNew: boolean): Promise<{ ok: true; mode?: string; email?: string }> =>
    callBackend({ action: "user_save", data, isNew }),

  userDelete: async (email: string): Promise<{ ok: true; email: string }> =>
    callBackend({ action: "user_delete", email }),

  userResetRegistration: async (email: string): Promise<{ ok: true; email: string }> =>
    callBackend({ action: "user_reset_registration", email }),

  userSeedFromPegawai: async (): Promise<{ ok: true; added: number; note?: string }> =>
    callBackend({ action: "user_seed_from_pegawai" }),
};
