const fs = require('fs');

// Patch AppShell.tsx
let appShell = fs.readFileSync('src/components/layout/AppShell.tsx', 'utf8');
appShell = appShell.replace(
  /import logoUrl from "@\/assets\/logo_kota_tangerang_selatan\.png";\n/,
  ``
);
appShell = appShell.replace(
  /src=\{logoUrl\}/g,
  `src="/logo_kota_tangerang_selatan.png"`
);
fs.writeFileSync('src/components/layout/AppShell.tsx', appShell);

// Patch Login.tsx
let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
login = login.replace(
  /import logoUrl from "@\/assets\/logo_kota_tangerang_selatan\.png";\nimport bgUrl from "@\/assets\/images_landingpage\.png";\n/,
  ``
);
login = login.replace(
  /src=\{logoUrl\}/g,
  `src="/logo_kota_tangerang_selatan.png"`
);
login = login.replace(
  /backgroundImage: \`url\(\\\$\{bgUrl\}\)\`/g,
  `backgroundImage: 'url(/images_landingpage.png)'`
);
fs.writeFileSync('src/pages/Login.tsx', login);

// Patch TanyaSikanda.tsx
let tanya = fs.readFileSync('src/pages/TanyaSikanda.tsx', 'utf8');
tanya = tanya.replace(
  /import logoSimosda from "@\/assets\/logo_simosda\.png";\n/,
  ``
);
tanya = tanya.replace(
  /src=\{logoSimosda\}/g,
  `src="/logo_simosda.png"`
);
fs.writeFileSync('src/pages/TanyaSikanda.tsx', tanya);

