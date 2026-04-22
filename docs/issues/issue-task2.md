# Issue Task 2 — Implement Schema Drizzle MySQL + Relasi + Constraint

## Tujuan
Membuat fondasi skema database yang siap dipakai oleh fitur auth dan domain SPK, dengan struktur tabel, relasi, dan constraint yang konsisten dengan PRD serta dokumentasi resmi Drizzle + BetterAuth.

## Acceptance Criteria (Target Akhir)
- `schema.ts` mencakup tabel BetterAuth (`user`, `session`, `account`) dan tabel domain (`criteria_weights`, `stores`, `performance_records`).
- Constraint unik `(store_id, periode)` pada `performance_records` diterapkan.
- Tipe enum `benefit/cost` dan tipe numerik sesuai kebutuhan PRD diterapkan.

## Dependency
**Task 1** harus sudah selesai (dependensi dan fondasi folder/env sudah siap).

## File yang Kemungkinan Diubah
- `src/db/schema.ts`
- `drizzle.config.ts` / `drizzle.config.mts` (jika belum ada)
- `src/db/index.ts` (jika perlu ekspor schema)
- File migrasi hasil generate Drizzle (`drizzle/*` atau folder migrasi yang dipakai)
- `package.json` (hanya bila perlu tambah script migrasi/generate)

---

## Catatan Wajib: Skill dan MCP yang Harus Dipakai

### Skill relevan (wajib diprioritaskan)
1. `drizzle-orm` — sintaks schema MySQL, relasi, index/constraint.
2. `better-auth-best-practices` — struktur tabel auth yang kompatibel BetterAuth.
3. `source-driven-development` — pastikan implementasi berdasarkan dokumentasi resmi, bukan asumsi.
4. `security-and-hardening` — constraint dan tipe data aman, mengurangi data corruption.
5. `planning-and-task-breakdown` — jaga implementasi bertahap dan tidak melebar.

### MCP relevan (wajib dipakai)
1. **Context7 MCP** untuk tarik dokumentasi resmi:
   - Drizzle ORM (MySQL schema, enum, relation, unique constraint, migration flow).
   - BetterAuth (Drizzle MySQL table schema resmi untuk `user/session/account`).
2. **IDE diagnostics MCP** untuk cek error TypeScript setelah schema ditulis.

> Jangan lanjut implementasi schema sebelum referensi docs resmi dari MCP Context7 didapat.

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Kunci referensi resmi dulu (anti-halusinasi)
**Tujuan:** semua nama kolom auth mengikuti standar BetterAuth, bukan tebakan.

1. Query docs Drizzle MySQL via Context7.
2. Query docs BetterAuth + Drizzle adapter via Context7.
3. Simpan ringkasan field wajib `user/session/account` untuk dijadikan acuan coding.

**Output tahap ini:**
- Daftar field BetterAuth yang valid.
- Keputusan tipe numeric Drizzle untuk kolom float PRD (disarankan `double`/`real`, konsisten satu pilihan).

---

### 2. Desain struktur schema sebelum coding
**Tujuan:** mapping tabel dan relasi jelas sebelum menulis kode.

1. Definisikan tabel domain dari PRD:
   - `criteria_weights`: `id`, `kode (unique)`, `nama_kriteria`, `tipe(enum benefit/cost)`, `bobot`.
   - `stores`: `id`, `nama_toko`, `created_at`.
   - `performance_records`: `id`, `store_id`, `periode`, metrik sales/order, `created_at`.
2. Tentukan relasi:
   - `stores (1) -> (N) performance_records`
3. Tentukan constraint:
   - unique composite `(store_id, periode)` pada `performance_records`.
   - unique `kode` pada `criteria_weights`.

**Batasan:**
- Task 2 hanya schema + relasi + constraint, belum seeding dan belum server actions.

---

### 3. Implement `src/db/schema.ts`
**Tujuan:** semua tabel didefinisikan di satu sumber kebenaran schema.

1. Buat enum MySQL untuk tipe kriteria:
   - nilai: `benefit`, `cost`.
2. Tambahkan tabel BetterAuth:
   - `user`, `session`, `account` (mengacu dokumentasi resmi BetterAuth + Drizzle MySQL).
3. Tambahkan tabel domain SPK:
   - `criteria_weights`, `stores`, `performance_records`.
4. Terapkan tipe data numerik:
   - Sales dan bobot gunakan tipe float-compatible (`double`/`real`) sesuai keputusan tahap 1.
   - Count order gunakan integer.
5. Terapkan `notNull`, default timestamp, dan constraint unique yang diminta PRD.

**Kriteria kualitas:**
- Nama kolom jelas, konsisten, dan sesuai PRD.
- Tidak ada kolom penting yang “ditunda” tanpa alasan.

---

### 4. Definisikan relasi Drizzle
**Tujuan:** query domain di task selanjutnya jadi aman dan mudah.

1. Definisikan relations:
   - `storesRelations` ke `performance_records`.
   - `performanceRecordsRelations` ke `stores`.
2. Ekspor schema/relations yang akan dipakai query layer.

**Catatan:**
- Relasi BetterAuth mengikuti kebutuhan adapter; jangan over-engineer relasi yang belum dipakai.

---

### 5. Siapkan konfigurasi migrasi (jika belum ada)
**Tujuan:** schema bisa digenerate jadi SQL migration.

1. Tambahkan `drizzle.config.*` bila belum ada:
   - dialect `mysql`
   - path schema
   - output folder migrasi
   - ambil `DATABASE_URL` dari env
2. Tambahkan script npm bila belum ada:
   - generate migration
   - migrate apply (opsional untuk task ini, tapi minimal generate harus siap).

---

### 6. Generate migration dan verifikasi
**Tujuan:** membuktikan schema valid dan siap dipakai task berikutnya.

1. Jalankan generate migration dari schema terbaru.
2. Pastikan file migrasi berisi:
   - create table auth + domain
   - enum `benefit/cost`
   - unique constraints yang diminta.
3. Jalankan:
   - `npm run check` / `npm run check:fix`
   - `npm run build`
4. Cek diagnostics TypeScript via MCP IDE (tidak ada error merah).

---

## Definition of Done (DoD)
Task 2 dianggap selesai jika:
- `src/db/schema.ts` sudah memuat 6 tabel (3 BetterAuth + 3 domain SPK).
- Composite unique `(store_id, periode)` aktif.
- Enum `benefit/cost` aktif pada `criteria_weights`.
- Migrasi berhasil digenerate dari schema tanpa error.
- Build/check project tetap aman.

---

## Risiko Umum + Antisipasi
- **Risiko:** skema BetterAuth ditulis manual tanpa referensi resmi lalu tidak kompatibel adapter.  
  **Antisipasi:** wajib ambil struktur dari Context7 docs BetterAuth sebelum coding.

- **Risiko:** pemilihan tipe numeric tidak konsisten antar kolom float.  
  **Antisipasi:** tetapkan satu standar (`double`/`real`) dan dokumentasikan.

- **Risiko:** constraint unique lupa diterapkan di level DB.  
  **Antisipasi:** validasi hasil SQL migration, bukan hanya melihat TypeScript schema.

- **Risiko:** task melebar ke seeder/action API.  
  **Antisipasi:** kunci scope: Task 2 fokus schema-relasi-constraint saja.

---

## Checklist Eksekusi Cepat (untuk junior/AI murah)
- [ ] Sudah baca docs resmi Drizzle + BetterAuth via Context7 MCP.
- [ ] `schema.ts` berisi user/session/account + criteria_weights/stores/performance_records.
- [ ] Enum `benefit/cost` sudah dipakai di kolom `tipe`.
- [ ] Unique `(store_id, periode)` sudah ada.
- [ ] Relasi stores ↔ performance_records sudah ada.
- [ ] Migration berhasil digenerate.
- [ ] `npm run check` dan `npm run build` sukses.

