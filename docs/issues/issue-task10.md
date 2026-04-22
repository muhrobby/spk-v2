# Issue Task 10 — Sinkronisasi Navigasi, UX Copy, dan Hardening Input

## Tujuan

Merapikan lapisan akhir produk agar pengalaman admin konsisten: menu hanya menampilkan alur PRD utama, copy UI memakai istilah bisnis yang sama di semua halaman, dan validasi input/error message distandardisasi lintas fitur.

## Acceptance Criteria (Target Akhir)

- Sidebar diperbarui ke menu PRD: Dashboard, Pengaturan Bobot, Data Toko, Input Kinerja.
- Copy UI menggunakan istilah bisnis PRD yang konsisten.
- Seluruh batas input numerik dan pesan error penting terstandardisasi.

## Dependency

**Task 6, Task 7, Task 8, Task 9** harus sudah selesai.

## File yang Kemungkinan Diubah

- `src/navigation/sidebar/sidebar-items.ts`
- Page/section header pada route dashboard terkait
- Validator/schema shared (Zod) dan message constant/helper bila dibutuhkan
- (Opsional) file redirect/nav yang masih mengarah ke route lama dashboard

---

## Catatan Wajib: Skill dan MCP yang Harus Dipakai

### Skill relevan (wajib diprioritaskan)

1. `planning-and-task-breakdown` — pecah pekerjaan polish jadi urutan kecil dan aman.
2. `frontend-ui-engineering` — rapikan navigasi dan konsistensi copy antar layar.
3. `nextjs-app-router-patterns` — pastikan route canonical dashboard konsisten.
4. `security-and-hardening` — standardisasi validasi input dan error handling eksplisit.
5. `code-simplification` — centralize message/validator agar tidak duplikasi.
6. `source-driven-development` — ikuti referensi resmi saat mengubah navigasi/redirect.

### MCP relevan (wajib dipakai)

1. **Context7 MCP**:
   - Next.js App Router routing/link/redirect patterns untuk route canonical.
   - Zod schema reuse/custom message untuk standardisasi validasi.
2. **IDE diagnostics MCP**:
   - cek type mismatch setelah centralize schema/message dan update props UI.

> Fokus Task 10 adalah konsistensi UX dan hardening input, bukan menambah fitur bisnis baru.

---

## Keputusan Scope yang Wajib Ditetapkan Dulu

Sebelum implementasi, tetapkan policy berikut:

1. **Route canonical dashboard**: gunakan satu route utama (`/dashboard`) untuk semua redirect/link utama.
2. **Daftar menu final PRD**: pakai layout yanag sudah ada, hapus menu yang tidak di pakai
3. **Glossary istilah bisnis**: oakai y
   ang rekomendasi
4. **Aturan angka global**: pakai yang rekomendasi

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Audit konsistensi navigasi + copy + validasi

**Tujuan:** punya daftar gap yang konkret sebelum editing.

1. Inventaris semua link ke dashboard, menu sidebar, dan redirect auth/proxy.
2. Inventaris semua header/subtitle di halaman PRD utama.
3. Inventaris semua schema input numerik dan message error yang tampil ke user.

**Output tahap ini:**

- Daftar mismatch route/copy/validation yang harus ditutup di Task 10.

---

### 2. Sinkronisasi navigasi ke menu PRD final

**Tujuan:** menu dan alur masuk selalu sesuai produk SPK.

1. Rapikan `sidebar-items.ts` agar jalur utama hanya: Dashboard, Pengaturan Bobot, Data Toko, Input Kinerja.
2. Pastikan link logo/sidebar header mengarah ke route canonical dashboard.
3. Sinkronkan redirect auth/proxy/not-found agar tidak lagi mengarah ke route dashboard lama.
4. Validasi tidak ada link internal penting yang “nyasar” ke path lama.

---

### 3. Standardisasi UX copy berbasis glossary PRD

**Tujuan:** bahasa UI konsisten dan mudah dipahami admin.

1. Tetapkan kamus istilah bisnis singkat (1 sumber kebenaran).
2. Terapkan copy konsisten pada:
   - judul halaman,
   - deskripsi kartu/section,
   - label tombol utama,
   - pesan empty state.
3. Hindari campuran istilah teknis vs bisnis pada context user-facing.

---

### 4. Hardening input: schema dan batas angka terpusat

**Tujuan:** aturan validasi seragam di semua form numerik.

1. Normalisasi rule Zod untuk input numerik (non-negative, integer-only jika wajib, max jika relevan).
2. Terapkan pola message error yang konsisten dan tegas.
3. Jika ada rule yang sama di banyak fitur, ekstrak ke helper/schema shared untuk mencegah drift.
4. Pastikan validasi client dan server tetap selaras (UX + integritas).

---

### 5. Standardisasi pesan error penting

**Tujuan:** error mudah dipahami dan tidak “acak” antar fitur.

1. Samakan tone dan struktur kalimat error (contoh: sebab + tindakan).
2. Prioritaskan pesan pada skenario penting:
   - session/auth invalid,
   - input periode/angka tidak valid,
   - data tidak ditemukan/duplikat.
3. Hindari pesan mentah teknis (stack/SQL/internal detail) pada UI.

---

### 6. Verifikasi lintas halaman (regression polish)

**Tujuan:** memastikan alur utama PRD bersih dan konsisten.

1. Cek alur sidebar: Dashboard → Pengaturan Bobot → Data Toko → Input Kinerja.
2. Cek konsistensi copy di seluruh halaman utama PRD.
3. Cek validasi input numerik dan message error tampil sesuai standar baru.
4. Jalankan `npm run check` dan `npm run build`.

---

## Definition of Done (DoD)

Task 10 dianggap selesai jika:

- Navigasi utama hanya menonjolkan menu PRD dan route canonical dashboard konsisten.
- Copy UI antar fitur PRD memakai istilah bisnis yang sama.
- Rule batas angka dan pesan error penting sudah distandardisasi lintas form.
- Tidak ada error TypeScript/lint/build yang timbul akibat perubahan polish ini.

---

## Risiko Umum + Antisipasi

- **Risiko:** update sidebar tidak diikuti update redirect/link lain.  
  **Antisipasi:** lakukan audit route global dan grep path lama sebelum selesai.

- **Risiko:** copy konsisten di satu halaman, tapi drift di halaman lain.  
  **Antisipasi:** gunakan glossary tunggal sebagai referensi wajib.

- **Risiko:** hardening validator mengubah behavior secara tidak sengaja.  
  **Antisipasi:** lakukan perubahan bertahap per fitur, verifikasi skenario inti tiap selesai edit.

- **Risiko:** duplikasi schema/error message tetap muncul.  
  **Antisipasi:** ekstrak helper shared untuk rule yang benar-benar berulang.

---

## Final Checkpoint (Product Polish Complete)

- Alur utama PRD terasa sebagai satu produk yang konsisten (navigasi + copy + validasi).
- Tidak ada inkonsistensi mayor antara fitur Task 6–9 pada level UX dan input hardening.

---

## Checklist Eksekusi Cepat (untuk junior/AI murah)

- [ ] Sudah ambil referensi Next.js + Zod via Context7 MCP.
- [ ] Sidebar final hanya memprioritaskan menu PRD utama.
- [ ] Route canonical dashboard konsisten di link dan redirect penting.
- [ ] Istilah bisnis UI sudah seragam di semua halaman utama.
- [ ] Validator numerik dan pesan error penting sudah distandardisasi.
- [ ] `npm run check` dan `npm run build` sukses.
