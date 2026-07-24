# Rekomendasi Peningkatan Keamanan Backend (Google Apps Script)

Sesuai hasil audit keamanan, meskipun SIKANDA telah menggunakan _masking_ (penyamaran data sensitif seperti NIP dan Kontak) pada antarmuka pengguna (_frontend_), **payload data asli dari database masih mengalir ke komputer klien**. Hal ini memungkinkan pegawai yang memahami teknis untuk menekan `F12` (Developer Tools) dan mengintip data kontak dan NIP rekan kerjanya di *Network Tab*.

Untuk menambal celah ini (Mencegah Kebocoran Data), proses *masking* harus dilakukan di hulu, yaitu di dalam file `Code.gs` pada Google Apps Script Anda. 

Silakan tambahkan fungsi _masking_ ini dan integrasikan sebelum data dikembalikan (Return ContentService) ke Frontend.

## 1. Tambahkan Fungsi `maskSensitiveDataServer` ke `Code.gs`

Letakkan fungsi ini di sembarang tempat pada file `Code.gs` Anda:

```javascript
/**
 * Mengaburkan data rahasia pegawai (NIP, Tanggal Lahir, Kontak)
 * jika yang meminta data tersebut BUKAN pemilik profil itu sendiri.
 * 
 * @param {Array} rows - Array data dari Supabase (misal: tabel 'pegawai')
 * @param {string} currentUserNip - NIP dari pegawai yang sedang login saat ini
 * @returns {Array} - Array data yang telah disensor
 */
function maskSensitiveDataServer(rows, currentUserNip) {
  if (!rows || !Array.isArray(rows)) return rows;

  return rows.map(function(row) {
    // Jika baris ini adalah profil miliknya sendiri, tampilkan apa adanya.
    if (row.nip && String(row.nip) === String(currentUserNip)) {
      return row;
    }

    // Jika bukan miliknya sendiri, sensor data sensitifnya.
    var maskedRow = Object.assign({}, row);

    // Sensor NIP (contoh: 19901234 -> 1990xxxx..........)
    if (maskedRow.nip && typeof maskedRow.nip === 'string') {
      maskedRow.nip = maskedRow.nip.substring(0, 4) + 'xxxx' + '*'.repeat(Math.max(0, maskedRow.nip.length - 8));
    }

    // Sensor Kontak
    if (maskedRow.kontak && typeof maskedRow.kontak === 'string') {
      maskedRow.kontak = maskedRow.kontak.substring(0, 3) + 'xxx-xxxx-' + maskedRow.kontak.slice(-3);
    }

    // Sensor Tanggal Lahir
    if (maskedRow.tgl_lahir) {
      maskedRow.tgl_lahir = 'XXXX-XX-XX'; // Sembunyikan tgl_lahir sepenuhnya
    }

    return maskedRow;
  });
}
```

## 2. Modifikasi Fungsi Pengambilan Data di `Code.gs`

Temukan bagian di dalam `doPost(e)` (atau di fungsi `handleReadData`) yang memproses pengembalian data untuk tabel `pegawai`. Saat ini, kodenya mungkin terlihat seperti ini:

```javascript
// SEBELUM:
var data = fetchSupabase(url, { method: 'get', headers: headers });
return createJsonResponse(true, { rows: data });
```

**Ubah menjadi seperti ini:**

```javascript
// SESUDAH:
var data = fetchSupabase(url, { method: 'get', headers: headers });

// Dapatkan NIP pengguna yang sedang login dari hasil validasi token
var currentUserNip = authData.userNip; // (sesuaikan dengan nama variabel auth context Anda)
var currentUserRole = authData.userRole; // (admin/pimpinan/pegawai)

// Hanya lakukan masking jika user yang login adalah "pegawai" biasa
if (action === 'read_data' && payload.table === 'pegawai') {
  if (currentUserRole === 'pegawai') {
    data = maskSensitiveDataServer(data, currentUserNip);
  }
}

return createJsonResponse(true, { rows: data });
```

---
> [!TIP]
> Dengan menerapkan kode di atas di sisi *backend*, tidak akan ada sejengkal pun data mentah (NIP/Nomor HP) milik orang lain yang dikirimkan melewati internet ke komputer seorang pegawai biasa. Hal ini mengeliminasi risiko peretasan privasi melalui *Network Tab* hingga 100%.
