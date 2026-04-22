======================================================
DOKUMEN KEBUTUHAN PRODUK (PRD)
SISTEM PENDUKUNG KEPUTUSAN (SPK) EVALUASI KINERJA TOKO
METODE: SIMPLE ADDITIVE WEIGHTING (SAW) DINAMIS
TEKNOLOGI YANG DIGUNAKAN (TECH STACK)

Framework: Next.js latest (App Router)

Database: MySQL

ORM: Drizzle ORM

Autentikasi: BetterAuth

Antarmuka (UI): Tailwind CSS + Shadcn UI

DESKRIPSI SISTEM
Sistem ini adalah aplikasi portal internal (backoffice) untuk mengevaluasi dan memberikan peringkat (ranking) pada kinerja berbagai cabang toko setiap bulannya. Sistem menggunakan algoritma Simple Additive Weighting (SAW) yang dinamis. Admin akan memasukkan 5 data metrik operasional secara manual, dan sistem akan mengonversinya menjadi 3 kriteria SPK. Nilai bobot untuk perhitungan SAW tidak dikunci (hardcode), melainkan diambil secara dinamis dari database sehingga dapat diubah sewaktu-waktu sesuai kebijakan manajemen.

PENGGUNA DAN HAK AKSES

Admin: Memiliki hak akses penuh. Dapat melakukan login, mengatur bobot kriteria, mengelola master data toko, menginput data kinerja bulanan, dan melihat dashboard SPK.

ALUR PENGGUNA (USER FLOW)

Langkah 1 (Autentikasi): Pengguna masuk menggunakan email dan kata sandi (diurus oleh BetterAuth).

Langkah 2 (Pengaturan Bobot): Admin mengakses menu "Pengaturan Bobot". Admin dapat memperbarui persentase bobot untuk ke-3 kriteria. Sistem memvalidasi bahwa total keseluruhan bobot harus tepat 100%.

Langkah 3 (Data Master): Admin mengakses menu "Data Toko" untuk mendaftarkan nama-nama cabang toko baru.

Langkah 4 (Input Data Kinerja): Pada akhir bulan, Admin mengakses menu "Input Kinerja". Admin memilih 'Periode Bulan' dan 'Nama Toko', lalu memasukkan 5 data mentah: Target Penjualan, Aktual Penjualan, Total Pesanan, Pesanan Tidak Lengkap, dan Pesanan Tepat Waktu.

Langkah 5 (Hasil Keputusan): Admin mengakses menu "Dashboard SPK". Sistem secara otomatis menarik data kinerja mentah dan data bobot terbaru dari database, menjalankan perhitungan matematika SAW, dan menampilkan tabel peringkat toko dari nilai tertinggi hingga terendah.

LOGIKA PERHITUNGAN ALGORITMA SAW (ENJIN SPK)
Sistem mengubah 5 input mentah menjadi 3 Kriteria SAW. Nilai bobot diambil dari tabel criteria_weights.

Kriteria 1 (C1): Rasio Penjualan

Atribut: Keuntungan (Benefit)

Rumus: Aktual Penjualan / Target Penjualan

Aturan Skala (Normalisasi ke 1-5):
Jika Rasio < 0.85 = Skor 1
Jika Rasio 0.85 - 0.94 = Skor 2
Jika Rasio 0.95 - 0.99 = Skor 3
Jika Rasio 1.00 - 1.14 = Skor 4
Jika Rasio >= 1.15 = Skor 5

Kriteria 2 (C2): Rasio Tepat Waktu (SLA Ontime)

Atribut: Keuntungan (Benefit)

Rumus: Pesanan Tepat Waktu / Total Pesanan

Aturan Skala (Normalisasi ke 1-5):
Jika Rasio < 0.90 = Skor 1
Jika Rasio 0.90 - 0.94 = Skor 2
Jika Rasio 0.95 - 0.97 = Skor 3
Jika Rasio 0.98 - 0.99 = Skor 4
Jika Rasio == 1.00 = Skor 5

Kriteria 3 (C3): Rasio Pesanan Bermasalah (Incomplete Order)

Atribut: Biaya (Cost) - Semakin kecil persentase error, nilai makin tinggi.

Rumus: Pesanan Tidak Lengkap / Total Pesanan

Aturan Skala (Normalisasi ke 1-5):
Jika Rasio < 0.01 = Skor 5
Jika Rasio 0.01 - 0.019 = Skor 4
Jika Rasio 0.02 - 0.029 = Skor 3
Jika Rasio 0.03 - 0.039 = Skor 2
Jika Rasio >= 0.04 = Skor 1

Rumus Penjumlahan Terbobot (Nilai Akhir):
Nilai Akhir = ((Skor C1 _ Bobot C1) + (Skor C2 _ Bobot C2) + (Skor C3 \* Bobot C3)) / 100
(Hasil akhir akan berada pada rentang skala 0.00 hingga 5.00)

PERANCANGAN DATABASE (SKEMA DRIZZLE ORM - MYSQL)
AI Agent wajib membuat file skema Drizzle untuk tabel-tabel berikut:

Tabel Autentikasi (BetterAuth):
Buat tabel user, session, dan account sesuai standar dokumentasi resmi BetterAuth untuk Drizzle MySQL.

Tabel Bobot Kriteria (criteria_weights):

id: serial (primary key)

kode: varchar(10), unique (Contoh: "C1", "C2", "C3")

nama_kriteria: varchar(255)

tipe: enum('benefit', 'cost')

bobot: float (Contoh: 40.0, 30.0, 30.0)

Tabel Toko (stores):

id: serial (primary key)

nama_toko: varchar(255), not null

created_at: timestamp, default now

Tabel Kinerja (performance_records):

id: serial (primary key)

store_id: int (referensi ke tabel stores)

periode: varchar(7), not null (Format: "YYYY-MM")

target_sales: float, not null

actual_sales: float, not null

total_order: int, not null

incomplete_order: int, not null

sla_ontime: int, not null

created_at: timestamp, default now

Unik constraint: Kombinasi (store_id, periode) harus unik untuk mencegah input ganda pada bulan yang sama.

ANTARMUKA PENGGUNA (UI) DAN PENGALAMAN PENGGUNA (UX)

Layout Utama: Sidebar di sebelah kiri dengan menu "Dashboard", "Pengaturan Bobot", "Data Toko", dan "Input Kinerja".

Dashboard SPK: Menampilkan filter "Periode Bulan" di atas, lalu tabel peringkat SPK. Berikan penanda warna (badge) pada baris Nilai Akhir:

Latar Hijau untuk nilai >= 4.0

Latar Kuning untuk nilai 3.0 - 3.9

Latar Merah untuk nilai < 3.0

Validasi Formulir Input Kinerja:

Angka "Pesanan Tidak Lengkap" dan "Pesanan Tepat Waktu" tidak boleh melebihi "Total Pesanan".

Input penjualan menggunakan format angka persepuluhan (float).

Validasi Formulir Pengaturan Bobot: Total angka pada kolom bobot C1 + C2 + C3 harus persis bernilai 100. Tombol simpan dinonaktifkan (disabled) jika total bukan 100.

CATATAN KHUSUS UNTUK AI AGENT (DEVELOPMENT INSTRUCTIONS)

Hasilkan file schema.ts secara lengkap menggunakan sintaks Drizzle ORM MySQL.

Buatkan file Database Seeder untuk mengisi tabel criteria_weights secara default (C1: 40, C2: 30, C3: 30).

Letakkan logika normalisasi dan perhitungan matematika algoritma SAW di dalam file Next.js Server Actions (contoh: actions/spk.ts) agar perhitungan dilakukan di server secara aman.

# Gunakan React Client Components ("use client") pada komponen antarmuka formulir (Input Kinerja dan Pengaturan Bobot) agar bisa menggunakan state untuk validasi real-time dan memberikan toast notification (dari Shadcn) saat data berhasil disimpan tanpa me-refresh halaman.
