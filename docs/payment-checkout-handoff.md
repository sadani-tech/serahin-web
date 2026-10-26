# Handoff Serahin Web: checkout dan payment callback

Tanggal: 23 Oktober 2026

## Boundary frontend

Serahin Web hanya menginisiasi checkout melalui backend Serahin. Frontend tidak
boleh memanggil provider GDC, menyimpan credential provider, menentukan QRIS
merchant ID, atau menerima callback provider secara langsung.

Alur yang benar:

```text
Browser → Serahin API checkout → shared payment-service → GDC
GDC → payment-service callback → Serahin API callback → status order/payment
Browser → halaman return/status → Serahin API melakukan rekonsiliasi
```

## UI checkout

Di portal pesanan, Buyer memilih kanal untuk setiap pembayaran, bukan seluruh
pesanan. Gateway menjadi pilihan awal saat aktif; transfer manual tersedia jika
Seller mempunyai rekening aktif. DP manual tidak mengunci pelunasan: Buyer
dapat memilih QRIS/VA untuk pelunasan berikutnya. Jika QRIS/VA masih aktif,
portal menampilkan instruksinya lebih dulu dan transfer manual baru dapat
dipakai setelah tagihan gagal atau kedaluwarsa. Bukti transfer manual tetap
menunggu verifikasi Admin.
Jika order berhasil dibuat tetapi charge gateway gagal, checkout menuju portal
dengan pesan fallback sehingga Buyer tidak mengulang pembuatan order.


Serahin menampilkan QRIS serta bank VA yang diizinkan oleh payment-service
untuk consumer `serahin`. Saat ini GDC mengonfirmasi Permata (`VA_013`),
BRI (`VA_002`), dan CIMB Niaga (`VA_022`). Pilihan dari cart, form PO, dan
portal pembayaran diteruskan sebagai `paymentMethodCode`; kode bank tidak
ditentukan langsung oleh browser pada request GDC.

UI harus menangani kondisi berikut secara eksplisit:

- loading saat checkout dibuat dan saat status payment direfresh;
- QRIS menampilkan QR payload/instruksi pembayaran yang dikembalikan backend;
- payment pending menampilkan batas waktu dan tombol cek status;
- paid/failed/expired menampilkan status final dari backend;
- error API menampilkan pesan yang dapat ditindaklanjuti dan tidak menganggap
  payment gagal hanya karena request browser timeout.

Jangan menampilkan status `PAID` berdasarkan response lokal sebelum backend
menyatakan status tersebut.

## Mobile dan modal

Checkout harus diuji pada viewport mobile nyata. Modal pembayaran wajib:

- diposisikan relatif terhadap viewport aktif;
- memiliki `max-height` dan scroll internal;
- tidak tertutup bottom navigation atau safe-area inset;
- memiliki backdrop blur/overlay yang cukup agar fokus berada pada modal;
- memiliki tombol close dan status loading yang tetap bisa dijangkau;
- tidak memindahkan CTA ke luar layar setelah QR atau instruksi muncul.

Perubahan layout mobile lain tidak boleh mengubah kontrak payment API.

## Verifikasi manual

1. Login di development.
2. Buat checkout normal dari cart.
3. Pastikan response memuat identifier payment, QR payload atau VA, expiry, dan
   status `PENDING`.
4. Bayar menggunakan instrumen sandbox yang didukung GDC.
5. Kembali ke halaman return atau tekan cek status.
6. Pastikan status berasal dari API, lalu cek order/payment di portal.
7. Ulangi pada mobile viewport dan refresh halaman untuk memastikan state tidak
   hanya tersimpan di React state.

Jika provider sandbox menghasilkan technical error, simpan kode/status provider
dan periksa payment-service. Jangan mengubah status payment dari frontend.

## Konfigurasi

URL API development, payment-service, dan notify secret hanya berada di
environment deployment. Jangan memasukkan nilai `.env` terisi ke commit.

## Catatan lintas produk — 24 Oktober 2026

Import data Manifly ke database production Manifly tidak mengubah deployment,
konfigurasi frontend, atau database Serahin. Tidak ada checkout Serahin yang
dijalankan sebagai bagian dari operasi tersebut. Hasil uji checkout/callback
Serahin yang tercatat di atas tetap hanya berlaku untuk environment yang
disebutkan di catatan tersebut; jangan menganggapnya sebagai smoke test
production Serahin.

