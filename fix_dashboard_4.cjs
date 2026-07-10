const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
let lines = code.split('\n');

// The lines 355 to 420 have broken tags. I will just replace this section with a clean one.
const startIdx = lines.findIndex(l => l.includes('Kriteria yang Paling Sering Belum Terpenuhi'));
const endIdx = lines.findIndex(l => l.includes('{/* Pendidikan */}'));

const replacement = `                      <ClipboardList size={16} className="text-amber-500" />
                      <CardTitle className="text-sm">Kriteria yang Paling Sering Belum Terpenuhi</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {metrics.kelengkapanFieldKosong && metrics.kelengkapanFieldKosong.length > 0 ? (
                      <>
                        <HorizontalBarChart data={metrics.kelengkapanFieldKosong.slice(0, 6)} labelClass="w-36" />
                        <p className="text-[11px] text-gray-400 mt-3">
                          Kriteria: NIP 18 digit, Jabatan, Golongan, TMT Golongan, Tanggal Lahir, Foto, Email, Kontak,
                          serta relasi nama pegawai ↔ aset yang bersih (tanpa temuan fuzzy).
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ShieldCheck size={32} className="text-green-500 mb-2" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Seluruh data pegawai sudah lengkap 🎉
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </section>
          )}

          {/* ── SECTION 3: Komposisi SDM ── */}
          <section>
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800 uppercase tracking-widest">
              Komposisi SDM
            </h2>
            <motion.div variants={itemVars} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Golongan Donut */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2"><Award size={16} className="text-blue-500" /><CardTitle className="text-sm">Distribusi Golongan</CardTitle></div>
                </CardHeader>
                <CardContent className="flex flex-col items-center pb-4">
                  {metrics.distribusiGolongan && metrics.distribusiGolongan.length > 0 ? (
                    <>
                      <div className="w-36 h-36 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={metrics.distribusiGolongan} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">
                              {metrics.distribusiGolongan.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => [\`\${v} orang\`, ""]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.totalPegawai}</span>
                          <span className="text-[10px] text-gray-500">Pegawai</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-3 w-full">
                        {metrics.distribusiGolongan.map((item, i) => (
                          <div key={item.name} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">Gol. {item.name}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 shrink-0">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p className="text-sm text-gray-400 py-8">Data pegawai belum tersedia</p>}
                </CardContent>
              </Card>
              `;

lines.splice(startIdx, endIdx - startIdx, replacement);
fs.writeFileSync('src/pages/Dashboard.tsx', lines.join('\n'));
