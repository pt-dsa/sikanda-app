# SIKANDA V1.1.9 Secure — Release Notes

Tanggal rilis: 16 Juli 2026 (Asia/Jakarta).

## Perbaikan update Pengguna Alat & Mesin

- Placeholder legacy seperti `-`, `NULL`, dan nilai kosong tidak lagi dikirim sebagai isi kolom database.
- Tahun, jumlah, harga, kilometer, dan kapasitas mesin dinormalisasi menjadi number sebelum mutasi.
- Payload Alat & Mesin dibangun dari field yang diizinkan, bukan menyebarkan seluruh object hasil baca.
- Backend mengulang validasi angka untuk mencegah manipulasi dari browser.
- Koordinat yang tidak berubah tidak ditulis ulang ke `asset_locations`.
- Update koordinat lama hanya mengubah latitude/longitude, bukan `asset_id` atau `type`, sehingga constraint metadata lokasi legacy tidak menghalangi update Pengguna.
- Error PostgreSQL umum diterjemahkan menjadi pesan aman dan dapat ditindaklanjuti tanpa membuka detail database.

## Sinkronisasi

- Ditambahkan tombol Sinkronisasi pada Kelola Akun, Data Kendaraan, dan Alat & Mesin.
- Sinkronisasi membersihkan cache sesi dan memuat ulang data aktif dari Supabase melalui Apps Script.
- Tombol memiliki status proses dan mencegah klik ganda.
- **Tarik dari Database Pegawai** tetap terpisah karena fungsinya membuat akun baru, bukan sekadar refresh.

## Antarmuka dan mobile-first

- Format jam menjadi `Hari,tanggal bulan tahun | Pukul HH:mm:ss WIB`.
- Distribusi Masa Kerja memakai tinggi card secara lebih proporsional dengan bar yang lebih jelas.
- Topbar menempatkan pencarian pada baris penuh di mobile agar ikon navigasi tidak berdesakan.
- Kelola Akun memakai card pada mobile dan tabel pada desktop.
- Modal Kendaraan, Alat & Mesin, Akun, Pegawai, detail umum, konfirmasi, dan laporan mengikuti viewport dinamis, memiliki scroll internal, footer aman, serta tombol sentuh lebih besar.
- Popup Peta Sebaran dibatasi terhadap lebar viewport mobile.
- Overflow horizontal global dicegah dan safe area perangkat berponi/home indicator didukung.

## Database dan keamanan

- Tambah Kendaraan melakukan `POST` ke `assets_vehicle`.
- Tambah Alat & Mesin melakukan `POST` ke `assets_equipment`.
- Seluruh mutasi melewati Apps Script, Firebase ID token, resolusi role `app_access`, dan pemeriksaan baris `return=representation`.
- Supabase service-role dan Gemini key tetap hanya berada di Apps Script Properties.
- Tidak ada migrasi SQL atau secret frontend baru.
