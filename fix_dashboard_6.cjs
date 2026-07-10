const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/          <\/section>\n      \)}\n    <\/motion.div>\n  \);\n}/, '          </section>\n        </>\n      )}\n    </motion.div>\n  );\n}');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
