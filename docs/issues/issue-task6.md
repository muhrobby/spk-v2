# Issue Task 6 — Slice Pengaturan Bobot (CRUD Update Bobot + Validasi Total 100)

## Tujuan
Membangun fitur pengaturan bobot C1/C2/C3 berbasis data database, sehingga admin dapat mengubah bobot secara aman dengan validasi total bobot harus **100** sebelum disimpan.

## Acceptance Criteria (Target Akhir)
- Halaman pengaturan bobot menampilkan C1/C2/C3 dari DB.
- Validasi realtime: total bobot harus 100, tombol simpan disabled jika tidak valid.
- Simpan menggunakan server action + feedback toast sukses/gagal.

## Dependency
**Task 3** (seed bobot default) dan **Task 4** (auth/session) harus sudah selesai.

## File yang Kemungkinan Diubah
- Route dashboard pengaturan bobot (page + components)
- `src/actions/weights.ts`
- Schema validasi Zod (mis. di folder route atau `src/actions`)
- (Opsional) helper query DB jika perlu dipakai ulang

---

## Catatan Wajib: Skill dan MCP yang Harus Dipakai

### Skill relevan (wajib diprioritaskan)
1. `drizzle-orm` — query/update tabel `criteria_weights` yang aman dan type-safe.
2. `frontend-ui-engineering` — form input bobot, UX validasi realtime, state submit/loading.
3. `nextjs-app-router-patterns` — batas server/client component + server action pattern.
4. `security-and-hardening` — validasi input server-side, cegah update data invalid.
5. `source-driven-development` — semua API/pola merujuk docs resmi Next.js + Drizzle.
6. `planning-and-task-breakdown` — implementasi bertahap, scope tetap fokus Task 6.

### MCP relevan (wajib dipakai)
1. **Context7 MCP**:
   - Next.js Server Actions (pattern mutation + revalidation).
   - Drizzle update query (MySQL) + transaksi jika diperlukan.
   - Zod schema validation pattern untuk form data.
2. **IDE diagnostics MCP**:
   - cek error TypeScript untuk schema form, action return type, dan binding UI.

> Validasi total 100 wajib dilakukan di **client** (UX realtime) dan **server** (data integrity).

---

## Keputusan Scope yang Wajib Ditetapkan Dulu
Sebelum implementasi, tetapkan policy berikut:

1. **Target data yang di-edit:** hanya 3 kriteria default (`C1/C2/C3`) pada Task 6.
2. **Format input bobot:** angka desimal diizinkan atau integer saja (pilih satu, konsisten).
3. **Toleransi perhitungan:** jika desimal diizinkan, tetapkan toleransi floating (mis. `Math.abs(total-100) < 0.001`).
4. **Rollback behavior:** jika satu update gagal, gunakan transaksi agar semua bobot tetap konsisten.

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Kunci referensi resmi action + validasi
**Tujuan:** hindari implementasi custom yang tidak konsisten dengan App Router.

1. Query Context7 untuk:
   - Next.js server action mutasi data.
   - Drizzle update MySQL.
   - Zod form validation.
2. Catat contract action (input/output) untuk dipakai UI.

**Output tahap ini:**
- Bentuk payload final update bobot.
- Strategy revalidation/refresh setelah simpan.

---

### 2. Buat query pembacaan bobot di server
**Tujuan:** halaman menampilkan bobot aktual dari DB, bukan hardcoded.

1. Ambil data `criteria_weights` (minimal `id/kode/nama_kriteria/tipe/bobot`).
2. Urutkan konsisten (`C1`, `C2`, `C3`) untuk UX stabil.
3. Jika data tidak lengkap, tampilkan fallback error state yang jelas.

---

### 3. Bangun form client dengan validasi realtime total 100
**Tujuan:** user langsung tahu valid/tidak sebelum submit.

1. Render 3 input bobot berdasarkan data server.
2. Hitung total realtime saat nilai berubah.
3. Tampilkan indikator status total (valid/invalid).
4. Disable tombol simpan jika total tidak 100 atau ada field invalid.

---

### 4. Implement server action update bobot
**Tujuan:** simpan perubahan secara atomik dan tervalidasi.

1. Buat `src/actions/weights.ts`:
   - parse + validasi payload dengan Zod,
   - validasi total bobot = 100 di server,
   - update data `criteria_weights` via Drizzle.
2. Gunakan transaksi untuk update multi-row agar konsisten.
3. Return hasil action terstruktur (success/error message).

---

### 5. Hubungkan form ke server action + feedback toast
**Tujuan:** UX submit lengkap (loading/sukses/gagal).

1. Saat submit:
   - tampilkan loading state,
   - panggil server action.
2. Jika sukses:
   - tampilkan toast sukses,
   - refresh/revalidate data.
3. Jika gagal:
   - tampilkan toast error yang jelas (tanpa silent failure).

---

### 6. Verifikasi skenario utama
**Tujuan:** pastikan acceptance criteria benar-benar terpenuhi.

1. Halaman load dan menampilkan C1/C2/C3 dari DB.
2. Ubah bobot sehingga total ≠ 100 → tombol simpan disable.
3. Ubah bobot total = 100 → tombol simpan aktif dan save berhasil.
4. Refresh halaman → bobot baru tetap tampil dari DB.
5. Jalankan `npm run check` dan `npm run build`.

---

## Definition of Done (DoD)
Task 6 dianggap selesai jika:
- Data bobot C1/C2/C3 terbaca dari DB di halaman pengaturan.
- Validasi realtime total 100 aktif dan mencegah submit invalid.
- Server action menyimpan update bobot secara aman + toast sukses/gagal muncul sesuai hasil.
- Tidak ada error TypeScript/lint/build setelah integrasi.

---

## Risiko Umum + Antisipasi
- **Risiko:** validasi hanya di client, data invalid tetap bisa masuk lewat bypass request.  
  **Antisipasi:** ulangi validasi total 100 di server action.

- **Risiko:** update partial membuat total bobot menjadi tidak konsisten.  
  **Antisipasi:** update dalam satu transaksi.

- **Risiko:** urutan/mapping kriteria tertukar (C1/C2/C3).  
  **Antisipasi:** gunakan `kode` sebagai identitas utama saat bind form dan update.

- **Risiko:** rounding error jika bobot desimal.  
  **Antisipasi:** tetapkan policy angka dan toleransi di awal implementasi.

---

## Checklist Eksekusi Cepat (untuk junior/AI murah)
- [ ] Sudah ambil docs Next Server Action + Drizzle + Zod via Context7 MCP.
- [ ] Halaman bobot membaca C1/C2/C3 dari tabel `criteria_weights`.
- [ ] Validasi realtime total bobot = 100 aktif.
- [ ] Tombol simpan disabled saat form invalid/total bukan 100.
- [ ] `src/actions/weights.ts` memvalidasi payload + update DB via transaksi.
- [ ] Toast sukses/gagal tampil sesuai hasil simpan.
- [ ] `npm run check` dan `npm run build` sukses.
