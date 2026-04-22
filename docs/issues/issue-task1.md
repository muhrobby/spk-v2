# Issue Task 1 — Setup Dependensi, Konfigurasi Env, dan Struktur DB

## Tujuan
Menyiapkan fondasi backend agar task lanjutan (schema, seeder, auth flow, SPK engine) bisa dikerjakan aman oleh junior programmer atau model AI yang lebih murah tanpa banyak trial-error.

## Acceptance Criteria (Target Akhir)
- Dependensi Drizzle/MySQL/BetterAuth terpasang dan terdaftar di `package.json`.
- Konfigurasi koneksi database dan variabel environment terdokumentasi.
- Struktur folder backend (`src/db`, `src/actions`, `src/lib/auth`) tersedia.

## Dependency
**None** (bisa mulai langsung).

## File yang Kemungkinan Diubah
- `package.json`
- `src/db/*`
- `src/actions/*`
- `src/lib/auth/*`
- `README.md` dan/atau `.env.example`

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Pasang dependensi inti backend
**Tujuan:** project punya tool minimum untuk DB + auth.

1. Tambahkan dependensi runtime:
   - `drizzle-orm`
   - `mysql2`
   - `better-auth`
2. Tambahkan dependensi dev:
   - `drizzle-kit`
3. Pastikan `package-lock.json` ikut ter-update setelah install.
4. Jangan menghapus dependensi lain yang sudah ada.

**Catatan eksekusi:**
- Gunakan `npm` (sesuai repo ini).
- Jangan menambahkan library tambahan di luar kebutuhan Task 1.

---

### 2. Siapkan environment variable dan dokumentasi env
**Tujuan:** koneksi DB dan auth bisa dikonfigurasi konsisten antar environment.

1. Tambahkan variabel minimum di `.env.example` (buat file jika belum ada), misalnya:
   - `DATABASE_URL=`
   - `BETTER_AUTH_SECRET=`
   - `BETTER_AUTH_URL=` (atau base URL sesuai integrasi nanti)
2. Tambahkan penjelasan singkat di `README.md` tentang:
   - cara copy `.env.example` ke `.env`
   - variabel mana yang wajib diisi sebelum run dev/build
3. Jangan commit file `.env` berisi nilai rahasia.

**Kriteria kualitas:**
- Nama variabel konsisten dipakai di kode (hindari typo / variasi nama).
- Instruksi README cukup jelas untuk engineer baru menjalankan project.

---

### 3. Buat struktur dasar backend folder
**Tujuan:** menyiapkan tempat file agar task lanjutan tinggal mengisi logic.

1. Pastikan folder berikut ada:
   - `src/db/`
   - `src/actions/`
   - `src/lib/auth/`
2. Buat file stub minimal (placeholder) agar struktur jelas, contoh:
   - `src/db/index.ts` (entry point koneksi DB)
   - `src/db/config.ts` (helper baca env DB)
   - `src/lib/auth/index.ts` (entry point auth config)
   - `src/actions/README.md` atau file placeholder TypeScript kecil (opsional, jika perlu)
3. Isi stub secukupnya (jangan implementasi penuh Task 2+).

**Batasan:**
- Jangan membuat schema final di Task 1.
- Jangan membuat logic auth flow login/register penuh di Task 1.

---

### 4. Tambahkan guard dasar validasi env saat startup (ringan)
**Tujuan:** error cepat muncul jika env wajib belum diisi.

1. Buat helper kecil untuk membaca env penting (DB + auth secret).
2. Jika env kosong, lempar error yang jelas (mis. “Missing DATABASE_URL”).
3. Simpan helper ini di area fondasi (`src/db` / `src/lib/auth`) untuk dipakai Task berikutnya.

**Catatan:**
- Tidak perlu validasi kompleks dulu; cukup fail-fast untuk variabel kritikal.

---

### 5. Rapikan script npm (jika diperlukan)
**Tujuan:** mempermudah task selanjutnya (migrate/generate/seed).

1. Tambahkan script yang relevan bila sudah siap dipakai, contoh:
   - script drizzle generate/migrate (opsional di Task 1, wajib jelas jika ditambahkan).
2. Pastikan script baru tidak merusak script existing (`dev`, `build`, `check`).

---

### 6. Verifikasi hasil Task 1
**Tujuan:** memastikan acceptance criteria terpenuhi sebelum lanjut Task 2.

Checklist verifikasi:
1. `package.json` memuat Drizzle + MySQL + BetterAuth dependencies.
2. Struktur folder backend sudah ada dan bisa di-import tanpa error path.
3. `.env.example` + README sudah menjelaskan konfigurasi dasar.
4. Build/check tidak rusak setelah penambahan fondasi.

---

## Definition of Done (DoD)
Task 1 dianggap selesai jika:
- Semua acceptance criteria terpenuhi.
- Tidak ada perubahan scope ke Task 2/3/4 (schema detail, seeder, auth flow penuh).
- Engineer lain bisa lanjut implementasi hanya dari struktur + dokumentasi yang dibuat.

---

## Risiko Umum + Antisipasi
- **Risiko:** menambahkan terlalu banyak dependency “jaga-jaga”.  
  **Antisipasi:** pasang hanya yang benar-benar dipakai di PRD.

- **Risiko:** env variable tidak sinkron antara README, `.env.example`, dan kode.  
  **Antisipasi:** tetapkan satu sumber nama variabel dan gunakan konsisten.

- **Risiko:** Task 1 melebar ke implementasi auth/schema penuh.  
  **Antisipasi:** fokus fondasi saja; detail domain dikerjakan di Task 2+.

---

## Rekomendasi Skill untuk Implementer
Jika dikerjakan oleh AI agent, prioritaskan skill ini:
1. `planning-and-task-breakdown` — menjaga implementasi tetap bertahap dan tidak melebar.
2. `drizzle-orm` — setup dan best practice struktur Drizzle.
3. `better-auth-best-practices` — setup BetterAuth yang aman dan konsisten.
4. `security-and-hardening` — validasi env dan pengelolaan secret.
5. `documentation-and-adrs` — update README/.env.example dengan jelas.
