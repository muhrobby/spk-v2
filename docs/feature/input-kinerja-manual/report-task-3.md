# Task 3 Report: Input Kinerja Page Uses Two Action Buttons

## Summary

- Mengubah halaman `/dashboard/input-kinerja` agar tidak lagi menampilkan form manual inline.
- Halaman sekarang menjadi shell aksi yang menampilkan dua tombol: `Input Manual` dan `Upload CSV`.
- Empty state dan kartu info di bawahnya tetap dipertahankan.

## Files Changed

- `src/app/(main)/dashboard/input-kinerja/page.tsx`

## What Changed

- Import `PerformanceForm` dihapus dari page.
- Import `PerformanceManualDialog` ditambahkan.
- Card utama sekarang hanya berisi title, description, dan dua tombol aksi.
- Layout tombol menggunakan `flex flex-wrap gap-3` agar responsif.

## Scope Check

- In scope: ya.
- Out of scope: tidak ada perubahan server action, upload dialog, database, atau file UI umum.

## Verification

- Jalankan: `npx @biomejs/biome check "src/app/(main)/dashboard/input-kinerja/page.tsx"`
- Build tidak dijalankan sesuai instruksi.

## Source Notes

- shadcn button docs: `https://ui.shadcn.com/docs/components/radix/button`
- shadcn card docs: `https://ui.shadcn.com/docs/components/radix/card`

## Status

- Task 3 selesai pada level implementasi file page dan siap dilanjutkan ke task berikutnya.
