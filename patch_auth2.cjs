const fs = require('fs');

// Patch firebase.ts
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
code = code.replace(
  /export async function getFirebaseIdToken\(\): Promise<string \| null> \{[\s\S]*?return await u\.getIdToken\(\);\s*\}/,
  `export async function getFirebaseIdToken(): Promise<string | null> {
  if (auth.authStateReady) {
    await auth.authStateReady();
  }
  const u = auth.currentUser;
  if (!u) return null;
  return await u.getIdToken();
}`
);
fs.writeFileSync('src/lib/firebase.ts', code);

// Patch backendClient.ts
let backendCode = fs.readFileSync('src/services/backendClient.ts', 'utf8');
backendCode = backendCode.replace(
  /async function sleep[\s\S]*?async function buildAuth/,
  `async function buildAuth`
);
backendCode = backendCode.replace(
  /const idToken = await waitForFirebaseIdToken\(\);/,
  `const idToken = await getFirebaseIdToken();`
);
// Remove pendingRequests and acquireConcurrencySlot
backendCode = backendCode.replace(
  /let pendingRequests = 0;[\s\S]*?export async function callBackend/,
  `export async function callBackend`
);
backendCode = backendCode.replace(
  /await acquireConcurrencySlot\(\);\s*try \{/,
  ``
);
backendCode = backendCode.replace(
  /\} finally \{\s*releaseConcurrencySlot\(\);\s*\}/,
  ``
);

fs.writeFileSync('src/services/backendClient.ts', backendCode);

