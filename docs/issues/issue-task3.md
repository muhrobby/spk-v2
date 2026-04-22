# Issue Task 3 — Seeder Bobot Default C1/C2/C3

## Tujuan
Menyediakan seeder awal untuk tabel `criteria_weights` agar aplikasi langsung punya bobot default SAW (`C1=40`, `C2=30`, `C3=30`) dan aman dijalankan berulang (idempotent), sehingga tidak membuat duplikasi data.

## Acceptance Criteria (Target Akhir)
- Ada seeder untuk mengisi default `criteria_weights` (C1=40, C2=30, C3=30).
- Seeder idempotent (aman dijalankan berulang, tidak duplikasi data).
- Alur eksekusi seed terdokumentasi di script project.

## Dependency
**Task 2** harus sudah selesai (schema + constraint `criteria_weights.kode` unique sudah tersedia).

## File yang Kemungkinan Diubah
- `src/db/seed/*`
- `package.json`
- `README.md` (bagian perintah seed, jika perlu)

---

## Catatan Wajib: Skill dan MCP yang Harus Dipakai

### Skill relevan (wajib diprioritaskan)
1. `drizzle-orm` — pattern insert/upsert yang benar untuk MySQL.
2. `source-driven-development` — implementasi berdasarkan referensi resmi Drizzle.
3. `security-and-hardening` — mencegah data corrupt/duplikasi dengan operasi idempotent.
4. `planning-and-task-breakdown` — menjaga scope tetap Task 3 (seed only).
5. `documentation-and-adrs` — dokumentasi script seed agar bisa dipakai engineer lain.

### MCP relevan (wajib dipakai)
1. **Context7 MCP**:
   - Drizzle ORM MySQL insert + `onDuplicateKeyUpdate` / upsert pattern.
   - Drizzle transaksi/eksekusi seed script yang aman.
2. **IDE diagnostics MCP**:
   - cek error TypeScript setelah file seed ditambahkan.

> Wajib cek pola upsert resmi Drizzle via Context7 sebelum menulis seeder.

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Ambil referensi upsert/idempotent dari dokumentasi resmi
**Tujuan:** seeder tidak pakai query mentah asal-asalan.

1. Query docs Drizzle via Context7 untuk MySQL upsert.
2. Pilih pendekatan idempotent resmi:
   - `insert ... onDuplicateKeyUpdate`, atau
   - pendekatan setara yang tetap deterministic.
3. Pastikan strategi memanfaatkan unique key `criteria_weights.kode`.

**Output tahap ini:**
- Keputusan teknik idempotent yang akan dipakai.
- Template query yang siap dipakai di seeder.

---

### 2. Buat struktur file seed
**Tujuan:** seed punya entry point jelas dan reusable.

1. Buat folder/file, contoh:
   - `src/db/seed/criteria-weights.seed.ts`
   - opsional: `src/db/seed/index.ts` sebagai runner agregat.
2. Import `db` dari `src/db/index.ts` dan schema `criteriaWeights`.
3. Siapkan payload default:
   - `{ kode: "C1", namaKriteria: "Rasio Penjualan", tipe: "benefit", bobot: 40 }`
   - `{ kode: "C2", namaKriteria: "Rasio Tepat Waktu", tipe: "benefit", bobot: 30 }`
   - `{ kode: "C3", namaKriteria: "Rasio Pesanan Bermasalah", tipe: "cost", bobot: 30 }`

---

### 3. Implement logika seeder idempotent
**Tujuan:** jalankan berkali-kali tetap 3 baris, tidak duplikat.

1. Jalankan upsert by `kode` (karena `kode` unique).
2. Saat row sudah ada:
   - update `nama_kriteria`, `tipe`, `bobot` ke nilai default terbaru.
3. Saat row belum ada:
   - insert row baru.
4. Tambahkan logging ringkas:
   - start seed
   - selesai seed
   - jumlah data yang diproses.

**Batasan:**
- Jangan seed tabel lain pada Task 3.
- Jangan menambahkan business logic SPK di tahap ini.

---

### 4. Tambahkan script eksekusi di `package.json`
**Tujuan:** seed bisa dijalankan dengan perintah standar.

1. Tambahkan script, contoh:
   - `db:seed` untuk jalankan seeder default bobot.
2. Jika ada beberapa seed file, buat script aggregator yang tetap sederhana.
3. Pastikan script kompatibel dengan tool yang sudah ada di repo (Node/TS runtime saat ini).

---

### 5. Verifikasi idempotensi secara eksplisit
**Tujuan:** membuktikan seeder benar-benar aman dijalankan berulang.

1. Jalankan seed pertama kali.
2. Cek data `criteria_weights` berisi tepat 3 row (`C1`, `C2`, `C3`).
3. Jalankan seed kedua kali.
4. Pastikan:
   - tetap 3 row (tanpa duplikasi),
   - nilai bobot tetap `40/30/30`,
   - tidak ada error constraint.

---

### 6. Dokumentasi alur eksekusi
**Tujuan:** junior dev bisa menjalankan tanpa tebak-tebakan.

1. Dokumentasikan langkah singkat di `README.md` (atau docs yang sudah dipakai tim):
   - syarat env DB,
   - perintah `npm run db:seed`,
   - ekspektasi hasil.
2. Tambahkan troubleshooting singkat:
   - error koneksi DB,
   - error migrasi belum dijalankan.

---

## Checkpoint A (Foundation)
- Schema + seed siap dipakai end-to-end di environment lokal.
- Struktur backend tidak mengganggu arsitektur App Router yang sudah ada.

---

## Definition of Done (DoD)
Task 3 dianggap selesai jika:
- Seeder `criteria_weights` tersedia dan bisa dijalankan via script project.
- Jalankan seed berkali-kali tetap menghasilkan 3 data unik (`C1/C2/C3`) tanpa duplikasi.
- Nilai default bobot konsisten (`40/30/30`).
- Dokumentasi eksekusi seed tersedia dan jelas.

---

## Risiko Umum + Antisipasi
- **Risiko:** seeder hanya insert biasa, run kedua gagal karena duplicate key.  
  **Antisipasi:** wajib pakai upsert pattern resmi Drizzle berdasarkan unique `kode`.

- **Risiko:** nama kriteria/tipe tidak sinkron dengan PRD.  
  **Antisipasi:** lock nilai default langsung dari PRD di konstanta seeder.

- **Risiko:** script seed sulit dijalankan karena runtime TS tidak jelas.  
  **Antisipasi:** pakai pola script yang sudah terbukti jalan di repo, lalu dokumentasikan.

- **Risiko:** scope melebar ke seeding data lain.  
  **Antisipasi:** batasi hanya `criteria_weights` pada Task 3.

---

## Checklist Eksekusi Cepat (untuk junior/AI murah)
- [ ] Sudah cek referensi Drizzle upsert di Context7 MCP.
- [ ] File seed untuk `criteria_weights` sudah dibuat.
- [ ] Data default `C1/C2/C3` sudah sesuai PRD.
- [ ] Seeder idempotent (tidak duplikasi saat run berulang).
- [ ] Script `db:seed` tersedia di `package.json`.
- [ ] Dokumentasi eksekusi seed sudah ditulis.
- [ ] Check/build project tetap aman setelah penambahan seeder.

