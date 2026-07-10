const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// The JSX is broken right now. Let's fix the broken parts.
// Around line 360-370
code = code.replace(/<\/p>\n                      <\/>\n                      <\/div>\n                    <\/>/g, '</p>\n                      </div>\n                    </>');

// Wait, the error is:
// 363|                            Seluruh data pegawai sudah lengkap 🎉
// 364|                          </p>
// 365|                        </>
// 366|                        </div>
// 367|                      </>

code = code.replace(/Seluruh data pegawai sudah lengkap 🎉\n                          <\/p>\n                        <\/>\n                        <\/div>\n                      <\/>/g, 'Seluruh data pegawai sudah lengkap 🎉\n                        </p>\n                      </div>\n                    )}');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
