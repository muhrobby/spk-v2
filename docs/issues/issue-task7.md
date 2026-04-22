# Issue Task 7 — Slice Data Toko (Master Data Stores)

## Tujuan
Membangun fitur master data toko agar admin bisa menambah dan melihat daftar toko dari database, dengan validasi input yang jelas dan UX update data tanpa full page reload.

## Acceptance Criteria (Target Akhir)
- Admin dapat tambah dan melihat daftar toko.
- Validasi input `nama_toko` diterapkan.
- Perubahan data tersimpan ke DB dan tampil tanpa reload penuh halaman.

## Dependency
**Task 2** (schema DB stores) dan **Task 4** (auth/session) harus sudah selesai.

## File yang Kemungkinan Diubah
- Route dashboard data toko (page + components)
- `src/actions/stores.ts`
- Schema validasi Zod untuk form toko
- (Opsional) helper query stores jika dipakai ulang lintas fitur

---

## Catatan Wajib: Skill dan MCP yang Harus Dipakai

### Skill relevan (wajib diprioritaskan)
1. `drizzle-orm` — query `SELECT/INSERT` tabel `stores` yang type-safe.
2. `frontend-ui-engineering` — form tambah toko + tabel daftar toko yang rapi dan usable.
3. `nextjs-app-router-patterns` — pattern server component + server action.
4. `security-and-hardening` — validasi input, sanitasi/normalisasi string, error handling eksplisit.
5. `source-driven-development` — rujuk docs resmi Next.js, Drizzle, Zod.
6. `planning-and-task-breakdown` — jaga scope tetap Task 7 (master data toko saja).

### MCP relevan (wajib dipakai)
1. **Context7 MCP**:
   - Next.js Server Actions (mutation + refresh/revalidate).
   - Drizzle MySQL insert/select/query patterns.
   - Zod validation schema untuk input form.
2. **IDE diagnostics MCP**:
   - validasi type error untuk action, form schema, dan binding UI.

> Input validation wajib dijalankan di client (UX cepat) dan server (integritas data).

---

## Keputusan Scope yang Wajib Ditetapkan Dulu
Sebelum implementasi, tetapkan policy berikut:

1. **Aturan nama toko**: minimal panjang, maksimal panjang, dan trimming whitespace.
2. **Duplicate policy**: apakah `nama_toko` boleh duplikat atau harus unik secara bisnis (jika unik, lakukan pengecekan di server action).
3. **Urutan daftar toko**: mis. terbaru dulu (`created_at desc`) atau alfabet.
4. **Feedback error**: format pesan untuk validasi gagal vs gagal simpan DB.

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Kunci referensi resmi action + query
**Tujuan:** implementasi mengikuti pola standar App Router.

1. Query Context7 untuk:
   - server action mutation,
   - Drizzle insert/select MySQL,
   - Zod schema input string.
2. Definisikan contract action (`success`, `message`, optional payload).

**Output tahap ini:**
- Kontrak `createStoreAction` yang jelas.
- Keputusan policy duplicate + aturan nama toko.

---

### 2. Bangun data read path (list stores)
**Tujuan:** halaman menampilkan daftar toko dari DB.

1. Ambil data stores di server component route dashboard data toko.
2. Render tabel/list dengan kolom minimal:
   - `nama_toko`,
   - `created_at` (opsional format tanggal).
3. Sediakan state kosong (empty state) bila belum ada data.

---

### 3. Implement schema validasi input nama toko (Zod)
**Tujuan:** input invalid berhenti sebelum menyentuh DB.

1. Definisikan schema `nama_toko`:
   - `trim`,
   - `min(1)` setelah trim,
   - batas panjang wajar (mis. 100/255, sesuaikan policy).
2. Pakai schema sama di:
   - client form resolver,
   - server action parser.

---

### 4. Implement server action `src/actions/stores.ts`
**Tujuan:** tambah toko secara aman dan konsisten.

1. Validasi session auth di server action.
2. Parse payload dengan Zod.
3. (Jika policy unik) cek duplicate `nama_toko` dulu.
4. Insert ke tabel `stores` via Drizzle.
5. Revalidate/refresh route data toko agar update muncul tanpa full reload.
6. Return hasil action terstruktur untuk toast.

---

### 5. Hubungkan UI form + action + toast
**Tujuan:** alur tambah data end-to-end untuk admin.

1. Buat form input `nama_toko` di client component.
2. Submit ke server action dengan loading state.
3. Tampilkan toast:
   - sukses saat insert berhasil,
   - error saat validasi/server gagal.
4. Setelah sukses, daftar toko langsung update (router refresh/revalidation), tanpa hard reload browser.

---

### 6. Verifikasi skenario utama
**Tujuan:** acceptance criteria terpenuhi secara fungsional.

1. Halaman data toko menampilkan daftar dari DB.
2. Input kosong/invalid menampilkan error validasi.
3. Input valid berhasil tersimpan ke DB.
4. Data baru tampil langsung di daftar tanpa reload penuh halaman.
5. Jalankan `npm run check` dan `npm run build`.

---

## Definition of Done (DoD)
Task 7 dianggap selesai jika:
- Admin bisa melihat daftar toko dari DB.
- Admin bisa menambah toko baru melalui form tervalidasi.
- Validasi `nama_toko` aktif di client dan server.
- Setelah submit sukses, list toko update tanpa full page reload.
- Tidak ada error TypeScript/lint/build terkait fitur ini.

---

## Risiko Umum + Antisipasi
- **Risiko:** validasi hanya di UI, payload invalid tetap bisa masuk lewat request manual.  
  **Antisipasi:** ulangi validasi Zod di server action.

- **Risiko:** data tidak langsung terlihat setelah insert (terasa “tidak tersimpan”).  
  **Antisipasi:** gunakan revalidatePath/router.refresh setelah mutation.

- **Risiko:** duplikasi nama toko jika policy unik tidak ditegakkan.  
  **Antisipasi:** cek duplicate server-side dan return pesan error eksplisit.

- **Risiko:** scope melebar ke edit/hapus toko.  
  **Antisipasi:** Task 7 fokus add + list dulu sesuai acceptance criteria.

---

## Checklist Eksekusi Cepat (untuk junior/AI murah)
- [ ] Sudah ambil docs Next Server Action + Drizzle + Zod via Context7 MCP.
- [ ] Route data toko menampilkan daftar stores dari DB.
- [ ] Form tambah toko tersedia dan terhubung ke server action.
- [ ] Validasi `nama_toko` aktif di client dan server.
- [ ] Data baru tersimpan dan langsung muncul tanpa full reload.
- [ ] Toast sukses/gagal tampil sesuai hasil operasi.
- [ ] `npm run check` dan `npm run build` sukses.
