// ---------------------------------------------------------------------------
// SIKANDA — Firebase Authentication (Google Sign-In)
// ---------------------------------------------------------------------------
// Konfigurasi Firebase web adalah identifier publik, namun tetap dikeluarkan
// dari source agar repo public tidak memuat konfigurasi operasional instansi.
// Isi semua VITE_FIREBASE_* di Google AI Studio / GitHub Actions Secrets.
// ---------------------------------------------------------------------------
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";

const env = import.meta.env;

function envValue(key: string): string {
  return String((env as any)[key] || "").trim();
}

const firebaseConfig = {
  apiKey: envValue("VITE_FIREBASE_API_KEY"),
  authDomain: envValue("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: envValue("VITE_FIREBASE_PROJECT_ID"),
  appId: envValue("VITE_FIREBASE_APP_ID"),
  storageBucket: envValue("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: envValue("VITE_FIREBASE_MESSAGING_SENDER_ID"),
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Sesi berakhir saat browser ditutup; role aplikasi tetap selalu diverifikasi
// ulang oleh backend pada setiap pemuatan halaman.
setPersistence(auth, browserSessionPersistence).catch(() => {});

export interface GoogleSignInResult {
  email: string;
  name: string;
  idToken: string;
}

/** Buka popup Google Sign-In → kembalikan email, nama, dan idToken segar. */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isFirebaseConfigured()) {
    throw new Error("Layanan masuk belum siap. Silakan hubungi administrator.");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  const u = cred.user;
  const idToken = await u.getIdToken();
  return {
    email: String(u.email || "").toLowerCase().trim(),
    name: String(u.displayName || u.email || "").trim(),
    idToken,
  };
}

/** Ambil idToken SEGAR dari sesi Firebase yang sedang berjalan. */
export async function getFirebaseIdToken(): Promise<string | null> {
  if (auth.authStateReady) {
    await auth.authStateReady();
  }
  const u = auth.currentUser;
  if (!u) return null;
  return await u.getIdToken();
}

export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    /* abaikan */
  }
}

/** Pantau perubahan sesi Firebase. cb(true) bila ada user, cb(false) bila tidak. */
export function onFirebaseAuth(cb: (signedIn: boolean) => void): () => void {
  return onAuthStateChanged(auth, (u) => cb(!!u));
}
