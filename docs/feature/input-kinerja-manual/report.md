# Task 1 Report: PerformanceForm Reusable for Manual Dialog

## Summary

- Menambahkan callback opsional `onSuccess` ke `PerformanceForm` agar parent dialog bisa menutup modal setelah submit berhasil.
- Tidak ada perubahan ke server action, validation schema, atau flow upload CSV.

## Files Changed

- `src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx`

## What Changed

- Interface props `PerformanceFormProps` sekarang menerima `onSuccess?: () => void`.
- Setelah submit sukses, form tetap reset ke default values.
- Setelah reset, form memanggil `onSuccess?.()` lalu `router.refresh()`.

## Scope Check

- In scope: ya.
- Out of scope: tidak ada perubahan di luar fitur input kinerja manual.

## Verification

- Jalankan: `npx @biomejs/biome check "src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx"`
- Build tidak dijalankan sesuai instruksi.

## Source Notes

- React Hook Form `reset()` pattern diverifikasi dari dokumentasi resmi: `https://context7.com/react-hook-form/react-hook-form/llms.txt`
- Next.js App Router `router.refresh()` diverifikasi dari dokumentasi resmi: `https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/use-router.mdx`

## Status

- Task 1 siap diverifikasi lint-wise dan siap dipakai oleh dialog manual di task berikutnya.
