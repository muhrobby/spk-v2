# Implementation Plan: SPK Evaluasi Kinerja Toko (SAW Dinamis)

## Problem & Approach
Project saat ini masih berupa template dashboard Next.js tanpa backend domain SPK (belum ada MySQL/Drizzle/BetterAuth, belum ada schema, belum ada data flow evaluasi).  
Pendekatan implementasi: bangun fondasi backend lebih dulu (DB + auth), lalu deliver per fitur vertikal sesuai alur PRD: Pengaturan Bobot → Data Toko → Input Kinerja → Dashboard SPK.

## Current State Snapshot
- Stack UI sudah siap: Next.js App Router + Tailwind + shadcn/ui + RHF + Zod + Sonner.
- Auth page sudah disederhanakan ke route tunggal `/auth/login` dan terhubung BetterAuth.
- Dashboard template non-SPK (`/dashboard/crm`, `/dashboard/finance`, `/dashboard/analytics`, `/dashboard/productivity`, `/dashboard/coming-soon`, dan legacy default-v1) sudah dihapus untuk menjaga fokus domain SPK.
- Task 1 sudah selesai: dependency backend (`drizzle-orm`, `mysql2`, `better-auth`, `drizzle-kit`) sudah terpasang, `.env.example` dan fondasi folder backend sudah tersedia.
- Task 2 sudah selesai: `src/db/schema.ts` sudah memuat tabel BetterAuth + domain SPK, relasi `stores ↔ performance_records`, enum `benefit/cost`, dan unique constraint `(store_id, periode)`; migrasi awal Drizzle sudah tergenerate.
- Task 3 sudah selesai di level implementasi: seeder idempotent `criteria_weights` + script `db:seed` + dokumentasi README sudah tersedia (eksekusi seed membutuhkan kredensial DB yang valid di environment lokal).
- Dokumen rencana implementasi Task 4 sudah tersedia di `docs/issues/issue-task4.md`.
- Task 4 sudah selesai di level implementasi: BetterAuth server/client sudah terpasang (`/api/auth/[...all]`), login form sudah terhubung ke BetterAuth, register flow dibuat admin-only (self-register disabled), dan dashboard layout sudah membaca session server-side untuk proteksi awal.
- Dokumen rencana implementasi Task 5 sudah tersedia di `docs/issues/issue-task5.md`.
- Task 5 sudah selesai di level implementasi: proteksi route dashboard diperkuat dengan `src/proxy.ts` + guard layout server-side, halaman auth auto-redirect ke dashboard saat sudah login, dan alur redirect login/dashboard sudah konsisten.
- Dokumen rencana implementasi Task 6 sudah tersedia di `docs/issues/issue-task6.md`.
- Task 6 sudah selesai di level implementasi: halaman `/dashboard/pengaturan-bobot` menampilkan C1/C2/C3 dari DB, validasi realtime total bobot = 100 aktif, dan update tersimpan melalui server action `src/actions/weights.ts` dengan toast sukses/gagal.
- Dokumen rencana implementasi Task 7 sudah tersedia di `docs/issues/issue-task7.md`.
- Task 7 sudah selesai di level implementasi: halaman `/dashboard/data-toko` menampilkan daftar toko dari DB, admin dapat menambah toko via server action `src/actions/stores.ts`, validasi `nama_toko` aktif di client+server, dan data baru tampil lewat refresh route tanpa full reload.
- Dokumen rencana implementasi Task 8 sudah tersedia di `docs/issues/issue-task8.md`.
- Sudah ada pola server action (`src/server/server-actions.ts`) yang bisa dijadikan acuan.
- Sidebar menu dikontrol dari `src/navigation/sidebar/sidebar-items.ts` (config-driven), cocok untuk diganti ke menu PRD.

## Architecture Decisions (Planned)
- Gunakan **Drizzle ORM + MySQL** dengan struktur `src/db/*` (schema, connection, query helpers, seed).
- Integrasi **BetterAuth** untuk login admin berbasis email/password dan tabel standar BetterAuth.
- Letakkan logika SPK server-side di **Server Actions** (`src/actions/spk.ts` dan action domain terkait), bukan di client.
- Perhitungan nilai SPK mengikuti **rule-based scoring 1–5 langsung** sesuai PRD (tanpa normalisasi klasik antar toko).
- Form UI tetap client component untuk validasi realtime + toast, namun persistence lewat server action.
- Restruktur menu dashboard agar fokus ke 4 menu PRD: Dashboard, Pengaturan Bobot, Data Toko, Input Kinerja.

## Task Breakdown

### Phase 1 — Foundation

#### Task 1: Setup dependensi, konfigurasi env, dan struktur DB
**Acceptance criteria:**
- Dependensi Drizzle/MySQL/BetterAuth terpasang dan terdaftar di `package.json`.
- Konfigurasi koneksi database dan variabel environment terdokumentasi.
- Struktur folder backend (`src/db`, `src/actions`, `src/lib/auth`) tersedia.

**Dependencies:** None  
**Likely files:** `package.json`, `src/db/*`, `src/lib/auth/*`, `README.md` / `.env.example` (jika dipakai)

#### Task 2: Implement schema Drizzle MySQL + relasi + constraint
**Acceptance criteria:**
- `schema.ts` mencakup tabel BetterAuth (`user`, `session`, `account`) dan tabel domain (`criteria_weights`, `stores`, `performance_records`).
- Constraint unik `(store_id, periode)` pada `performance_records` diterapkan.
- Tipe enum `benefit/cost` dan tipe numerik sesuai kebutuhan PRD diterapkan.

**Dependencies:** Task 1  
**Likely files:** `src/db/schema.ts`, `drizzle.config.*` (jika diperlukan), file migrasi

#### Task 3: Seeder bobot default C1/C2/C3
**Acceptance criteria:**
- Ada seeder untuk mengisi default `criteria_weights` (C1=40, C2=30, C3=30).
- Seeder idempotent (aman dijalankan berulang, tidak duplikasi data).
- Alur eksekusi seed terdokumentasi di script project.

**Dependencies:** Task 2  
**Likely files:** `src/db/seed/*`, `package.json`

### Checkpoint A (Foundation)
- Schema + seed siap dipakai end-to-end di environment lokal.
- Struktur backend tidak mengganggu arsitektur App Router yang sudah ada.

---

### Phase 2 — Authentication & Access

#### Task 4: Integrasi BetterAuth (server + client flow login)
**Acceptance criteria:**
- Login email/password terhubung ke BetterAuth (tidak lagi dummy toast-only).
- Session tersimpan dan bisa dipakai untuk proteksi route dashboard.
- Register flow disesuaikan dengan kebutuhan admin-only (lihat keputusan scope).

**Dependencies:** Task 1, Task 2  
**Likely files:** `src/lib/auth/*`, `src/app/api/auth/*`, komponen auth form, halaman auth

#### Task 5: Route protection dan guard dashboard
**Acceptance criteria:**
- Route dashboard hanya dapat diakses user terautentikasi.
- User tanpa akses diarahkan ke halaman login/unauthorized sesuai kebijakan.
- Navigasi auth → dashboard berjalan konsisten.

**Dependencies:** Task 4  
**Likely files:** `src/proxy.ts` (enable jika dipilih), `src/app/(main)/dashboard/layout.tsx`, helper auth server

### Checkpoint B (Access)
- Alur autentikasi admin berjalan dari login sampai akses dashboard terlindungi.

---

### Phase 3 — Core SPK Feature Slices

#### Task 6: Slice Pengaturan Bobot (CRUD update bobot + validasi total 100)
**Acceptance criteria:**
- Halaman pengaturan bobot menampilkan C1/C2/C3 dari DB.
- Validasi realtime: total bobot harus 100, tombol simpan disabled jika tidak valid.
- Simpan menggunakan server action + feedback toast sukses/gagal.

**Dependencies:** Task 3, Task 4  
**Likely files:** route dashboard pengaturan bobot, `src/actions/weights.ts`, schema validasi Zod

#### Task 7: Slice Data Toko (master data stores)
**Acceptance criteria:**
- Admin dapat tambah dan melihat daftar toko.
- Validasi input `nama_toko` diterapkan.
- Perubahan data tersimpan ke DB dan tampil tanpa reload penuh halaman.

**Dependencies:** Task 2, Task 4  
**Likely files:** route dashboard data toko, `src/actions/stores.ts`, komponen form+tabel

#### Task 8: Slice Input Kinerja bulanan
**Acceptance criteria:**
- Form input menerima `periode`, `store`, dan 5 metrik mentah.
- Validasi domain berjalan (`incomplete_order <= total_order`, `sla_ontime <= total_order`).
- Constraint unik per store+periode ditangani dengan pesan error yang jelas.

**Dependencies:** Task 2, Task 4, Task 7  
**Likely files:** route dashboard input kinerja, `src/actions/performance.ts`, Zod schema input

#### Task 9: Slice Dashboard SPK + SAW engine
**Acceptance criteria:**
- Server action menghitung skor C1/C2/C3 sesuai rule PRD dan bobot dinamis dari DB.
- Dashboard menampilkan ranking per periode (nilai tertinggi ke terendah).
- Badge warna nilai akhir diterapkan: hijau (>=4.0), kuning (3.0-3.9), merah (<3.0).

**Dependencies:** Task 6, Task 8  
**Likely files:** `src/actions/spk.ts`, halaman dashboard SPK, komponen tabel ranking

### Checkpoint C (Core Complete)
- Semua fitur utama PRD berfungsi sebagai alur utuh bulanan (set bobot → input data → ranking).
- Perhitungan dilakukan server-side dan tidak dieksekusi di client.

---

### Phase 4 — Integration Polish

#### Task 10: Sinkronisasi navigasi, UX copy, dan hardening input
**Acceptance criteria:**
- Sidebar diperbarui ke menu PRD: Dashboard, Pengaturan Bobot, Data Toko, Input Kinerja.
- Copy UI menggunakan istilah bisnis PRD yang konsisten.
- Seluruh batas input numerik dan pesan error penting terstandardisasi.

**Dependencies:** Task 6, Task 7, Task 8, Task 9  
**Likely files:** `src/navigation/sidebar/sidebar-items.ts`, page/section headers, validators shared

### Final Checkpoint
- Aplikasi siap dipakai sebagai portal internal SPK sesuai ruang lingkup PRD.

## Risks & Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Integrasi BetterAuth + Drizzle di project yang sebelumnya pure frontend template | High | Kerjakan lewat fase foundation+auth lebih awal, validasi alur login sebelum fitur SPK |
| Konflik UX dengan halaman dashboard template lama | Medium | Ganti menu dan route secara eksplisit untuk flow SPK, sisakan legacy route seperlunya |
| Data numerik float/int rentan input invalid | Medium | Gunakan Zod schema server/client dan constraint DB untuk jaga integritas |

## Open Questions
1. Untuk akses admin, apakah registrasi publik tetap diperlukan atau cukup seeded admin + login saja?
2. Apakah dashboard template lama (CRM/Finance/Analytics) ingin dipertahankan sebagai legacy route atau diganti penuh dengan menu SPK?
