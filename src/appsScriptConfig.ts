// ---------------------------------------------------------------------------
// SIKANDA — Public-safe runtime configuration
// ---------------------------------------------------------------------------
// Tidak ada secret/key asli di source agar repository aman untuk GitHub public.
// Isi nilainya melalui Environment Variables Google AI Studio atau GitHub Actions.
// ---------------------------------------------------------------------------

const env = import.meta.env;

export const APPS_SCRIPT_URL: string = String(env.VITE_APPS_SCRIPT_URL || "").trim();

// Fitur Tanya SIKANDA dipanggil via Apps Script agar API key Gemini disimpan
// di Script Properties, bukan di bundle frontend/repository public.
export const GEMINI_API_KEYS: string[] = [];
export const GEMINI_API_KEY = "";

export const isBackendConfigured = (): boolean =>
  /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(APPS_SCRIPT_URL);
