import { APPS_SCRIPT_URL, isBackendConfigured } from "@/appsScriptConfig";
import { getFirebaseIdToken } from "@/lib/firebase";
import {
  beginLoadingTask,
  completeLoadingTask,
  failLoadingTask,
  updateLoadingTask,
} from "@/lib/loadingProgress";

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
  const action = String(payload.action || "");
  const requestId = globalThis.crypto?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  beginLoadingTask(requestId, "Memeriksa sesi pengguna");
  try {

  if (!isBackendConfigured()) {
    throw new Error("Layanan SIKANDA belum siap digunakan. Silakan hubungi administrator.");
  }

  const auth = await buildAuth(explicitAuth);
  updateLoadingTask(requestId, 18, "Menghubungkan data SIKANDA");
  const retryable = new Set(["ping", "whoami", "supa_select", "get_config", "notification_feed", "dashboard_snapshot", "employee_photo_url", "ai_ask"]);
  const attempts = retryable.has(action) ? 2 : 1;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const timeoutMs = retryable.has(action) ? (attempt === 0 ? 25_000 : 40_000) : 45_000;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      updateLoadingTask(requestId, 32, attempt > 0 ? "Mengulangi koneksi" : "Mengambil data terbaru");
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...payload, ...auth, requestId }),
        redirect: "follow",
        signal: controller.signal,
      });
      updateLoadingTask(requestId, 72, "Memproses data");
      let json: any;
      try {
        json = await res.json();
      } catch {
        throw new Error("Jawaban layanan SIKANDA tidak dapat dibaca. Silakan coba lagi.");
      }
      updateLoadingTask(requestId, 92, "Menyiapkan tampilan");
      if (!json || json.ok !== true) {
        const suffix = json?.request_id ? ` (ID: ${json.request_id})` : ` (ID: ${requestId})`;
        throw new Error(((json && json.error) || "Operasi gagal di server SIKANDA.") + suffix);
      }
      completeLoadingTask(requestId);
      return json as T;
    } catch (e: any) {
      const aborted = e?.name === "AbortError";
      lastError = aborted
        ? new Error(`Server SIKANDA belum merespons dalam ${Math.round(timeoutMs / 1000)} detik (ID: ${requestId}).`)
        : new Error(e?.message || `Tidak dapat menghubungi server SIKANDA (ID: ${requestId}).`);
      if (attempt + 1 < attempts && (aborted || /fetch|network|menghubungi/i.test(String(e?.message || "")))) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }
      throw lastError;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
  throw lastError || new Error(`Operasi gagal di server SIKANDA (ID: ${requestId}).`);
  } catch (error) {
    failLoadingTask(requestId);
    throw error;
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
