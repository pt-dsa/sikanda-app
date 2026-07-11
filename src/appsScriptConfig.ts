// ---------------------------------------------------------------------------
// SIKANDA — Public-safe runtime configuration
// ---------------------------------------------------------------------------
// Tidak ada secret/key asli di source agar repository aman untuk GitHub public.
// Isi nilainya melalui Environment Variables Google AI Studio atau GitHub Actions.
// ---------------------------------------------------------------------------

const env = import.meta.env;

export const APPS_SCRIPT_URL: string = String(env.VITE_APPS_SCRIPT_URL || "").trim();

export const isBackendConfigured = (): boolean =>
  /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(APPS_SCRIPT_URL);
