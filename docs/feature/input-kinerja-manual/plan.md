# Input Kinerja Manual Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memindahkan form manual input kinerja bulanan yang saat ini tampil inline menjadi dialog terpisah, sambil mempertahankan dialog upload CSV yang sudah ada, sehingga halaman `/dashboard/input-kinerja` menampilkan dua aksi utama: `Input Manual` dan `Upload CSV`.

**Architecture:** Backend, server action, schema validasi, dan flow upload tidak diubah. Solusi hanya menambah wrapper client component baru `PerformanceManualDialog`, lalu memberi `PerformanceForm` callback opsional `onSuccess` supaya dialog manual bisa ditutup otomatis setelah submit berhasil. Halaman `page.tsx` menjadi shell ringan yang hanya menampilkan kartu aksi dan kartu informasi existing.

**Tech Stack:** Next.js 16 App Router, React client components, shadcn/ui Dialog/Button/Card, React Hook Form, Zod, Sonner, Biome, npm.

---

## Scope Lock

- In scope: memindahkan input manual ke dialog, menampilkan dua tombol aksi di halaman, dan menutup dialog manual saat submit sukses.
- In scope: perubahan kecil pada `PerformanceForm` agar reusable di dalam dialog.
- Out of scope: perubahan server action, perubahan upload CSV flow, perubahan database, perubahan schema Zod, dan penambahan test framework baru.
- Out of scope: redesign besar layout halaman input kinerja.

## Current State Snapshot

- `src/app/(main)/dashboard/input-kinerja/page.tsx` saat ini mengimpor `PerformanceForm` dan `PerformanceUploadDialog`.
- `PerformanceForm` masih dirender langsung di dalam `CardContent`, sehingga halaman menjadi panjang.
- `PerformanceUploadDialog` sudah memiliki pola dialog yang bisa dijadikan acuan implementasi.
- `PerformanceForm` sudah menangani submit, reset, toast, dan `router.refresh()`, tetapi belum bisa memberi tahu parent component bahwa submit sukses.
- Empty state ketika belum ada toko sudah benar dan tidak perlu diubah.

## Repo Rules That Must Be Respected

- Gunakan `npm`, jangan `pnpm` atau `yarn`.
- Jangan edit `src/components/ui/*`.
- Jangan ubah `src/actions/performance.ts` atau `src/lib/validation/performance.ts` untuk task ini, kecuali menemukan bug nyata yang memblokir implementasi.
- Karena repo ini tidak punya script `test`, jangan menambah Jest/Vitest/Cypress hanya untuk refactor kecil ini.
- Verifikasi teknis minimal adalah `npm run check && npm run build`.
- Untuk pengecekan parsial saat implementasi, gunakan `npx @biomejs/biome check <path>`.
- Gunakan perubahan sekecil mungkin yang tetap benar.

## Final UI Contract

- Saat data toko tersedia, halaman `/dashboard/input-kinerja` menampilkan satu tombol primer `Input Manual` dan satu tombol sekunder `Upload CSV`.
- Klik `Input Manual` membuka dialog berisi field form manual yang sama seperti sekarang.
- Klik `Simpan` pada form manual tetap memakai `createPerformanceRecord()` yang sekarang.
- Setelah submit manual sukses: toast sukses muncul, form reset, dialog tertutup, lalu halaman refresh.
- Klik `Upload CSV` tetap membuka flow upload yang sudah ada saat ini.
- Jika belum ada toko, halaman tetap menampilkan alert existing dan tidak menampilkan tombol input apa pun.

## File Map And Responsibilities

- Create: `src/app/(main)/dashboard/input-kinerja/_components/performance-manual-dialog.tsx`
  Tanggung jawab: menyimpan state `open` untuk dialog manual dan merender `PerformanceForm` di dalam dialog.
- Modify: `src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx`
  Tanggung jawab: menambah callback opsional `onSuccess` tanpa mengubah validation flow atau server action flow.
- Modify: `src/app/(main)/dashboard/input-kinerja/page.tsx`
  Tanggung jawab: menghapus form manual inline dari halaman dan menggantinya dengan dua tombol aksi.
- Keep unchanged: `src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx`
  Tanggung jawab: tetap menjadi trigger dan flow untuk upload CSV.

## Do Not Do This

- Jangan gabungkan `manual` dan `upload` ke satu dialog multi-mode.
- Jangan memindahkan validasi form dari `PerformanceForm` ke komponen dialog.
- Jangan membuat global state, context, store Zustand baru, atau query param baru.
- Jangan membuat hook baru hanya untuk `open/close` dialog.
- Jangan mengubah copy atau layout di luar area input kinerja jika tidak dibutuhkan.
- Jangan merombak `PerformanceUploadDialog` hanya demi “biar seragam”. Minimal change lebih aman.

## Implementation Order

1. Ubah `PerformanceForm` lebih dulu supaya bisa dipakai oleh parent dialog.
2. Buat `PerformanceManualDialog` baru.
3. Ubah `page.tsx` agar merender dua tombol aksi, bukan form inline.
4. Lakukan verifikasi lint/build/manual.

## Task 0: Pre-flight Checklist

**Files:**
- Read only: `src/app/(main)/dashboard/input-kinerja/page.tsx`
- Read only: `src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx`
- Read only: `src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx`

**Acceptance criteria:**
- Pengerja paham file mana yang diubah dan file mana yang sengaja tidak disentuh.
- Pengerja tidak mengubah backend, schema, atau upload flow.

- [ ] **Step 1: Pastikan workspace dan script yang tersedia sudah benar**

Jalankan:

```bash
npm run check --help
```

Expected:

```text
Command terbaca oleh npm. Tidak perlu menjalankan semua check di tahap ini.
```

- [ ] **Step 2: Baca tiga file target sebelum edit**

File yang wajib dibaca:

```text
src/app/(main)/dashboard/input-kinerja/page.tsx
src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx
src/app/(main)/dashboard/input-kinerja/_components/performance-upload-dialog.tsx
```

Tujuan baca:

```text
- page.tsx: melihat struktur halaman sekarang
- performance-form.tsx: melihat flow submit sukses dan reset form
- performance-upload-dialog.tsx: menjadikan pola dialog ini sebagai referensi UI
```

- [ ] **Step 3: Lock scope sebelum mulai coding**

Checklist yang harus dijawab “ya” sebelum lanjut:

```text
[ ] Saya tidak akan mengubah src/actions/performance.ts
[ ] Saya tidak akan mengubah src/lib/validation/performance.ts
[ ] Saya tidak akan menggabungkan manual dan upload ke satu dialog
[ ] Saya hanya akan menyentuh 3 file implementasi utama + 1 file baru
```

## Task 1: Make `PerformanceForm` Reusable Inside a Dialog

**Files:**
- Modify: `src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx`

**Why this task exists:**

`PerformanceForm` sudah benar untuk validasi dan submit. Kekurangan satu-satunya adalah form ini tidak bisa memberi tahu parent component bahwa submit berhasil. Kita hanya butuh callback opsional `onSuccess`, tidak lebih.

**Acceptance criteria:**

- `PerformanceForm` tetap bisa dipakai tanpa prop baru.
- Setelah submit sukses, parent component bisa menutup dialog lewat callback.
- Tidak ada perubahan ke field, validation, atau payload submit.

- [ ] **Step 1: Ubah interface props untuk menambah callback opsional `onSuccess`**

Ganti deklarasi props menjadi seperti ini:

```tsx
interface PerformanceFormProps {
  stores: Array<{
    id: number;
    namaToko: string;
  }>;
  onSuccess?: () => void;
}
```

Catatan:

```text
- onSuccess harus opsional agar PerformanceForm tetap reusable.
- Jangan tambah onClose, onCancel, onOpenChange, atau props lain yang belum dibutuhkan.
```

- [ ] **Step 2: Ubah signature component agar menerima `onSuccess`**

Ganti signature function ini:

```tsx
export function PerformanceForm({ stores }: PerformanceFormProps) {
```

menjadi:

```tsx
export function PerformanceForm({ stores, onSuccess }: PerformanceFormProps) {
```

- [ ] **Step 3: Panggil callback setelah submit sukses**

Cari blok sukses di dalam `onSubmit` yang saat ini berisi:

```tsx
toast.success(result.message);
form.reset({
  storeId: String(stores[0]?.id ?? ""),
  periode: defaultPeriode,
  targetSales: 0,
  actualSales: 0,
  totalOrder: 0,
  incompleteOrder: 0,
  slaOntime: 0,
});
router.refresh();
```

Ubah menjadi:

```tsx
toast.success(result.message);
form.reset({
  storeId: String(stores[0]?.id ?? ""),
  periode: defaultPeriode,
  targetSales: 0,
  actualSales: 0,
  totalOrder: 0,
  incompleteOrder: 0,
  slaOntime: 0,
});
onSuccess?.();
router.refresh();
```

Kenapa urutannya seperti ini:

```text
- reset dulu agar state form bersih
- panggil onSuccess agar parent dialog bisa menutup modal
- refresh page terakhir supaya data SSR ikut ter-update
```

- [ ] **Step 4: Jangan ubah bagian lain dari form**

Bagian di bawah ini harus tetap sama:

```text
- schema resolver
- default values
- field list
- domain validation incompleteOrder/slaOntime
- toast error dan setError field-level
- tombol Reset
```

- [ ] **Step 5: Jalankan check parsial untuk file ini**

Jalankan:

```bash
npx @biomejs/biome check "src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx"
```

Expected:

```text
No diagnostics found.
```

- [ ] **Step 6: Commit checkpoint opsional**

Jika ingin checkpoint kecil, gunakan:

```bash
git add "src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx"
git commit -m "refactor: make performance form reusable in dialog"
```

## Task 2: Create `PerformanceManualDialog`

**Files:**
- Create: `src/app/(main)/dashboard/input-kinerja/_components/performance-manual-dialog.tsx`

**Why this task exists:**

Halaman butuh trigger khusus untuk input manual, tetapi logic form tetap harus tinggal di `PerformanceForm`. Maka komponen baru ini hanya menjadi wrapper dialog tipis.

**Acceptance criteria:**

- Tombol `Input Manual` muncul dari komponen ini.
- Dialog memiliki title dan description untuk aksesibilitas.
- Dialog tertutup otomatis setelah submit sukses.
- Tidak ada duplicate logic form di file baru ini.

- [ ] **Step 1: Buat file baru dengan isi lengkap berikut**

Tambahkan file baru ini persis seperti di bawah:

```tsx
"use client";

import { useState } from "react";

import { FilePenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { PerformanceForm } from "./performance-form";

type StoreOption = {
  id: number;
  namaToko: string;
};

export function PerformanceManualDialog({ stores }: { stores: StoreOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <FilePenLine className="mr-1.5 size-4" />
          Input Manual
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Input Kinerja Manual</DialogTitle>
          <DialogDescription>
            Pilih periode, pilih toko, lalu isi metrik kinerja bulanan secara manual.
          </DialogDescription>
        </DialogHeader>

        <PerformanceForm stores={stores} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
```

Catatan penting:

```text
- File ini wajib "use client" karena memakai useState.
- Jangan copy-paste isi form ke file ini.
- Jangan tambahkan DialogFooter baru karena footer form sudah ada di dalam PerformanceForm.
```

- [ ] **Step 2: Pastikan ukuran dialog cukup nyaman untuk form panjang**

Kelas yang harus dipakai tetap ini:

```tsx
className="max-w-[calc(100%-2rem)] sm:max-w-3xl"
```

Alasan:

```text
- mobile tetap punya margin aman kiri-kanan
- desktop cukup lebar untuk layout grid form existing
- tidak terlalu lebar seperti upload preview table
```

- [ ] **Step 3: Pastikan close behavior hanya mengandalkan state lokal**

Yang benar:

```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
```

Yang jangan dibuat:

```tsx
// jangan buat state di page.tsx
// jangan buat context baru
// jangan buat prop drilling open/onOpenChange dari page
```

- [ ] **Step 4: Jalankan check parsial untuk file baru**

Jalankan:

```bash
npx @biomejs/biome check "src/app/(main)/dashboard/input-kinerja/_components/performance-manual-dialog.tsx"
```

Expected:

```text
No diagnostics found.
```

- [ ] **Step 5: Commit checkpoint opsional**

Jika ingin checkpoint kecil, gunakan:

```bash
git add "src/app/(main)/dashboard/input-kinerja/_components/performance-manual-dialog.tsx"
git commit -m "feat: add manual performance dialog"
```

## Task 3: Replace Inline Form on the Page With Two Action Buttons

**Files:**
- Modify: `src/app/(main)/dashboard/input-kinerja/page.tsx`

**Why this task exists:**

Setelah dialog manual tersedia, halaman tidak perlu lagi merender form panjang secara langsung. Halaman cukup jadi shell yang mengarahkan user memilih metode input.

**Acceptance criteria:**

- Import `PerformanceForm` dihapus dari page.
- Page mengimpor `PerformanceManualDialog`.
- Card utama hanya menampilkan title, description, dan dua tombol aksi.
- Empty state “belum ada toko” tetap sama.

- [ ] **Step 1: Ubah import section di atas file**

Import section yang benar harus menjadi seperti ini:

```tsx
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";

import { PerformanceManualDialog } from "./_components/performance-manual-dialog";
import { PerformanceUploadDialog } from "./_components/performance-upload-dialog";
```

Yang harus dihapus:

```tsx
import { PerformanceForm } from "./_components/performance-form";
```

- [ ] **Step 2: Ganti isi `Card` utama agar tidak lagi merender form inline**

Cari blok ini di `return`:

```tsx
<Card>
  <CardHeader>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <CardTitle>Form Input Kinerja Bulanan</CardTitle>
        <CardDescription>Pilih periode, pilih toko, lalu isi metrik kinerja bulanan.</CardDescription>
      </div>
      <PerformanceUploadDialog stores={storesList} />
    </div>
  </CardHeader>
  <CardContent>
    <PerformanceForm stores={storesList} />
  </CardContent>
</Card>
```

Ganti seluruh blok itu menjadi:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Form Input Kinerja Bulanan</CardTitle>
    <CardDescription>Pilih metode input data kinerja bulanan yang ingin digunakan.</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex flex-wrap gap-3">
      <PerformanceManualDialog stores={storesList} />
      <PerformanceUploadDialog stores={storesList} />
    </div>
  </CardContent>
</Card>
```

Kenapa struktur ini dipilih:

```text
- lebih sederhana daripada menyimpan tombol di header dengan wrapper flex khusus
- CardContent sekarang punya fungsi jelas: area aksi
- layout tombol tetap responsif karena memakai flex-wrap
```

- [ ] **Step 3: Jangan ubah bagian empty state dan info cards**

Bagian berikut harus tetap utuh:

```text
- blok if (storesList.length === 0)
- grid 3 card di bawah: Format Periode, Validasi Utama, Constraint Unik
- copy existing heading halaman Input Kinerja
```

- [ ] **Step 4: Jalankan check parsial untuk page file**

Jalankan:

```bash
npx @biomejs/biome check "src/app/(main)/dashboard/input-kinerja/page.tsx"
```

Expected:

```text
No diagnostics found.
```

- [ ] **Step 5: Commit checkpoint opsional**

Jika ingin checkpoint kecil, gunakan:

```bash
git add "src/app/(main)/dashboard/input-kinerja/page.tsx"
git commit -m "feat: show manual and upload actions on performance page"
```

## Task 4: Full Verification

**Files:**
- Verify all changed files together

**Acceptance criteria:**

- Lint dan format check lolos.
- Build lolos.
- Dialog manual bisa dibuka dan ditutup.
- Submit manual sukses tetap bekerja.
- Upload dialog tidak regress.

- [ ] **Step 1: Jalankan check penuh repo**

Jalankan:

```bash
npm run check
```

Expected:

```text
Biome/lint/format checks selesai tanpa error.
```

Jika gagal:

```text
- perbaiki hanya file yang baru diubah
- jangan refactor file lain yang tidak berkaitan
```

- [ ] **Step 2: Jalankan build produksi**

Jalankan:

```bash
npm run build
```

Expected:

```text
Build Next.js selesai sukses.
```

Jika build gagal karena env lokal belum lengkap:

```text
- jangan ubah code untuk mengakali env
- siapkan .env lokal sesuai AGENTS.md lalu ulangi build
```

- [ ] **Step 3: Jalankan dev server untuk QA manual**

Jalankan:

```bash
npm run dev
```

Lalu buka:

```text
/dashboard/input-kinerja
```

- [ ] **Step 4: Verifikasi tampilan halaman saat toko tersedia**

Checklist manual:

```text
[ ] Kartu utama tidak lagi menampilkan form panjang inline
[ ] Ada tombol Input Manual
[ ] Ada tombol Upload CSV
[ ] Tombol tampil berdampingan di desktop dan wrap rapi di layar sempit
```

- [ ] **Step 5: Verifikasi dialog manual**

Checklist manual:

```text
[ ] Klik Input Manual membuka dialog
[ ] Dialog menampilkan title "Input Kinerja Manual"
[ ] Dialog menampilkan description yang menjelaskan flow manual
[ ] Semua field form lama tetap ada
[ ] Tombol Simpan dan Reset tetap ada
```

- [ ] **Step 6: Verifikasi submit sukses di dialog manual**

Gunakan contoh data valid seperti ini:

```text
Periode: 2026-04
Target Penjualan: 10000000
Penjualan Aktual: 9500000
Total Order: 100
Incomplete Order: 3
SLA On-time: 97
```

Checklist manual:

```text
[ ] Klik Simpan menampilkan loading state "Menyimpan..."
[ ] Setelah sukses, toast sukses muncul
[ ] Dialog tertutup otomatis
[ ] Halaman refresh tanpa full reload browser
```

- [ ] **Step 7: Verifikasi reset state saat dialog dibuka lagi**

Checklist manual:

```text
[ ] Buka ulang dialog manual
[ ] Field kembali ke default values
[ ] Periode kembali ke bulan berjalan
[ ] Store default kembali ke store pertama jika tersedia
```

- [ ] **Step 8: Verifikasi flow upload tidak regress**

Checklist manual:

```text
[ ] Klik Upload CSV masih membuka dialog upload existing
[ ] Tombol pilih file, download template, reset masih ada
[ ] Menutup dialog upload tetap bekerja
[ ] Tidak ada error console akibat perubahan page
```

- [ ] **Step 9: Verifikasi empty state tidak berubah**

Jika environment lokal tidak punya data toko, atau jika bisa dites di environment lain tanpa store, checklist-nya:

```text
[ ] Halaman tetap menampilkan alert "Belum ada toko yang terdaftar"
[ ] Link ke /dashboard/data-toko tetap ada
[ ] Tombol Input Manual dan Upload CSV tidak muncul pada state ini
```

- [ ] **Step 10: Final git diff sanity check**

Jalankan:

```bash
git diff -- "src/app/(main)/dashboard/input-kinerja/page.tsx" "src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx" "src/app/(main)/dashboard/input-kinerja/_components/performance-manual-dialog.tsx"
```

Pastikan diff hanya menunjukkan tiga hal ini:

```text
- prop baru onSuccess di PerformanceForm
- file baru PerformanceManualDialog
- page.tsx berganti dari form inline menjadi dua action buttons
```

## Definition Of Done

Pekerjaan dianggap selesai hanya jika semua poin ini terpenuhi:

```text
[ ] File baru performance-manual-dialog.tsx sudah ada
[ ] PerformanceForm punya prop opsional onSuccess
[ ] page.tsx tidak lagi mengimpor PerformanceForm
[ ] page.tsx menampilkan PerformanceManualDialog + PerformanceUploadDialog
[ ] npm run check lolos
[ ] npm run build lolos
[ ] QA manual untuk manual dialog dan upload dialog lolos
```

## Rollback Plan

Jika implementasi menyebabkan masalah, rollback paling aman adalah:

1. hapus import `PerformanceManualDialog` dari `page.tsx`
2. kembalikan `PerformanceForm` inline di `CardContent`
3. hapus file `performance-manual-dialog.tsx`
4. hapus prop `onSuccess` dari `PerformanceForm` bila benar-benar tidak dipakai lagi

Rollback ini aman karena tidak menyentuh backend atau database.

## Suggested Final Commit

Setelah semua lolos, gunakan commit message ini:

```bash
git add "src/app/(main)/dashboard/input-kinerja/page.tsx" "src/app/(main)/dashboard/input-kinerja/_components/performance-form.tsx" "src/app/(main)/dashboard/input-kinerja/_components/performance-manual-dialog.tsx" "docs/input-kinerja-manual/plan.md"
git commit -m "feat: move manual performance input into dialog"
```

## Notes For Junior Programmer / Low-Cost Agent

- Kerjakan task sesuai urutan. Jangan lompat langsung ke `page.tsx` sebelum `PerformanceForm` mendukung callback.
- Jika bingung, pilih perubahan yang lebih kecil.
- Jangan “sekalian merapikan” file lain. Itu sumber bug paling umum.
- Jangan menambah abstraction baru jika 1 prop opsional sudah cukup.
- Jika sebuah ide membuat perubahan ke lebih dari 3 file tambahan, kemungkinan ide itu terlalu besar untuk scope ini.
