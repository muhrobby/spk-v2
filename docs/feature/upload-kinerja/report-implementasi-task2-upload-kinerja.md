# Report Implementasi Task 2 — Feature Upload Kinerja

Referensi task: `docs/feature-upload-kinerja.md` (Task 2: Build client CSV parser and local preview validation).

## Status

- Task 2 selesai diimplementasikan.
- Scope yang dikerjakan: parser CSV client-side, validasi lokal per baris, preview tabel di modal, summary valid/error, dan panel error summary.

## Perubahan File

### 1) Parser CSV dan validasi lokal

- **File baru:** `src/app/(main)/dashboard/input-kinerja/_components/performance-upload-csv.ts`
- Fitur utama:
  - parse CSV dari text:
    - trim BOM (`\uFEFF`)
    - normalisasi newline (`\r\n` / `\r` ke `\n`)
    - split baris
    - trim nilai per kolom
    - skip row yang seluruh cell kosong
  - validasi header exact match sesuai plan:
    - `nama_toko`
    - `periode`
    - `target_penjualan`
    - `penjualan_aktual`
    - `total_order`
    - `incomplete_order`
    - `sla_ontime`
  - bentuk data `ParsedPerformanceUploadRow` dengan `rowNumber` file asli
  - validasi lokal per baris:
    - required field
    - parse numerik (angka / integer untuk order)
    - validasi periode via `strictPeriodeSchema`
    - validasi domain via `performanceMetricsSchema`
    - resolve `nama_toko` ke `storeId` dari daftar toko
    - deteksi duplicate dalam file
  - output preview:
    - `PerformanceUploadPreviewRow[]`
    - summary (`totalRows`, `validRows`, `errorRows`)
    - `errorSummary` flat dengan format `Baris X: ...`

### 2) Modal upload + preview table

- **File baru:** `src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx`
- Fitur utama:
  - modal berbasis `Dialog`
  - trigger button `Upload CSV`
  - file picker `.csv`
  - baca file menggunakan `file.text()` (Web File API)
  - tampilkan ringkasan:
    - total baris
    - valid
    - error
  - panel error summary (scrollable)
  - preview table kolom lengkap:
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
  - row error di-highlight (`bg-destructive/5`)
  - status badge (`Valid` / `Error`)
  - tombol `Simpan Data` sementara disabled jika masih error/processing (sesuai fase Task 2)
  - tombol `Reset` membersihkan state preview

### 3) Integrasi trigger ke halaman input kinerja

- **File diubah:** `src/app/(main)/dashboard/input-kinerja/page.tsx`
- Perubahan:
  - import `PerformanceUploadDialog`
  - render tombol/modal upload di area header card `Form Input Kinerja Bulanan`
  - pass `storesList` ke dialog untuk resolusi nama toko di validasi lokal

## Perilaku yang Sudah Aktif

- User bisa upload file CSV dan langsung melihat preview tanpa roundtrip server.
- Jika header salah, langsung ditolak dengan pesan error.
- Jika ada baris error, detail error per baris ditampilkan di:
  - panel summary error
  - kolom error pada tabel row terkait
- Duplicate dalam file sudah ditandai di validasi lokal.

## Catatan Implementasi

- Scope Task 2 **belum** mencakup:
  - validasi duplikasi dengan data existing database (Task 3)
  - submit batch all-or-nothing ke database (Task 4)
- Tombol `Simpan Data` masih placeholder state-gated sampai action submit di task lanjut tersedia.

## Verifikasi

Command yang dijalankan:

```bash
npm run check
npm run build
```

Hasil:

- `npm run check` ✅ pass
- `npm run build` ✅ pass

## Referensi MCP/Docs yang digunakan

- MDN FileReader / file text handling:
  - `https://github.com/mdn/content/blob/main/files/en-us/web/api/filereader/readastext/index.md`
- React form and input handling docs:
  - `https://github.com/reactjs/react.dev/blob/main/src/content/reference/react-dom/components/input.md`
- Zod v4 docs (safeParse/error behavior baseline):
  - `https://zod.dev/v4/changelog`
