const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

if (!code.includes('browserLocalPersistence')) {
  code = code.replace(
    /import \{\s*getAuth,\s*GoogleAuthProvider,\s*signInWithPopup,\s*signOut,\s*onAuthStateChanged,\s*\} from "firebase\/auth";/,
    `import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";`
  );

  code = code.replace(
    /export const auth = getAuth\(app\);/,
    `export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});`
  );

  fs.writeFileSync('src/lib/firebase.ts', code);
}
