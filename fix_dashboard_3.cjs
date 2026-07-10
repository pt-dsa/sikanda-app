const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// I will just use Prettier or Babel to parse and fix? No.
// Let's print lines 360 to 420.
console.log(code.split('\n').slice(355, 420).join('\n'));
