const fs = require('fs');
let code = fs.readFileSync('src/services/backendClient.ts', 'utf8');

// Tambahkan PQueue sederhana untuk membatasi konkurensi (mencegah 429 dari Identity Toolkit Firebase di backend)
if (!code.includes('let pendingRequests = 0;')) {
  code = code.replace(
    /export async function callBackend<T = any>\(\s*payload: BackendPayload,\s*explicitAuth\?: BackendAuth\s*\): Promise<T> \{/,
    `let pendingRequests = 0;
const requestQueue: Array<() => void> = [];

async function acquireConcurrencySlot(): Promise<void> {
  if (pendingRequests < 2) {
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
  try {`
  );
  
  code = code.replace(
    /return json as T;\s*\}$/,
    `return json as T;
  } finally {
    releaseConcurrencySlot();
  }
}`
  );
  fs.writeFileSync('src/services/backendClient.ts', code);
}
