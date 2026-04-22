# Issue Task 8 — Slice Input Kinerja Bulanan

## Tujuan
Membangun fitur input kinerja bulanan per toko agar admin bisa menyimpan metrik mentah operasional secara tervalidasi, dengan penanganan error yang jelas saat data duplikat per `store + periode`.

## Acceptance Criteria (Target Akhir)
- Form input menerima `periode`, `store`, dan 5 metrik mentah.
- Validasi domain berjalan (`incomplete_order <= total_order`, `sla_ontime <= total_order`).
- Constraint unik per store+periode ditangani dengan pesan error yang jelas.

## Dependency
**Task 2** (schema `performance_records`), **Task 4** (auth/session), dan **Task 7** (master data stores) harus sudah selesai.

## File yang Kemungkinan Diubah
- Route dashboard input kinerja (page + components)
- `src/actions/performance.ts`
- Zod schema input performa
- (Opsional) helper data stores/performance untuk reuse query

---

## Catatan Wajib: Skill dan MCP yang Harus Dipakai

### Skill relevan (wajib diprioritaskan)
1. `drizzle-orm` — insert/query ke `performance_records` dan penanganan constraint unik.
2. `frontend-ui-engineering` — form input bulanan yang jelas, usable, dan minim error input.
3. `nextjs-app-router-patterns` — server action + pembagian server/client component yang tepat.
4. `security-and-hardening` — validasi angka/periode/store di server-side, error handling eksplisit.
5. `source-driven-development` — ikuti docs resmi Next.js, Drizzle, Zod untuk mutation flow.
6. `planning-and-task-breakdown` — jaga scope Task 8 tetap fokus input kinerja bulanan.

### MCP relevan (wajib dipakai)
1. **Context7 MCP**:
   - Next.js Server Actions (mutasi + revalidate/refresh).
   - Drizzle MySQL insert + error handling unique constraint.
   - Zod validation dengan `refine/superRefine` untuk rule domain.
2. **IDE diagnostics MCP**:
   - cek type errors pada form schema, action payload, dan binding UI.

> Validasi domain wajib dilakukan di client (UX realtime) dan server (integritas data final).

---

## Keputusan Scope yang Wajib Ditetapkan Dulu
Sebelum implementasi, tetapkan policy berikut:

1. **Format periode**: tetapkan format tunggal (disarankan `YYYY-MM`) dan wajib konsisten.
2. **Nilai metrik**: integer/non-negative untuk metrik order; target/actual sales mengikuti tipe schema saat ini.
3. **Sumber daftar toko**: ambil dari tabel `stores` aktif, dengan fallback jika belum ada data.
4. **Error duplicate**: mapping pesan user-friendly saat kombinasi `store_id + periode` sudah ada.

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Kunci referensi resmi validation + insert flow
**Tujuan:** pastikan mutation flow mengikuti standar App Router.

1. Query Context7 untuk:
   - Next.js server action patterns,
   - Drizzle insert + handling unique constraint MySQL,
   - Zod `superRefine` untuk validasi relasi antar field.
2. Definisikan contract action (`success`, `message`) dan format error.

**Output tahap ini:**
- Struktur payload input kinerja final.
- Daftar rule validasi domain yang wajib ditegakkan.

---

### 2. Bangun data read path untuk form (stores + default periode)
**Tujuan:** form siap dipakai user tanpa input manual berlebihan.

1. Ambil daftar toko dari DB untuk pilihan select.
2. Tampilkan state kosong jika belum ada toko (arahkan user ke fitur Data Toko).
3. Siapkan nilai default `periode` (mis. bulan berjalan) sesuai policy.

---

### 3. Implement schema validasi input (Zod)
**Tujuan:** mencegah data domain invalid.

1. Definisikan schema field:
   - `storeId`, `periode`,
   - `targetSales`, `actualSales`,
   - `totalOrder`, `incompleteOrder`, `slaOntime`.
2. Tambahkan validasi domain dengan `superRefine`:
   - `incompleteOrder <= totalOrder`,
   - `slaOntime <= totalOrder`.
3. Tambahkan validasi format periode dan non-negative number.

---

### 4. Implement server action `src/actions/performance.ts`
**Tujuan:** simpan data kinerja dengan error handling jelas.

1. Validasi auth session di server action.
2. Parse payload menggunakan Zod schema.
3. Insert ke `performance_records` via Drizzle.
4. Tangani error duplicate unique `(store_id, periode)`:
   - return message yang mudah dipahami user.
5. Revalidate/refresh route input kinerja setelah simpan sukses.

---

### 5. Hubungkan form UI + server action + toast
**Tujuan:** alur submit end-to-end mulus.

1. Buat form client component untuk semua field.
2. Tambahkan validasi realtime di client untuk rule domain.
3. Submit ke action dengan loading state.
4. Tampilkan toast:
   - sukses saat data tersimpan,
   - error validasi/domain/duplicate dengan pesan spesifik.
5. Setelah sukses, reset/refresh sesuai UX policy (tanpa full page reload browser).

---

### 6. Verifikasi skenario utama
**Tujuan:** acceptance criteria terbukti fungsional.

1. Form menerima `periode`, `store`, dan 5 metrik mentah.
2. `incompleteOrder > totalOrder` ditolak dengan error jelas.
3. `slaOntime > totalOrder` ditolak dengan error jelas.
4. Input valid tersimpan ke DB.
5. Input duplicate store+periode ditolak dengan pesan khusus duplicate.
6. Jalankan `npm run check` dan `npm run build`.

---

## Definition of Done (DoD)
Task 8 dianggap selesai jika:
- Form input kinerja bulanan berfungsi lengkap dengan field yang diminta.
- Validasi domain aktif di client dan server.
- Error unique constraint store+periode ditangani dengan pesan user-friendly.
- Data valid tersimpan ke DB dan UI update tanpa full page reload.
- Tidak ada error TypeScript/lint/build terkait fitur ini.

---

## Risiko Umum + Antisipasi
- **Risiko:** validasi hanya di UI, payload invalid lolos lewat request manual.  
  **Antisipasi:** lakukan validasi ulang penuh di server action.

- **Risiko:** error duplicate tampil sebagai pesan SQL mentah.  
  **Antisipasi:** map error constraint menjadi pesan bisnis yang jelas.

- **Risiko:** daftar toko kosong membuat form tidak usable.  
  **Antisipasi:** tampilkan empty state + arahan tambah toko dulu.

- **Risiko:** format periode tidak konsisten antar input.  
  **Antisipasi:** lock format periode via schema + kontrol input yang terarah.

---

## Checklist Eksekusi Cepat (untuk junior/AI murah)
- [ ] Sudah ambil docs Next Server Action + Drizzle + Zod via Context7 MCP.
- [ ] Form input menerima periode, store, dan 5 metrik mentah.
- [ ] Validasi domain `incompleteOrder` dan `slaOntime` terhadap `totalOrder` aktif.
- [ ] `src/actions/performance.ts` menyimpan data valid ke `performance_records`.
- [ ] Error duplicate store+periode punya pesan yang jelas.
- [ ] Toast sukses/gagal tampil sesuai hasil submit.
- [ ] `npm run check` dan `npm run build` sukses.
