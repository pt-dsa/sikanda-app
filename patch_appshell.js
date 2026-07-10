const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppShell.tsx', 'utf8');
code = code.replace(
  /catch \{(\s*)await firebaseSignOut\(\);\s*localStorage.removeItem\(SESSION_KEY\);\s*setUser\(null\);\s*\}/,
  `catch (e: any) {
          console.error("[SIKANDA] whoami error on auth sync:", e);
          if (e?.message?.includes("Backend Apps Script belum dikonfigurasi")) {
            // Biarkan sesi ada agar user bisa melihat pesan error spesifik di halaman
            return;
          }
          await firebaseSignOut();
          localStorage.removeItem(SESSION_KEY);
          setUser(null);
        }`
);
fs.writeFileSync('src/components/layout/AppShell.tsx', code);
