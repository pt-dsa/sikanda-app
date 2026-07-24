import { callBackend, callPublicBackend } from "@/services/backendClient";
import { clearAuthSession, saveAuthSession, type AuthSession } from "@/lib/authSession";
import type { AppUser } from "@/lib/rbac";

export type CaptchaPurpose = "login" | "register";

export interface CaptchaChallenge {
  ok: true;
  challengeId: string;
  target: number;
  vertical: number;
  expiresIn: number;
}

export interface CaptchaProof {
  challengeId: string;
  position: number;
  elapsedMs: number;
  track: number[];
}

interface AuthBackendSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface AuthResult {
  ok: true;
  session?: AuthBackendSession;
  user?: AppUser & { photo_nip?: string };
  registered?: boolean;
  requires_login?: boolean;
  message?: string;
}

function persist(result: AuthResult): { user: AppUser | null; requiresLogin: boolean; message?: string } {
  if (result.session) {
    const session: AuthSession = {
      accessToken: result.session.access_token,
      refreshToken: result.session.refresh_token,
      expiresAt: Number(result.session.expires_at),
    };
    saveAuthSession(session);
  }
  return {
    user: result.user || null,
    requiresLogin: result.requires_login === true,
    message: result.message,
  };
}

export const authService = {
  challenge: (purpose: CaptchaPurpose, clientKey: string) =>
    callPublicBackend<CaptchaChallenge>({ action: "captcha_challenge", purpose, clientKey }),

  login: async (nip: string, password: string, captcha: CaptchaProof, clientKey: string) =>
    persist(await callPublicBackend<AuthResult>({ action: "auth_login", nip, password, captcha, clientKey })),

  register: async (nip: string, email: string, password: string, captcha: CaptchaProof, clientKey: string) =>
    persist(await callPublicBackend<AuthResult>({ action: "auth_register", nip, email, password, captcha, clientKey })),

  logout: async () => {
    try {
      await callBackend({ action: "auth_logout" });
    } finally {
      clearAuthSession();
    }
  },
};

