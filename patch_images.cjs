const fs = require('fs');

// Patch AppShell.tsx
let appShell = fs.readFileSync('src/components/layout/AppShell.tsx', 'utf8');
appShell = appShell.replace(
  /import \{ cn \} from "@\/lib\/utils";/,
  `import { cn } from "@/lib/utils";\nimport logoUrl from "@/assets/logo_kota_tangerang_selatan.png";`
);
appShell = appShell.replace(
  /<img src=\{\`\$\{import\.meta\.env\.BASE_URL\}logo_kota_tangerang_selatan\.png\`\} alt="SIKANDA Logo"/g,
  `<img src={logoUrl} alt="SIKANDA Logo"`
);
fs.writeFileSync('src/components/layout/AppShell.tsx', appShell);

// Patch Login.tsx
let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace(
  /import React, \{ useState \} from "react";/,
  `import React, { useState } from "react";\nimport logoUrl from "@/assets/logo_kota_tangerang_selatan.png";\nimport bgUrl from "@/assets/images_landingpage.png";`
);
login = login.replace(
  /style=\{\{ backgroundImage: \`url\(\$\{import\.meta\.env\.BASE_URL\}images_landingpage\.png\)\` \}\}/g,
  `style={{ backgroundImage: \`url(\${bgUrl})\` }}`
);
login = login.replace(
  /<img src=\{\`\$\{import\.meta\.env\.BASE_URL\}logo_kota_tangerang_selatan\.png\`\} alt="SIKANDA Logo"/g,
  `<img src={logoUrl} alt="SIKANDA Logo"`
);
fs.writeFileSync('src/pages/Login.tsx', login);

// Patch TanyaSikanda.tsx
let tanya = fs.readFileSync('src/pages/TanyaSikanda.tsx', 'utf8');
tanya = tanya.replace(
  /import \{ cn \} from "@\/lib\/utils";/,
  `import { cn } from "@/lib/utils";\nimport logoSimosda from "@/assets/logo_simosda.png";`
);
tanya = tanya.replace(
  /<img src=\{\`\$\{import\.meta\.env\.BASE_URL\}logo_simosda\.png\`\} alt="SIKANDA"/g,
  `<img src={logoSimosda} alt="SIKANDA"`
);
fs.writeFileSync('src/pages/TanyaSikanda.tsx', tanya);

