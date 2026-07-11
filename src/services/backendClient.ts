import { APPS_SCRIPT_URL, isBackendConfigured } from "@/appsScriptConfig";
import { getFirebaseIdToken } from "@/lib/firebase";

export type BackendPayload = Record<string, any>;
export type BackendAuth = { idToken?: string };

async function buildAuth(explicitAuth?: BackendAuth): Promise<BackendAuth> {
  if (explicitAuth?.idToken) return { idToken: explicitAuth.idToken };
  const idToken = await getFirebaseIdToken();
  if (!idToken) {
    throw new Error("Sesi login tidak ditemukan atau sudah kedaluwarsa. Silakan masuk ulang dengan Google.");
  }
  return { idToken };
}

let pendingRequests = 0;
const requestQueue: Array<() => void> = [];
async function acquireConcurrencySlot(): Promise<void> {
  if (pendingRequests < 6) {
    pendingRequests++;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    requestQueue.push(resolve);
  });
}
function releaseConcurrencySlot() {
  if (requestQueue.length > 0) {
    const next = requestQueue.shift();
    if (next) next();
  } else {
    pendingRequests--;
  }
}

export async function callBackend<T = any>(
  payload: BackendPayload,
  explicitAuth?: BackendAuth
): Promise<T> {
  await acquireConcurrencySlot();
  try {
  
  if (!isBackendConfigured()) {
    throw new Error(
      "Backend Apps Script belum dikonfigurasi. Isi VITE_APPS_SCRIPT_URL di environment Google AI Studio atau GitHub Actions."
    );
  }

  const auth = await buildAuth(explicitAuth);

  let res: Response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30_000);
  try {
    res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, ...auth }),
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("Server SIKANDA tidak merespons dalam 30 detik. Silakan coba lagi.");
    }
    throw new Error(
      "Tidak dapat menghubungi server SIKANDA. Periksa koneksi internet dan URL Apps Script. (" +
        (e?.message || e) +
        ")"
    );
  } finally {
    window.clearTimeout(timeoutId);
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
  } finally {
    releaseConcurrencySlot();
  }
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
