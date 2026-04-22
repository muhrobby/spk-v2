# Report Implementasi Task 3 — Feature Upload Kinerja

Referensi task: `docs/feature-upload-kinerja.md` (Task 3: Add preview validation against database).

## Status

- Task 3 selesai diimplementasikan.
- Scope yang dikerjakan: server action validasi preview ke database, integrasi ke modal upload, merge hasil validasi DB ke preview rows, dan disable save ketika ada conflict database.

## Perubahan File

### 1) Tambah server action validasi preview upload

- **File diubah:** `src/actions/performance.ts`
- Penambahan utama:
  - schema payload `validatePerformanceUploadPreviewSchema`
  - action baru `validatePerformanceUploadPreview(input)`

Behavior action:

1. validasi session login
2. validasi shape payload (`rowNumber`, `storeId`, `periode`)
3. query ke tabel `performance_records` untuk mendeteksi existing `storeId + periode`
4. return `rowErrors` berbasis `rowNumber` jika konflik ditemukan

Format hasil action:

- `success`
- `message`
- `rowErrors: Array<{ rowNumber: number; messages: string[] }>`

Pesan konflik yang dipakai:

- `VALIDATION_MESSAGES.uploadDuplicateInDatabase`

### 2) Integrasi validasi DB ke modal preview

- **File diubah:** `src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx`

Penambahan utama:

- import action `validatePerformanceUploadPreview`
- setelah validasi lokal lolos tanpa error:
  - kirim kandidat row valid ke server action
  - merge hasil `rowErrors` dari DB ke `previewRows`
  - hitung ulang summary (`total/valid/error`)
  - update `errorSummary` dengan error DB
- state baru `dbValidationError` untuk kasus action validasi gagal total (mis. session tidak valid/payload invalid)
- tombol `Simpan Data` tetap disabled jika:
  - `!hasRows`
  - `hasErrors`
  - `isProcessing`
  - `dbValidationError` ada

Helper baru:

- `mergeDatabaseValidationResult(rows, rowErrors)`

### 3) Tidak ada perubahan pada parser lokal

- **File parser tetap:** `src/app/(main)/dashboard/input-kinerja/_components/performance-upload-csv.ts`
- Parser lokal tetap bertugas untuk validasi file-level dan row-level non-database.

## Dampak Fungsional

- Setelah upload CSV, bila validasi lokal bersih, sistem lanjut validasi ke database.
- Bila ada data yang sudah ada di DB (kombinasi `store + periode`), row ditandai `Error` di preview.
- Error conflict database muncul di:
  - `errorSummary`
  - row detail pada tabel preview
- Tombol simpan tidak bisa dipakai saat masih ada konflik DB.

## Verifikasi

Sesuai instruksi, verifikasi hanya:

```bash
npm run check
```

Hasil:

- `npm run check` ✅ pass

Catatan:

- `npm run build` sengaja **tidak** dijalankan sesuai permintaan user.

## Referensi MCP/Docs yang digunakan

- Next.js App Router server actions (pattern mutasi + action calls):
  - `https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/01-getting-started/07-mutating-data.mdx`
- Drizzle ORM pattern query/filter multi-condition:
  - `https://github.com/drizzle-team/drizzle-orm-docs`
