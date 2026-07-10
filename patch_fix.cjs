const fs = require('fs');
let code = fs.readFileSync('src/services/backendClient.ts', 'utf8');

code = code.replace(/return json as T;\s*\}/g, 'return json as T;\n  } finally {\n    releaseConcurrencySlot();\n  }\n}');
fs.writeFileSync('src/services/backendClient.ts', code);
