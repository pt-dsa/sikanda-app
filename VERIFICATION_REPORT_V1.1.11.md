# LAPORAN VERIFIKASI SIKANDA V1.1.11 SECURE

Tanggal verifikasi: 16 Juli 2026  
Target: source dan build V1.1.11 Secure

## Kesimpulan

Source V1.1.11 lulus pemeriksaan statis, 13 rangkaian regresi, build produksi, pemeriksaan sintaks Apps Script, audit dependency production, dan pemindaian secret source. Status paket: **production candidate**. Verifikasi konfigurasi dan transaksi live tetap wajib.

## Hasil pemeriksaan

| Pemeriksaan | Hasil |
|---|---|
| `tsc --noEmit` | Lulus |
| 13 suite pengujian | Lulus |
| Vite production build | Lulus, 2.948 modul |
| Apps Script `node --check` | Lulus |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerability |
| Scan pola secret | Tidak menemukan kredensial; hanya grant literal `service_role` pada SQL historis |
| Scan fallback kondisi → BAIK | Tidak ditemukan pada source runtime |

## Regresi V1.1.11

- empat card kondisi resmi selalu dibentuk dalam urutan tetap, termasuk ketika jumlahnya nol;
- Kendaraan dan Alat & Mesin masing-masing menampilkan lima card utama termasuk card Total;
- card memakai tema biru, hijau, kuning, oranye, dan merah sesuai maknanya;
- kondisi kosong dihitung dan ditampilkan terpisah sebagai banner kualitas data;
- klik card/banner menggunakan kunci filter yang sama dengan tabel;
- judul card pada ASN/PPPK, Buku Penjagaan, Dashboard, Data Cleansing, dan ringkasan aset lebih besar serta tebal;
- kondisi kosong/placeholder dinormalkan ke kosong, bukan BAIK;
- label UI kosong adalah BELUM DIISI;
- filter Kendaraan dan Alat & Mesin menangani BELUM DIISI;
- scanner Data Cleansing menemukan record kosong dan membentuk deep-link benar;
- create mewajibkan kondisi;
- update legacy menghilangkan kondisi dari payload bila belum diverifikasi;
- peta, laporan, dan detail memakai label kondisi bersama;
- KURANG BAIK tidak mendapat badge sukses;
- backend memvalidasi empat kondisi resmi;
- endpoint versi adalah `1.1.11-secure`.

## Kontrol keamanan yang dipertahankan

- Firebase token verification dan role resolution `app_access`;
- server-side RBAC dan field allowlist;
- service-role key tidak berada pada frontend;
- mutasi Supabase dengan `return=representation` dan pemeriksaan baris;
- validasi koordinat/angka/pegawai/kondisi di backend;
- audit log, error sanitization, private storage, signed photo URL;
- RLS aktif dan grant runtime hanya service-role berdasarkan bukti capture pengguna.

## Analisis capture deployment dan Supabase

- GitHub Actions `build-and-deploy` selesai sukses; ini membuktikan pipeline dan artefak Pages V1.1.10 sebelumnya sehat, bukan otomatis membuktikan UAT V1.1.11.
- Endpoint Apps Script pada capture merespons `ok: true` dan versi `1.1.10-secure`; setelah upgrade V1.1.11 harus berubah menjadi `1.1.11-secure`.
- `rowsecurity = true` terlihat untuk `app_access`, `asset_locations`, `assets_equipment`, `assets_vehicle`, dan `pegawai`.
- Query grant menghasilkan 35 baris, seluruhnya untuk `service_role`; tidak ada baris `anon` atau `authenticated` pada lima tabel tersebut.
- Hak `service_role` sangat luas (`DELETE`, `INSERT`, `REFERENCES`, `SELECT`, `TRIGGER`, `TRUNCATE`, `UPDATE`) dan melewati RLS. Keamanan bergantung pada key yang tetap server-side serta Apps Script yang memverifikasi token, role, action, dan field.
- Popup paket Google AI Studio merupakan dialog platform; bukan error SIKANDA. Tutup/lanjutkan dialog sebelum menguji preview.

## Batas verifikasi

Pemeriksaan ini tidak mengakses deployment Supabase, Firebase, Apps Script, atau GitHub pengguna secara langsung. Bukti live berasal dari capture pengguna. Karena itu, status production-ready memerlukan pelaksanaan UAT dan checklist pada `00_PANDUAN_IMPLEMENTASI_SIKANDA_V1.1.11_SECURE.md`.
