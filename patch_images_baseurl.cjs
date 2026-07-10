const fs = require('fs');

// Patch AppShell.tsx
let appShell = fs.readFileSync('src/components/layout/AppShell.tsx', 'utf8');
appShell = appShell.replace(
  /src="\/logo_kota_tangerang_selatan.png"/g,
  `src={\`\$\{import.meta.env.BASE_URL\}logo_kota_tangerang_selatan.png\`}`
);
fs.writeFileSync('src/components/layout/AppShell.tsx', appShell);

// Patch Login.tsx
let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace(
  /src="\/logo_kota_tangerang_selatan.png"/g,
  `src={\`\$\{import.meta.env.BASE_URL\}logo_kota_tangerang_selatan.png\`}`
);
login = login.replace(
  /backgroundImage: "url\(\\\/images_landingpage\.png\)"/g,
  `backgroundImage: \`url(\$\{import.meta.env.BASE_URL\}images_landingpage.png)\``
);
fs.writeFileSync('src/pages/Login.tsx', login);

// Patch TanyaSikanda.tsx
let tanya = fs.readFileSync('src/pages/TanyaSikanda.tsx', 'utf8');
tanya = tanya.replace(
  /src="\/logo_simosda.png"/g,
  `src={\`\$\{import.meta.env.BASE_URL\}logo_simosda.png\`}`
);
fs.writeFileSync('src/pages/TanyaSikanda.tsx', tanya);

