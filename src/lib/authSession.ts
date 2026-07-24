export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const SESSION_KEY = "sikanda_supabase_session_v1";

function sessionStorageSafe(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function readAuthSession(): AuthSession | null {
  const storage = sessionStorageSafe();
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(SESSION_KEY) || "null") as Partial<AuthSession> | null;
    if (!value?.accessToken || !value?.refreshToken || !Number.isFinite(value.expiresAt)) return null;
    return {
      accessToken: String(value.accessToken),
      refreshToken: String(value.refreshToken),
      expiresAt: Number(value.expiresAt),
    };
  } catch {
    storage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  const storage = sessionStorageSafe();
  if (!storage) throw new Error("Browser tidak dapat menyimpan sesi SIKANDA.");
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  sessionStorageSafe()?.removeItem(SESSION_KEY);
}

export function sessionNeedsRefresh(session: AuthSession, safetySeconds = 90): boolean {
  return session.expiresAt <= Math.floor(Date.now() / 1000) + safetySeconds;
}

