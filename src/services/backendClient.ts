import { APPS_SCRIPT_URL, isBackendConfigured } from "@/appsScriptConfig";
import { getFirebaseIdToken } from "@/lib/firebase";

export type BackendPayload = Record<string, any>;
export type BackendAuth = { idToken?: string };

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForFirebaseIdToken(timeoutMs = 5000): Promise<string | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const token = await getFirebaseIdToken();
    if (token) return token;
    await sleep(120);
  }
  return getFirebaseIdToken();
}

async function buildAuth(explicitAuth?: BackendAuth): Promise<BackendAuth> {
  if (explicitAuth?.idToken) return { idToken: explicitAuth.idToken };
  const idToken = await waitForFirebaseIdToken();
  if (!idToken) {
    throw new Error("Sesi login tidak ditemukan atau sudah kedaluwarsa. Silakan masuk ulang dengan Google.");
  }
  return { idToken };
}

export async function callBackend<T = any>(
  payload: BackendPayload,
  explicitAuth?: BackendAuth
): Promise<T> {
  if (!isBackendConfigured()) {
    throw new Error(
      "Backend Apps Script belum dikonfigurasi. Isi VITE_APPS_SCRIPT_URL di environment Google AI Studio atau GitHub Actions."
    );
  }

  const auth = await buildAuth(explicitAuth);

  let res: Response;
  try {
    res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, ...auth }),
      redirect: "follow",
    });
  } catch (e: any) {
    throw new Error(
      "Tidak dapat menghubungi server SIKANDA. Periksa koneksi internet dan URL Apps Script. (" +
        (e?.message || e) +
        ")"
    );
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error("Respons server tidak valid. Pastikan Web App Apps Script sudah di-deploy sebagai Web App.");
  }

  if (!json || json.ok !== true) {
    throw new Error((json && json.error) || "Operasi gagal di server SIKANDA.");
  }
  return json as T;
}

export type SupabaseFilter = {
  column: string;
  op?: "eq";
  value: string | number | boolean | null;
};

export async function backendSelect(table: string, filters: SupabaseFilter[] = []): Promise<any[]> {
  const res = await callBackend<{ ok: true; data: any[] }>({ action: "supa_select", table, filters });
  return res.data || [];
}

export async function backendInsert(table: string, data: any | any[]): Promise<any[]> {
  const res = await callBackend<{ ok: true; data: any[] }>({ action: "supa_insert", table, data });
  return res.data || [];
}

export async function backendUpdate(
  table: string,
  data: Record<string, any>,
  match: SupabaseFilter
): Promise<any[]> {
  const res = await callBackend<{ ok: true; data: any[] }>({ action: "supa_update", table, data, match });
  return res.data || [];
}

export async function backendDelete(table: string, match: SupabaseFilter): Promise<any[]> {
  const res = await callBackend<{ ok: true; data: any[] }>({ action: "supa_delete", table, match });
  return res.data || [];
}
