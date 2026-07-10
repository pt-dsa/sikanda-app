const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// just split lines and add </>.
let lines = code.split('\n');
let len = lines.length;
// from end
for(let i=len-1; i>=0; i--) {
  if(lines[i].includes('      )}')) {
    lines.splice(i, 0, '        </>');
    break;
  }
}

fs.writeFileSync('src/pages/Dashboard.tsx', lines.join('\n'));
