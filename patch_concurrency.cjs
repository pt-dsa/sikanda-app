const fs = require('fs');
let code = fs.readFileSync('src/services/backendClient.ts', 'utf8');

code = code.replace(
  /if \(pendingRequests < 2\) \{/,
  `if (pendingRequests < 15) {`
);

fs.writeFileSync('src/services/backendClient.ts', code);
