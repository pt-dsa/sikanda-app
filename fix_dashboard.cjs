const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/<\/>\s*<\/div>\s*<\/>/g, '</div>\n                    )}');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
