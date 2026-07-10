const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppShell.tsx', 'utf8');

code = code.replace(
  /catch \(e: any\) \{\s*console\.error\("\[SIKANDA\] whoami error on auth sync:", e\);\s*if \(e\?\.message\?\.includes\("Backend Apps Script belum dikonfigurasi"\)\) \{\s*\/\/ Biarkan sesi ada agar user bisa melihat pesan error spesifik di halaman\s*return;\s*\}\s*await firebaseSignOut\(\);\s*localStorage\.removeItem\(SESSION_KEY\);\s*setUser\(null\);\s*\}/,
  `catch (e: any) {
          console.error("[SIKANDA] whoami error on auth sync:", e);
          // JANGAN sign out pengguna jika backend gagal (karena masalah jaringan, timeout, atau limit API).
          // Jika token benar-benar kedaluwarsa, Firebase SDK akan mengetahuinya dan memanggil onFirebaseAuth(false).
        }`
);

fs.writeFileSync('src/components/layout/AppShell.tsx', code);
