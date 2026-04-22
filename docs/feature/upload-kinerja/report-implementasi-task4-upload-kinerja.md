# Report Implementasi Task 4 — Feature Upload Kinerja

Referensi task: `docs/feature-upload-kinerja.md` (Task 4: Implement batch save all-or-nothing with transaction).

## Status

- Task 4 selesai diimplementasikan.
- Scope utama: action batch save all-or-nothing berbasis transaction + wiring submit dari modal upload.

## Perubahan File

### 1) Server action batch all-or-nothing

- **File diubah:** `src/actions/performance.ts`
- Penambahan action baru:
  - `createPerformanceRecordsBatch(input)`

Behavior action:

1. validasi session
2. validasi payload batch (`rows[]`) dengan schema khusus
3. validasi duplikasi dalam payload (same `storeId + periode`)
4. validasi keberadaan store di database
5. validasi konflik duplicate terhadap `performance_records`
6. insert semua row di `db.transaction(...)`
7. jika ada error pada satu row, seluruh transaction rollback
8. `revalidatePath("/dashboard/input-kinerja")` hanya saat sukses

Output action:

- sukses:
  - `success: true`
  - `savedCount: rows.length`
  - message jumlah data tersimpan
- gagal:
  - `success: false`
  - `savedCount: 0`
  - message all-or-nothing (`uploadBatchAborted`)
  - `rowErrors` detail per baris jika tersedia

### 2) Integrasi submit batch dari modal upload

- **File diubah:** `src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx`

Penambahan utama:

- import `createPerformanceRecordsBatch`
- handler baru `onSaveBatch()`:
  - ambil row valid dari preview
  - kirim ke action batch
  - jika gagal:
    - merge `rowErrors` ke row preview
    - hitung ulang summary
    - update error summary
    - tampilkan toast error
  - jika sukses:
    - tampilkan toast sukses
    - reset state modal
- state baru loading submit:
  - `isSubmitting`
  - disable input file/controls ketika submit
  - tombol `Simpan Data` tampil spinner `Menyimpan...`

### 3) Task 3 tetap dipertahankan

- validasi preview ke database (`validatePerformanceUploadPreview`) tetap dipakai.
- Task 4 fokus ke tahap submit final all-or-nothing.

## Dampak Fungsional

- Upload sekarang bisa benar-benar disimpan secara batch.
- Pola simpan sekarang all-or-nothing:
  - jika ada 1 baris gagal, tidak ada data yang disimpan (`savedCount: 0`).
- Error detail per baris bisa muncul kembali di modal setelah submit gagal.

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

- Drizzle transactions (atomic / rollback):
  - `https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/transactions.mdx`
- Next.js server action + revalidatePath:
  - `https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/01-getting-started/07-mutating-data.mdx`
