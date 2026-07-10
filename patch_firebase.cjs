const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(
  /export async function getFirebaseIdToken\(\): Promise<string \| null> \{\s*const u = auth\.currentUser;\s*if \(!u\) return null;\s*try \{\s*return await u\.getIdToken\(\);\s*\} catch \{\s*return null;\s*\}\s*\}/,
  `export async function getFirebaseIdToken(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  return await u.getIdToken();
}`
);

fs.writeFileSync('src/lib/firebase.ts', code);
