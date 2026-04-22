# Feature Upload Kinerja Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Goal:** Menambahkan fitur upload CSV pada menu Input Kinerja melalui modal, lengkap dengan preview data, validasi per baris, validasi duplikasi file dan database, serta penyimpanan batch mode all-or-nothing.
> **Architecture:** Pertahankan form manual yang sudah ada, lalu tambahkan modal upload CSV sebagai jalur input kedua. CSV diparse dan divalidasi di client untuk preview cepat, lalu server action memvalidasi ulang konflik database dan melakukan batch insert di dalam transaction agar satu error membatalkan seluruh penyimpanan.

## **Tech Stack:** Next.js 16 App Router, React 19, Zod 4, Drizzle ORM MySQL, Sonner, shadcn/ui (`Dialog`, `Table`, `Badge`, `Alert`, `Button`).

## Scope yang Sudah Dikunci

- Format upload versi pertama: `CSV` saja.
- Header CSV wajib:
  - `nama_toko`
  - `periode`
  - `target_penjualan`
  - `penjualan_aktual`
  - `total_order`
  - `incomplete_order`
  - `sla_ontime`
- Validasi `periode`:
  - wajib format `YYYY-MM`
  - bulan harus `01` sampai `12`
- Validasi domain:
  - semua field wajib
  - angka tidak boleh negatif
  - `total_order`, `incomplete_order`, `sla_ontime` wajib integer
  - `incomplete_order <= total_order`
  - `sla_ontime <= total_order`
- Validasi duplikasi:
  - duplikat dalam file yang sama ditolak
  - duplikat dengan data existing `store + periode` di database ditolak
- Mode simpan: `all-or-nothing`
  - bila ada 1 baris gagal saat validasi/simpan final, tidak ada data yang disimpan
- Error harus menunjuk nomor baris CSV yang jelas
  - `baris` mengikuti nomor baris file asli, termasuk header di baris 1

---

## File Map

### Create

- `src/lib/validation/performance.ts`
  - schema shared untuk input kinerja manual dan upload
  - helper validasi `periode`
  - helper duplicate key `store + periode`
  - types untuk preview dan batch payload/result
- `src/app/(main)/dashboard/input-kinerja/_components/performance-upload-csv.ts`
  - parser CSV client-side
  - normalisasi header/value
  - skip blank row yang benar-benar kosong
- `src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx`
  - modal upload
  - file picker
  - preview summary
  - preview table
  - error summary
  - submit/reset flow

### Modify

- `src/lib/validation/common.ts`
  - tambah message validasi baru yang reusable
- `src/actions/performance.ts`
  - pakai schema shared
  - tambah action validasi preview upload
  - tambah action simpan batch all-or-nothing
- `src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx`
  - reuse schema shared
  - ikut memakai validasi `periode` yang diperketat
- `src/app/(main)/dashboard/input-kinerja/page.tsx`
  - tambahkan tombol `Upload CSV`
  - render modal upload dan pass daftar toko

---

## Contract dan Data Shape

### CSV row setelah normalisasi client

```ts
type ParsedPerformanceUploadRow = {
  rowNumber: number
  namaToko: string
  periode: string
  targetSales: string
  actualSales: string
  totalOrder: string
  incompleteOrder: string
  slaOntime: string
}
Preview row setelah validasi client + server
type PerformanceUploadPreviewRow = {
  rowNumber: number
  namaToko: string
  periode: string
  targetSales: number | null
  actualSales: number | null
  totalOrder: number | null
  incompleteOrder: number | null
  slaOntime: number | null
  storeId: number | null
  isValid: boolean
  errors: string[]
}
Preview summary
type PerformanceUploadPreviewSummary = {
  totalRows: number
  validRows: number
  errorRows: number
}
Preview validation action result
type ValidatePerformanceUploadPreviewResult = {
  success: boolean
  message: string
  rows: PerformanceUploadPreviewRow[]
  summary: PerformanceUploadPreviewSummary
  hasErrors: boolean
}
Batch save action input
type CreatePerformanceRecordsBatchInput = {
  rows: Array<{
    rowNumber: number
    storeId: number
    periode: string
    targetSales: number
    actualSales: number
    totalOrder: number
    incompleteOrder: number
    slaOntime: number
  }>
}
Batch save action result
type CreatePerformanceRecordsBatchResult = {
  success: boolean
  message: string
  savedCount: number
  rowErrors?: Array<{
    rowNumber: number
    messages: string[]
  }>
}
---
## Validation Rules
### Shared `periode` rule
- Regex awal: `^\d{4}-\d{2}$`
- Lalu parse bulan:
  - `01` sampai `12` valid
  - `00`, `13`, dan format lain ditolak
- Pesan:
  - `Periode harus berformat YYYY-MM.`
  - `Bulan pada periode harus antara 01 sampai 12.`
### Shared numeric rules
- `targetSales`, `actualSales`
  - wajib angka `>= 0`
  - boleh desimal
- `totalOrder`, `incompleteOrder`, `slaOntime`
  - wajib integer `>= 0`
### Shared domain rules
- `incompleteOrder <= totalOrder`
- `slaOntime <= totalOrder`
### Duplicate rules
- Duplicate key final: `storeId + periode`
- Untuk deteksi awal di client:
  - jika `nama_toko` berhasil di-resolve ke store, gunakan `storeId + periode`
  - jika belum berhasil, fallback ke `namaToko.trim().toLowerCase() + periode`
---
UX Flow
Halaman utama
- Form manual tetap tampil seperti sekarang.
- Tambahkan tombol Upload CSV di card Form Input Kinerja Bulanan.
Modal upload
- Header:
  - title: Upload Data Kinerja
  - description: Upload file CSV, cek preview, lalu simpan data valid ke sistem.
- Area aksi:
  - Download Template
  - Pilih File
  - Reset
  - Simpan Data
- Summary:
  - Total baris
  - Valid
  - Error
- Preview table columns:
  - Baris
  - Status
  - Nama Toko
  - Periode
  - Target Penjualan
  - Penjualan Aktual
  - Total Order
  - Incomplete Order
  - SLA Ontime
  - Error
- Status badge:
  - Valid
  - Error
- Error row diberi highlight merah halus.
- Panel error summary menampilkan list flat:
  - Baris 3: periode harus berformat YYYY-MM.
  - Baris 3: SLA on-time tidak boleh lebih dari total order.
  - Baris 7: data untuk toko "Store A" periode 2025-06 sudah ada di database.
Tombol
- Simpan Data disabled bila:
  - belum ada file
  - parsing gagal
  - ada row invalid
  - sedang submit
- Reset membersihkan:
  - file input
  - summary
  - rows
  - error summary
  - hasil validasi server
Toast
- sukses:
  - 12 data kinerja berhasil disimpan.
- error preview:
  - File tidak bisa disimpan karena masih ada 4 baris error.
- error final all-or-nothing:
  - Upload dibatalkan. Tidak ada data yang disimpan karena ada error pada 1 atau lebih baris.
---
Task Breakdown
Task 1: Centralize shared performance validation
Files:
- Create: src/lib/validation/performance.ts
- Modify: src/lib/validation/common.ts
- Modify: src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx
- Modify: src/actions/performance.ts
- [ ] Tambahkan message reusable baru di src/lib/validation/common.ts:
  - invalid month
  - required CSV headers
  - unknown store
  - duplicate in file
  - duplicate in database
  - batch aborted all-or-nothing
- [ ] Buat src/lib/validation/performance.ts untuk menampung:
  - strictPeriodeSchema
  - performanceMetricsSchema
  - performanceRecordSchema
  - helper buildPerformanceDuplicateKey
  - helper groupDuplicateRows
  - types preview/save result
- [ ] Ganti schema manual form dan schema server action agar memakai source of truth yang sama.
- [ ] Pastikan form manual tetap menolak:
  - 2025-13
  - 2025-00
  - incomplete > total
  - slaOntime > total
Done when:
- Rule periode tidak lagi hanya regex
- Manual form dan server action single insert memakai schema shared yang sama
---
Task 2: Build client CSV parser and local preview validation
Files:
- Create: src/app/(main)/dashboard/input-kinerja/_components/performance-upload-csv.ts
- Create: src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx
- [ ] Implement parser CSV minimal untuk format repo ini:
  - split baris
  - trim BOM jika ada
  - trim header dan value
  - skip row yang seluruh cell-nya kosong
- [ ] Validasi header exact match:
  - nama_toko
  - periode
  - target_penjualan
  - penjualan_aktual
  - total_order
  - incomplete_order
  - sla_ontime
- [ ] Ubah setiap data row menjadi ParsedPerformanceUploadRow dengan rowNumber asli.
- [ ] Lakukan validasi lokal:
  - required field
  - periode
  - type angka
  - integer-only untuk order
  - domain metrics
  - resolve nama_toko ke storeId
  - duplicate dalam file
- [ ] Bentuk PerformanceUploadPreviewRow[] dan summary.
- [ ] Tampilkan preview table + error summary di dialog.
Done when:
- User dapat memilih file CSV dan langsung melihat row valid/error tanpa roundtrip awal ke server
- Error per baris sudah muncul dengan nomor baris yang jelas
---
Task 3: Add preview validation against database
Files:
- Modify: src/actions/performance.ts
- Modify: src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx
- [ ] Tambahkan server action validatePerformanceUploadPreview(...) yang menerima row valid-candidate dari client.
- [ ] Di server action:
  - cek session
  - validasi payload shape
  - cek storeId + periode yang sudah ada di performance_records
  - return row conflicts berdasarkan rowNumber
- [ ] Panggil action ini setelah validasi lokal lolos cukup jauh untuk row yang punya storeId dan periode valid.
- [ ] Merge hasil server ke preview rows.
- [ ] Tandai row conflict database sebagai invalid.
- [ ] Pastikan tombol Simpan Data tetap disabled bila ada conflict database.
Done when:
- Preview sudah bisa menampilkan error:
  - Baris X: data untuk toko "... " periode ... sudah ada di database.
---
Task 4: Implement batch save all-or-nothing with transaction
Files:
- Modify: src/actions/performance.ts
- [ ] Tambahkan server action createPerformanceRecordsBatch(...).
- [ ] Di server action:
  - cek session
  - parse payload dengan schema shared
  - cek ulang duplicate dalam payload
  - cek ulang duplicate di database
  - siapkan insert values
- [ ] Jalankan insert di dalam db.transaction(...).
- [ ] Bila ada benturan validasi sebelum insert:
  - return success: false
  - savedCount: 0
  - sertakan rowErrors
- [ ] Bila race condition menyebabkan unique constraint bentrok saat transaction:
  - tangkap error
  - map ke pesan bisnis all-or-nothing
  - return savedCount: 0
- [ ] Setelah sukses:
  - revalidatePath("/dashboard/input-kinerja")
  - return jumlah row tersimpan
Done when:
- Upload batch berhasil hanya jika semua row lolos
- Satu error membatalkan semua insert
---
Task 5: Integrate dialog into page and align final UX
Files:
- Modify: src/app/(main)/dashboard/input-kinerja/page.tsx
- Modify: src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx
- [ ] Tambahkan tombol Upload CSV di card header halaman input kinerja.
- [ ] Render dialog dengan daftar toko dari server page.
- [ ] Tambahkan Download Template yang menghasilkan CSV template sederhana di client.
- [ ] Saat submit sukses:
  - tampilkan toast sukses
  - reset state dialog
  - router.refresh()
- [ ] Saat submit gagal:
  - tampilkan toast error
  - tampilkan detail row error di modal
  - jangan tutup modal otomatis
- [ ] Pastikan empty state halaman tetap sama jika belum ada toko.
Done when:
- Upload flow terhubung penuh dari halaman sampai refresh data setelah sukses
- Manual form lama tetap berfungsi
---
Task 6: Verification and regression
Files:
- Test manually via /dashboard/input-kinerja
- [ ] Verifikasi skenario CSV valid penuh:
  - semua row valid
  - submit sukses
  - toast sukses muncul
- [ ] Verifikasi periode invalid:
  - 2025-13
  - 2025-00
  - 2025-6
  - 2025/06
- [ ] Verifikasi domain invalid:
  - incomplete_order > total_order
  - sla_ontime > total_order
- [ ] Verifikasi data toko tidak ditemukan.
- [ ] Verifikasi duplicate dalam file yang sama.
- [ ] Verifikasi duplicate dengan database existing.
- [ ] Verifikasi mode all-or-nothing:
  - siapkan file 2 row, 1 valid, 1 duplicate DB
  - hasil akhir: tidak ada satupun row masuk
- [ ] Verifikasi manual form tetap menolak periode invalid.
- [ ] Jalankan:
  - npm run check
  - npm run build
Done when:
- Semua acceptance criteria dan regression utama lolos
- Tidak ada error lint/build dari perubahan fitur ini
---
Acceptance Criteria Final
- Menu Input Kinerja memiliki tombol Upload CSV.
- Modal upload dapat membaca file CSV sesuai header yang ditetapkan.
- User melihat preview data sebelum simpan.
- Validasi per baris tampil jelas dengan nomor baris.
- periode divalidasi untuk format dan bulan valid.
- incomplete_order dan sla_ontime tidak boleh melebihi total_order.
- Duplikasi dalam file dan di database terdeteksi sebelum simpan.
- Penyimpanan batch berjalan mode all-or-nothing.
- Saat gagal, user mendapat pesan bahwa tidak ada data yang disimpan.
- Form manual lama tetap berfungsi dan ikut memakai validasi periode yang baru.
---
Risks and Mitigations
- Risiko: parser CSV terlalu naif untuk edge case quote/comma kompleks.
  Mitigasi: scope v1 dibatasi ke template CSV internal yang sederhana dan stabil.
- Risiko: conflict database lolos saat preview karena race condition.
  Mitigasi: cek ulang di server action batch + rely on unique constraint store_id + periode.
- Risiko: validasi upload dan form manual drift.
  Mitigasi: centralize schema di src/lib/validation/performance.ts.
- Risiko: modal terlalu besar dan sulit dirawat.
  Mitigasi: pindahkan parser ke file helper terpisah dan pertahankan komponen UI fokus pada state/render.
---
Verification Commands
npm run check
npm run build
---
## Reference Notes
- Next.js App Router forms + Server Actions:
  - `https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/01-getting-started/07-mutating-data.mdx`
- React form actions context:
  - `https://github.com/reactjs/react.dev/blob/main/src/content/blog/2024/12/05/react-19.md`
- Drizzle transactions:
  - `https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/transactions.mdx`
- Zod 4 validation/error handling:
  - `https://zod.dev/v4/changelog`
---
Self-Review
Plan ini sudah mencakup:
- modal upload CSV
- preview data
- validasi periode
- validasi domain per baris
- duplicate di file
- duplicate di database
- all-or-nothing transaction
- success/error messaging
- regression untuk form manual
- verifikasi npm run check dan npm run build
```
