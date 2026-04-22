# Issue Task 9 — Slice Dashboard SPK + SAW Engine

## Tujuan
Membangun dashboard SPK bulanan yang menghitung skor C1/C2/C3 di server menggunakan bobot dinamis dari DB, lalu menampilkan ranking toko per periode secara jelas dan konsisten.

## Acceptance Criteria (Target Akhir)
- Server action menghitung skor C1/C2/C3 sesuai rule PRD dan bobot dinamis dari DB.
- Dashboard menampilkan ranking per periode (nilai tertinggi ke terendah).
- Badge warna nilai akhir diterapkan: hijau (>=4.0), kuning (3.0-3.9), merah (<3.0).

## Dependency
**Task 6** (pengaturan bobot) dan **Task 8** (input kinerja) harus sudah selesai.

## File yang Kemungkinan Diubah
- `src/actions/spk.ts`
- Halaman dashboard SPK (route page + komponen tabel ranking)
- (Opsional) helper kalkulasi SAW murni untuk memisahkan logika bisnis dari UI

---

## Catatan Wajib: Skill dan MCP yang Harus Dipakai

### Skill relevan (wajib diprioritaskan)
1. `planning-and-task-breakdown` — jaga ruang lingkup tetap fokus Task 9.
2. `drizzle-orm` — query data bobot + data performa + sorting ranking.
3. `nextjs-app-router-patterns` — server-side data flow untuk page dashboard.
4. `backend-patterns` — pisahkan logika kalkulasi, query, dan output contract.
5. `frontend-ui-engineering` — tabel ranking dan badge status yang terbaca jelas.
6. `security-and-hardening` — validasi input periode dan error handling eksplisit.
7. `source-driven-development` — implementasi mengikuti referensi resmi.

### MCP relevan (wajib dipakai)
1. **Context7 MCP**:
   - Next.js App Router: server-side data fetching + server action patterns.
   - Drizzle ORM: `select`, `join`, `orderBy`, dan perhitungan data terstruktur.
   - Zod: validasi input filter periode (`YYYY-MM`) agar request konsisten.
2. **IDE diagnostics MCP**:
   - cek type errors pada action output, props tabel ranking, dan badge logic.

> Perhitungan SAW wajib dilakukan di server, bukan di client component.

---

## Keputusan Scope yang Wajib Ditetapkan Dulu
Sebelum implementasi, pastikan policy berikut sudah final:

1. **Rule scoring C1/C2/C3**: ambil mapping skor 1–5 persis dari PRD (jangan asumsi bebas).
2. **Periode default**: tentukan default saat dashboard dibuka (mis. bulan berjalan).
3. **Data kosong periode**: tentukan UX saat tidak ada record (empty state, bukan tabel kosong tanpa konteks).
4. **Pembulatan nilai akhir**: tentukan format tampilan (mis. 2 desimal) agar konsisten di semua komponen.

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Kunci referensi resmi + kontrak perhitungan
**Tujuan:** menyamakan definisi SAW dan bentuk output sebelum coding.

1. Ambil referensi via Context7 untuk Next.js App Router + Drizzle query patterns.
2. Ekstrak rule PRD untuk C1/C2/C3 menjadi kontrak eksplisit:
   - input field yang dipakai,
   - cara konversi ke skor 1–5,
   - rumus nilai akhir berbobot.
3. Definisikan output minimal ranking:
   - `storeId`, `namaToko`, `periode`,
   - `skorC1`, `skorC2`, `skorC3`,
   - `nilaiAkhir`, `peringkat`.

**Output tahap ini:**
- Dokumen kontrak scoring final (siap diterjemahkan ke kode).
- Bentuk response server action yang stabil.

---

### 2. Implement server action `src/actions/spk.ts`
**Tujuan:** semua kalkulasi ranking berjalan di server.

1. Validasi input filter periode dengan Zod.
2. Query data yang dibutuhkan:
   - bobot aktif dari `criteria_weights`,
   - data performa per toko dari `performance_records`,
   - nama toko dari `stores`.
3. Terapkan kalkulasi C1/C2/C3 sesuai rule PRD.
4. Hitung `nilaiAkhir = (C1*bobot1 + C2*bobot2 + C3*bobot3) / 100` (atau sesuai formula final PRD).
5. Urutkan hasil dari nilai tertinggi ke terendah dan assign nomor ranking.
6. Return payload siap render untuk UI.

---

### 3. Bangun halaman dashboard ranking per periode
**Tujuan:** user dapat melihat hasil ranking bulanan secara langsung.

1. Tambahkan UI filter periode (`YYYY-MM`) yang tervalidasi.
2. Render tabel ranking dari data server action:
   - kolom minimal: rank, nama toko, C1, C2, C3, nilai akhir.
3. Tambahkan empty state yang informatif jika periode tidak memiliki data.
4. Pastikan data render server-side agar tidak bergantung kalkulasi di browser.

---

### 4. Implement badge warna nilai akhir
**Tujuan:** status performa cepat dibaca user.

1. Buat helper kecil untuk mapping badge:
   - `>= 4.0` → hijau,
   - `3.0 - 3.9` → kuning,
   - `< 3.0` → merah.
2. Terapkan mapping di kolom nilai akhir.
3. Pastikan threshold tidak ambigu (gunakan operator yang tegas).

---

### 5. Hardening error handling dan UX data kosong
**Tujuan:** hasil tetap jelas meski input/filter tidak ideal.

1. Tampilkan error message yang jelas untuk periode invalid.
2. Tangani kasus bobot belum lengkap / data performa belum ada dengan pesan spesifik.
3. Hindari fallback senyap: semua kegagalan penting harus terlihat di UI.

---

### 6. Verifikasi skenario utama
**Tujuan:** acceptance criteria terbukti terpenuhi.

1. Kalkulasi C1/C2/C3 mengikuti rule PRD (sample data terkontrol).
2. Ranking per periode tersusun dari nilai akhir tertinggi ke terendah.
3. Badge warna sesuai threshold hijau/kuning/merah.
4. Perhitungan benar-benar server-side (bukan hitung ulang di client).
5. Jalankan `npm run check` dan `npm run build`.

---

## Definition of Done (DoD)
Task 9 dianggap selesai jika:
- Server action menghasilkan ranking periodik dengan skor C1/C2/C3 + nilai akhir berbobot.
- Dashboard menampilkan urutan ranking yang benar dan stabil.
- Badge warna nilai akhir sesuai threshold bisnis.
- Empty/error states jelas untuk data belum tersedia atau input periode invalid.
- Tidak ada error TypeScript/lint/build terkait fitur ini.

---

## Risiko Umum + Antisipasi
- **Risiko:** rule C1/C2/C3 ditafsirkan berbeda dari PRD.  
  **Antisipasi:** tulis rule scoring eksplisit di awal dan review sebelum coding.

- **Risiko:** pembulatan nilai menyebabkan urutan ranking berubah tipis.  
  **Antisipasi:** bedakan nilai mentah (untuk sorting) vs nilai display (untuk UI).

- **Risiko:** logika hitung tercampur di komponen UI.  
  **Antisipasi:** semua kalkulasi ditempatkan di server action/helper server-only.

- **Risiko:** periode tidak valid memicu query tidak terkontrol.  
  **Antisipasi:** validasi Zod ketat untuk format `YYYY-MM`.

---

## Checkpoint C (Core Complete)
- Semua fitur utama PRD berfungsi sebagai alur utuh bulanan (set bobot → input data → ranking).
- Perhitungan dilakukan server-side dan tidak dieksekusi di client.

---

## Checklist Eksekusi Cepat (untuk junior/AI murah)
- [ ] Sudah ambil docs Next.js + Drizzle + Zod via Context7 MCP.
- [ ] Kontrak scoring C1/C2/C3 dari PRD sudah dipastikan final.
- [ ] `src/actions/spk.ts` menghitung nilai akhir berbobot di server.
- [ ] Dashboard menampilkan ranking per periode dari tertinggi ke terendah.
- [ ] Badge warna nilai akhir sesuai threshold hijau/kuning/merah.
- [ ] Empty/error state untuk data kosong & periode invalid tersedia.
- [ ] `npm run check` dan `npm run build` sukses.
