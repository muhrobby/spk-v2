# Report Implementasi Task 1 — Feature Upload Kinerja

Referensi task: `docs/feature-upload-kinerja.md` (Task 1: Centralize shared performance validation).

## Status

- Task 1 selesai diimplementasikan.
- Fokus implementasi: sentralisasi schema validasi input kinerja untuk form manual + server action single insert.

## Perubahan File

### 1) Create shared performance validation

- **File baru:** `src/lib/validation/performance.ts`
- Isi utama:
  - `strictPeriodeSchema`
    - validasi format `YYYY-MM`
    - validasi bulan `01..12` (menolak `00`, `13`, dst)
  - `performanceMetricsSchema`
    - validasi numerik non-negative
    - validasi domain:
      - `incompleteOrder <= totalOrder`
      - `slaOntime <= totalOrder`
  - `performanceRecordSchema`
    - schema server-side untuk create single record
  - `performanceFormSchema`
    - schema client-side untuk manual form
  - helper util:
    - `buildPerformanceDuplicateKey()`
    - `groupDuplicateRows()`
  - type contract upload (sesuai rencana task berikutnya):
    - `ParsedPerformanceUploadRow`
    - `PerformanceUploadPreviewRow`
    - `PerformanceUploadPreviewSummary`
    - `ValidatePerformanceUploadPreviewResult`
    - `CreatePerformanceRecordsBatchInput`
    - `CreatePerformanceRecordsBatchResult`

### 2) Tambah reusable validation messages

- **File diubah:** `src/lib/validation/common.ts`
- Tambahan message:
  - `periodeInvalidMonth`
  - `csvRequiredHeaders`
  - `uploadUnknownStore`
  - `uploadDuplicateInFile`
  - `uploadDuplicateInDatabase`
  - `uploadBatchAborted`

### 3) Manual form pakai shared schema

- **File diubah:** `src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx`
- Perubahan:
  - hapus schema lokal inline
  - import `performanceFormSchema` dari `@/lib/validation/performance`
  - type inference tetap dari schema (`z.infer`)

### 4) Server action single insert pakai shared schema

- **File diubah:** `src/actions/performance.ts`
- Perubahan:
  - hapus schema lokal inline
  - import `performanceRecordSchema` dari `@/lib/validation/performance`
  - `createPerformanceRecord()` sekarang parse input via schema shared

## Dampak Fungsional

- Validasi `periode` sekarang lebih ketat:
  - ✅ `2025-06` valid
  - ❌ `2025-13` invalid
  - ❌ `2025-00` invalid
- Rule domain existing tetap berlaku di form manual dan server:
  - `incompleteOrder > totalOrder` ditolak
  - `slaOntime > totalOrder` ditolak
- Source of truth validasi input kinerja sekarang terpusat di satu file.

## Verifikasi

Command yang dijalankan:

```bash
npm run check
npm run build
```

Hasil:

- `npm run check` ✅ pass
- `npm run build` ✅ pass

## Catatan

- Scope implementasi report ini hanya **Task 1**.
- Action preview upload dan batch all-or-nothing belum diimplementasikan (masuk Task 2+).
