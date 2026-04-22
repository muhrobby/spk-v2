# Fitur dan Struktur Project

## Ringkasan

Project ini adalah aplikasi internal **Sistem Pendukung Keputusan (SPK)** untuk evaluasi kinerja toko dengan metode **Simple Additive Weighting (SAW)**. Basis project berasal dari admin dashboard template Next.js, tetapi flow utama yang aktif sekarang sudah difokuskan ke use case SPK:

1. login admin
2. atur bobot kriteria
3. kelola master data toko
4. input data kinerja bulanan
5. lihat ranking hasil perhitungan SPK

Selain fitur inti SPK, project ini tetap menyimpan beberapa komponen shell/personalization dari basis template dashboard (misalnya preference layout/theme), tetapi route bisnis non-SPK sudah dibersihkan.

## Struktur Project

Struktur utama yang perlu dipahami:

| Folder/File | Fungsi |
| --- | --- |
| `src/app/` | Entry point App Router Next.js. Route utama ada di sini. |
| `src/app/(main)/dashboard/` | Semua halaman dashboard setelah login. Ini adalah area kerja utama aplikasi. |
| `src/app/(main)/auth/` | Halaman autentikasi aktif (`/auth/login`) dan layout auth. |
| `src/actions/` | Server Actions untuk fitur domain: bobot, toko, input kinerja, dan engine SPK. |
| `src/db/` | Koneksi database, schema Drizzle, dan script seeding. |
| `src/lib/auth/` | Konfigurasi Better Auth, session helper, dan auth client. |
| `src/lib/preferences/` | Sistem preferensi UI: theme, layout, sidebar, font, navbar. |
| `src/navigation/sidebar/sidebar-items.ts` | Sumber tunggal menu sidebar aktif. |
| `src/server/` | Helper server-side tambahan, termasuk pembacaan preference dari cookie. |
| `src/stores/` | Store client-side berbasis Zustand untuk sinkronisasi preference UI. |
| `src/proxy.ts` | Proteksi route dashboard berdasarkan session cookie. |
| `docs/prd.md` | Dokumen kebutuhan bisnis SPK. |
| `docs/plan.md` | Rencana implementasi dari template ke aplikasi SPK. |

## Arsitektur Route

### Route aktif untuk bisnis SPK

| Route | Fungsi |
| --- | --- |
| `/auth/login` | Form login admin. |
| `/dashboard` | Dashboard SPK utama untuk melihat ranking per periode. |
| `/dashboard/pengaturan-bobot` | Halaman pengaturan bobot C1, C2, C3. |
| `/dashboard/data-toko` | Halaman master data toko. |
| `/dashboard/input-kinerja` | Form input data kinerja bulanan toko. |

### Route pendukung/template

Route template non-SPK sudah dihapus agar aplikasi fokus ke flow bisnis SPK.

## 1. Autentikasi Admin

Fitur autentikasi dibangun dengan **Better Auth** dan Drizzle adapter.

Detail perilaku:

- Login email/password aktif melalui `authClient.signIn.email()`.
- API auth dilayani oleh route `src/app/api/auth/[...all]/route.ts`.
- Session dibaca di server melalui `getAuthSession()` dan `requireAuthSession()`.
- Layout auth otomatis me-redirect user yang sudah login agar tidak kembali ke halaman login/register.
- Dashboard dilindungi di dua lapis:
  - `src/proxy.ts` mengecek cookie session dan mencegat akses ke `/dashboard/*`
  - `src/app/(main)/dashboard/layout.tsx` mengecek session lagi di server
- Ada script `npm run db:seed:admin` untuk menyiapkan akun admin default.

Catatan penting:

- Tidak ada flow self-registration di route auth aktif.

## 2. Dashboard SPK dan Ranking SAW

Halaman `/dashboard` adalah pusat hasil keputusan.

Kemampuan utama:

- User bisa memilih periode bulanan dengan input `YYYY-MM`.
- Sistem mengambil daftar periode yang sudah pernah diinput dari tabel `performance_records`.
- Sistem menghitung ranking server-side melalui `getSpkRanking()` di `src/actions/spk.ts`.
- Hasil ranking ditampilkan dalam tabel dengan kolom:
  - peringkat
  - nama toko
  - skor C1
  - skor C2
  - skor C3
  - nilai akhir
- Nilai akhir diberi badge warna:
  - hijau untuk `>= 4.00`
  - kuning untuk `>= 3.00` dan `< 4.00`
  - merah untuk `< 3.00`
- Jika belum ada data pada periode tertentu, halaman menampilkan state kosong yang informatif.
- Jika bobot belum lengkap atau user tidak login, halaman menampilkan pesan error yang jelas.

### Detail engine SAW

Mesin perhitungan ada di `src/actions/spk.ts`.

Project ini tidak memakai normalisasi klasik antar alternatif, tetapi memakai **rule-based scoring** langsung ke skala 1-5, lalu dikalikan dengan bobot dinamis dari database.

#### C1: Rasio Penjualan

- Rumus: `actualSales / targetSales`
- Mapping skor:

| Rasio | Skor |
| --- | --- |
| `< 0.85` | 1 |
| `0.85 - 0.94` | 2 |
| `0.95 - 0.99` | 3 |
| `1.00 - 1.14` | 4 |
| `>= 1.15` | 5 |

#### C2: Rasio SLA On-time

- Rumus: `slaOntime / totalOrder`
- Mapping skor:

| Rasio | Skor |
| --- | --- |
| `< 0.90` | 1 |
| `0.90 - 0.94` | 2 |
| `0.95 - 0.97` | 3 |
| `0.98 - 0.99` | 4 |
| `>= 1.00` | 5 |

#### C3: Rasio Pesanan Bermasalah

- Rumus: `incompleteOrder / totalOrder`
- Jenis atribut: cost
- Mapping skor:

| Rasio | Skor |
| --- | --- |
| `< 0.01` | 5 |
| `0.01 - 0.019` | 4 |
| `0.02 - 0.029` | 3 |
| `0.03 - 0.039` | 2 |
| `>= 0.04` | 1 |

#### Rumus nilai akhir

`nilaiAkhir = (skorC1 * bobotC1 + skorC2 * bobotC2 + skorC3 * bobotC3) / 100`

Tambahan perilaku engine:

- Bila pembagi `0`, sistem memakai `safeRatio()` dan mengembalikan `0` agar tidak crash.
- Ranking diurutkan dari nilai tertinggi ke terendah.
- Jika nilai sama, tie-break memakai nama toko secara alfabetis lokal `id-ID`.

## 3. Pengaturan Bobot Kriteria

Halaman `/dashboard/pengaturan-bobot` dipakai untuk mengubah bobot C1, C2, dan C3 yang dipakai engine SAW.

Perilaku fitur:

- Data bobot diambil langsung dari tabel `criteria_weights`.
- Hanya kode `C1`, `C2`, dan `C3` yang diizinkan.
- Masing-masing item menampilkan:
  - kode kriteria
  - nama kriteria
  - tipe `benefit` atau `cost`
  - input bobot persen
- Form memantau total bobot secara realtime.
- Tombol simpan otomatis disabled bila:
  - total bobot tidak tepat `100`
  - ada input tidak valid
  - proses submit sedang berjalan
- Saat submit, data dikirim ke `updateWeightsAction()`.
- Action memverifikasi session login dan memvalidasi payload lagi di server.
- Server juga memastikan seluruh kode unik dan total bobot tetap `100`.
- Setelah berhasil, page direfresh dan toast sukses ditampilkan.

Ini membuat perubahan bobot benar-benar dinamis dan langsung memengaruhi hasil ranking berikutnya.

## 4. Master Data Toko

Halaman `/dashboard/data-toko` dipakai untuk mengelola daftar toko yang akan dinilai.

Perilaku fitur:

- Menampilkan tabel toko yang sudah terdaftar.
- Mengurutkan data berdasarkan `createdAt` terbaru.
- Menyediakan form tambah toko dengan validasi nama:
  - minimal 2 karakter
  - maksimal 255 karakter
- Server action `createStoreAction()` memeriksa:
  - user harus login
  - nama valid
  - nama toko belum pernah dipakai
- Jika berhasil, data baru disimpan dan daftar otomatis tampil setelah `router.refresh()`.
- Jika gagal, user mendapat toast error yang sesuai.

Fitur ini adalah fondasi untuk input kinerja, karena halaman input tidak bisa dipakai sebelum ada data toko.

## 5. Input Kinerja Bulanan

Halaman `/dashboard/input-kinerja` dipakai admin untuk memasukkan data operasional mentah per toko dan per bulan.

Input yang tersedia:

- toko
- periode `YYYY-MM`
- target penjualan
- penjualan aktual
- total order
- incomplete order
- SLA on-time

Perilaku fitur:

- Jika belum ada data toko, halaman tidak menampilkan form dan meminta user menambah toko lebih dulu.
- Toko dipilih dari dropdown yang diambil dari database.
- Periode default diisi bulan berjalan.
- Field numerik dibedakan dengan benar:
  - penjualan menggunakan angka desimal
  - order menggunakan integer
- Validasi client-side berjalan realtime:
  - `incompleteOrder <= totalOrder`
  - `slaOntime <= totalOrder`
- Jika rule domain dilanggar, border field berubah merah dan deskripsi error muncul langsung.
- Tombol simpan hanya aktif jika form valid.
- Setelah submit, action `createPerformanceRecord()` melakukan validasi ulang di server.
- Server memastikan:
  - session login tersedia
  - toko yang dipilih benar-benar ada
  - kombinasi `store + periode` belum pernah dipakai
- Jika data duplikat, user mendapat pesan error yang menyebut toko dan periode terkait.
- Jika sukses, form di-reset ke nilai default dan halaman direfresh.

Halaman ini juga menyediakan kartu informasi kecil tentang:

- format periode
- validasi utama
- constraint unik store + periode

## 6. Database dan Model Domain

Struktur data inti ada di `src/db/schema.ts`.

### Tabel autentikasi

- `user`
- `session`
- `account`

Tiga tabel ini mengikuti struktur Better Auth untuk login email/password.

### Tabel domain SPK

#### `criteria_weights`

Menyimpan bobot dinamis untuk kriteria SPK.

Kolom penting:

- `kode`
- `nama_kriteria`
- `tipe` (`benefit` atau `cost`)
- `bobot`

#### `stores`

Menyimpan master data toko.

Kolom penting:

- `id`
- `nama_toko`
- `created_at`

#### `performance_records`

Menyimpan data kinerja mentah per toko per periode.

Kolom penting:

- `store_id`
- `periode`
- `target_sales`
- `actual_sales`
- `total_order`
- `incomplete_order`
- `sla_ontime`

Constraint penting:

- kombinasi `store_id + periode` harus unik

### Seeder yang tersedia

- `npm run db:seed` mengisi bobot default:
  - C1 = 40
  - C2 = 30
  - C3 = 30
- `npm run db:seed:admin` membuat user admin default:
  - email: `admin@example.com`
  - password: `password`

Seeder bobot bersifat idempotent karena memakai `onDuplicateKeyUpdate()`.

## 7. Sistem Preference UI

Di luar fitur bisnis SPK, project ini punya sistem kustomisasi dashboard yang cukup lengkap.

Fitur preference yang aktif:

- theme mode: `light`, `dark`, `system`
- theme preset: `default`, `brutalist`, `soft-pop`, `tangerine`
- font selection
- page layout: `centered` atau `full-width`
- navbar behavior: `sticky` atau `scroll`
- sidebar style: `inset`, `sidebar`, `floating`
- sidebar collapse mode: `icon` atau `offcanvas`
- tombol restore default

Karakteristik teknis:

- Preference disimpan dengan cookie client-side.
- `ThemeBootScript` di `<head>` membaca preference sebelum hydration agar tidak terjadi flicker tema/layout.
- Preference tertentu seperti `sidebar_variant` dan `sidebar_collapsible` diperlakukan sebagai SSR-critical karena memengaruhi bentuk layout server-rendered.
- State preference di client disinkronkan melalui Zustand store.

Ini berarti dashboard bukan hanya functional, tetapi juga bisa dipersonalisasi oleh user.

## 8. Sidebar, Shell, dan Navigasi Dashboard

Dashboard shell dibangun di `src/app/(main)/dashboard/layout.tsx`.

Fitur shell yang aktif:

- sidebar berbasis konfigurasi tunggal di `src/navigation/sidebar/sidebar-items.ts`
- session guard sebelum render isi dashboard
- pembacaan preferensi sidebar dari cookie untuk SSR
- header dengan sidebar trigger, layout controls, theme switcher, link GitHub, dan account switcher

Menu sidebar yang benar-benar aktif sekarang hanya:

- Dashboard
- Pengaturan Bobot
- Data Toko
- Input Kinerja

Ini menandakan aplikasi sudah disederhanakan dari template multi-dashboard menjadi flow bisnis SPK.

## 9. Fitur Stub yang Masih Tersisa

Ada beberapa elemen UI yang masih bersifat placeholder dan belum menjadi bagian inti proses bisnis SPK.

### Account switcher

- Menggunakan data statis dari `src/data/users.ts`.
- Bisa mengganti user aktif di dropdown secara lokal di client.
- Belum terhubung ke session Better Auth.
- Tombol `Log out` masih elemen UI, belum ada aksi logout nyata.

### Nav user footer

- Menu `Account`, `Billing`, `Notifications`, dan `Log out` di footer sidebar masih berupa UI placeholder.
- Belum ada integrasi profile settings/billing/notification center maupun aksi logout nyata di menu tersebut.

## 10. Alur Bisnis End-to-End

Jika dilihat sebagai satu sistem, alur pemakaian aplikasi sekarang adalah:

1. Super admin menyiapkan akun admin atau menjalankan seeder admin.
2. Admin login melalui halaman auth.
3. Admin memastikan bobot C1/C2/C3 sesuai kebijakan bisnis.
4. Admin menambahkan toko yang akan dievaluasi.
5. Admin menginput data kinerja bulanan tiap toko.
6. Admin membuka dashboard SPK untuk melihat ranking hasil perhitungan SAW pada periode tertentu.

Ini menunjukkan bahwa fitur utama project sudah membentuk satu workflow operasional yang utuh, bukan sekadar kumpulan halaman terpisah.

## Kesimpulan

Secara fungsional, project ini sudah merupakan **portal internal SPK evaluasi kinerja toko** dengan fitur utama berikut:

- autentikasi admin berbasis Better Auth
- pengaturan bobot kriteria dinamis
- manajemen master data toko
- input data kinerja bulanan
- perhitungan dan ranking SAW di server
- dashboard hasil keputusan per periode
- personalisasi UI dashboard

Secara teknis, sebagian elemen shell dari basis template masih dipakai (terutama preference UI dan beberapa dropdown placeholder), tetapi route bisnis non-SPK sudah dibersihkan. Kondisi saat ini bisa dipahami sebagai:

- **core business app**: sudah aktif dan usable untuk SPK
- **template leftovers**: masih ada untuk UI/demo, tetapi bukan bagian inti proses bisnis
