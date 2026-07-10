const fs = require('fs');

// Patch AppShell.tsx
let appShell = fs.readFileSync('src/components/layout/AppShell.tsx', 'utf8');
appShell = appShell.replace(
  /import \{ cn \} from "@\/lib\/utils";/,
  `import { cn } from "@/lib/utils";\nimport logoUrl from "@/assets/logo_kota_tangerang_selatan.png";`
);
appShell = appShell.replace(
  /src=\{\`\$\\{import\.meta\.env\.BASE_URL\\}logo_kota_tangerang_selatan\.png\`\}/g,
  `src={logoUrl}`
);
fs.writeFileSync('src/components/layout/AppShell.tsx', appShell);

// Patch Login.tsx
let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace(
  /import \{ motion \} from "motion\/react";/,
  `import { motion } from "motion/react";\nimport logoUrl from "@/assets/logo_kota_tangerang_selatan.png";\nimport bgUrl from "@/assets/images_landingpage.png";`
);
login = login.replace(
  /src=\{\`\$\\{import\.meta\.env\.BASE_URL\\}logo_kota_tangerang_selatan\.png\`\}/g,
  `src={logoUrl}`
);
login = login.replace(
  /backgroundImage: \`url\(\$\\{import\.meta\.env\.BASE_URL\\}images_landingpage\.png\)\`/g,
  `backgroundImage: \`url(\$\{bgUrl\})\``
);
fs.writeFileSync('src/pages/Login.tsx', login);

// Patch TanyaSikanda.tsx
let tanya = fs.readFileSync('src/pages/TanyaSikanda.tsx', 'utf8');
tanya = tanya.replace(
  /import \{ cn \} from "@\/lib\/utils";/,
  `import { cn } from "@/lib/utils";\nimport logoSimosda from "@/assets/logo_simosda.png";`
);
tanya = tanya.replace(
  /src=\{\`\$\\{import\.meta\.env\.BASE_URL\\}logo_simosda\.png\`\}/g,
  `src={logoSimosda}`
);
fs.writeFileSync('src/pages/TanyaSikanda.tsx', tanya);

