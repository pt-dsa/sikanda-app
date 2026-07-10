const fs = require('fs');
let code = fs.readFileSync('src/services/backendClient.ts', 'utf8');

code = code.replace(
  /async function waitForFirebaseIdToken\(timeoutMs = 5000\): Promise<string \| null> \{[\s\S]*?return getFirebaseIdToken\(\);\s*\}/,
  `async function waitForFirebaseIdToken(timeoutMs = 5000): Promise<string | null> {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const token = await getFirebaseIdToken();
      if (token) return token;
    } catch (e) {
      lastError = e;
    }
    await sleep(120);
  }
  try {
    return await getFirebaseIdToken();
  } catch (e) {
    throw e;
  }
}`
);

fs.writeFileSync('src/services/backendClient.ts', code);
