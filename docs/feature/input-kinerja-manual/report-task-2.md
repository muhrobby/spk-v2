# Task 2 Report: Manual Performance Dialog

## Summary

- Menambahkan wrapper dialog khusus untuk input manual kinerja bulanan.
- Dialog ini hanya menjadi shell UI dan memakai `PerformanceForm` yang sudah ada.
- Flow upload CSV dan backend tetap tidak disentuh.

## Files Changed

- `src/app/(main)/dashboard/input-kinerja/_components/performance-manual-dialog.tsx`

## What Changed

- Ditambahkan komponen client `PerformanceManualDialog`.
- Dialog memakai state lokal `open` dengan `Dialog` shadcn.
- Dialog memiliki `DialogTitle` dan `DialogDescription` untuk aksesibilitas.
- Tombol trigger `Input Manual` memakai ikon `FilePenLine`.
- `PerformanceForm` dipanggil dengan `onSuccess={() => setOpen(false)}` agar dialog tertutup setelah submit berhasil.

## Scope Check

- In scope: ya.
- Out of scope: tidak ada perubahan server action, database, upload CSV, atau page utama.

## Verification

- Jalankan: `npx @biomejs/biome check "src/app/(main)/dashboard/input-kinerja/_components/performance-manual-dialog.tsx"`
- Build tidak dijalankan sesuai instruksi.

## Source Notes

- shadcn dialog docs: `https://ui.shadcn.com/docs/components/radix/dialog`
- shadcn dialog API: `https://www.radix-ui.com/docs/primitives/components/dialog.md`
- Next.js client component pattern untuk `useState` + `next/navigation` tetap mengikuti project pattern yang ada.

## Status

- Task 2 siap dipakai oleh halaman `input-kinerja` pada task berikutnya.
