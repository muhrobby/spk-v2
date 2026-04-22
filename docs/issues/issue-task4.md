# Issue Task 4 — Integrasi BetterAuth (Server + Client Flow Login)

## Tujuan
Mengganti auth dummy (toast-only) menjadi autentikasi nyata berbasis BetterAuth + MySQL (Drizzle), sehingga login email/password benar-benar membuat session yang bisa dipakai untuk proteksi akses dashboard.

## Acceptance Criteria (Target Akhir)
- Login email/password terhubung ke BetterAuth (tidak lagi dummy toast-only).
- Session tersimpan dan bisa dipakai untuk proteksi route dashboard.
- Register flow disesuaikan dengan kebutuhan admin-only (lihat keputusan scope).

## Dependency
**Task 1** dan **Task 2** harus sudah selesai (env + koneksi DB + schema auth tersedia).

## File yang Kemungkinan Diubah
- `src/lib/auth/*`
- `src/app/api/auth/*`
- Komponen auth form (login/register) yang saat ini masih dummy
- Halaman auth terkait (`/auth/*`) dan helper server session

---

## Catatan Wajib: Skill dan MCP yang Harus Dipakai

### Skill relevan (wajib diprioritaskan)
1. `better-auth-best-practices` — setup BetterAuth server/client yang kompatibel App Router.
2. `authentication-setup` — desain flow login, session, dan kebijakan register admin-only.
3. `nextjs-app-router-patterns` — penempatan route handler dan server-side session check.
4. `security-and-hardening` — validasi input auth dan pembatasan register.
5. `source-driven-development` — implementasi harus mengikuti API resmi BetterAuth/Next.js.
6. `planning-and-task-breakdown` — pengerjaan bertahap, scope tetap fokus Task 4.

### MCP relevan (wajib dipakai)
1. **Context7 MCP**:
   - BetterAuth (server config, email/password auth, session, Next.js handler).
   - BetterAuth client API untuk login/register/signout.
   - Drizzle adapter BetterAuth (mapping ke tabel `user/session/account`).
2. **IDE diagnostics MCP**:
   - cek error TypeScript/route handler/client binding setelah integrasi.

> Jangan menebak API BetterAuth dari ingatan. Ambil signature final dari Context7 sebelum coding.

---

## Keputusan Scope yang Wajib Ditetapkan Dulu (Admin-Only Register)
Sebelum implementasi, pilih salah satu kebijakan berikut:

1. **Rekomendasi:** public register ditutup.  
   Halaman register tetap ada, tetapi menampilkan info “akun dibuat oleh super admin” atau redirect ke login.
2. Register dibuka terbatas (mis. allowlist email/domain internal).
3. Register dibuka sementara hanya untuk bootstrap environment lokal, lalu dimatikan via env flag.

> Acceptance criteria menyebut “register flow disesuaikan admin-only”, jadi implementasi harus eksplisit (bukan dibiarkan default terbuka).

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Kunci referensi resmi BetterAuth + Next.js
**Tujuan:** semua integrasi mengikuti API resmi dan minim trial-error.

1. Query Context7 untuk BetterAuth setup di Next.js App Router.
2. Query Context7 untuk BetterAuth + Drizzle adapter MySQL.
3. Catat API yang dipakai: init server auth, route handler, login/register, get session.

**Output tahap ini:**
- Daftar API final yang akan dipakai (server & client).
- Keputusan scope register admin-only.

---

### 2. Siapkan konfigurasi BetterAuth server
**Tujuan:** punya source of truth auth di server.

1. Buat/rapikan module `src/lib/auth/*` untuk inisialisasi BetterAuth.
2. Hubungkan ke koneksi DB Drizzle yang sudah ada.
3. Aktifkan email/password provider sesuai kebutuhan.
4. Gunakan env `BETTER_AUTH_SECRET` dan `BETTER_AUTH_URL` yang sudah disiapkan di Task 1.

**Kriteria kualitas:**
- Tidak ada hardcoded secret/url.
- Error env invalid tetap fail-fast.

---

### 3. Pasang route handler auth di App Router
**Tujuan:** endpoint auth BetterAuth aktif di `/api/auth/*`.

1. Buat route handler di `src/app/api/auth/*` sesuai pola BetterAuth terbaru.
2. Bind handler GET/POST sesuai kebutuhan library.
3. Pastikan endpoint dapat dipanggil dari client auth API.

---

### 4. Integrasikan client auth helper
**Tujuan:** form login/register di frontend memanggil API auth nyata.

1. Buat helper client auth di `src/lib/auth/*` (atau lokasi konvensi repo).
2. Expose fungsi login/logout/register sesuai API BetterAuth.
3. Pastikan error auth diteruskan ke UI (tidak silent fail).

---

### 5. Ganti flow login dari dummy ke BetterAuth
**Tujuan:** submit login benar-benar membuat session.

1. Temukan form login yang saat ini hanya toast.
2. Ganti handler submit menjadi call `signIn` BetterAuth.
3. Tampilkan pesan error validasi/auth secara jelas.
4. Setelah login sukses, redirect ke halaman dashboard target.

---

### 6. Sesuaikan flow register sesuai kebijakan admin-only
**Tujuan:** register tidak melanggar policy akses admin.

1. Terapkan kebijakan hasil keputusan scope:
   - jika register ditutup: nonaktifkan submit + tampilkan instruksi;
   - jika allowlist: validasi email terhadap aturan internal sebelum submit;
   - jika bootstrap-only: gate dengan env flag.
2. Pastikan UI register tidak misleading.

---

### 7. Tambahkan pengecekan session server-side untuk akses dashboard (baseline)
**Tujuan:** membuktikan session BetterAuth bisa dipakai untuk proteksi route.

1. Tambahkan helper `requireSession` (server-side) di layer auth.
2. Terapkan minimal pada titik masuk dashboard (layout/page guard sederhana).
3. User tanpa session diarahkan ke login.

> Guard yang lebih lengkap lintas route tetap dilanjutkan di **Task 5**.

---

### 8. Verifikasi skenario inti
**Tujuan:** memastikan acceptance criteria tercapai end-to-end.

1. Login valid → sukses masuk dashboard.
2. Login invalid → error tampil, tidak login.
3. Akses dashboard tanpa session → redirect/deny sesuai kebijakan.
4. Register flow sesuai kebijakan admin-only yang dipilih.
5. Jalankan `npm run check` dan `npm run build`.

---

## Definition of Done (DoD)
Task 4 dianggap selesai jika:
- Form login sudah terhubung BetterAuth dan tidak lagi dummy toast-only.
- Session benar-benar tersimpan dan dipakai untuk baseline proteksi dashboard.
- Register flow sudah konsisten dengan kebijakan admin-only (ditutup/terbatas/flagged).
- Tidak ada error TypeScript/lint/build setelah integrasi.

---

## Risiko Umum + Antisipasi
- **Risiko:** API BetterAuth berubah versi dan contoh lama tidak cocok.  
  **Antisipasi:** wajib ambil signature terbaru via Context7 sebelum implementasi.

- **Risiko:** register tetap terbuka ke publik tanpa sengaja.  
  **Antisipasi:** kunci policy admin-only sebagai acceptance gate sebelum merge.

- **Risiko:** UI login terlihat sukses tapi session tidak tersimpan.  
  **Antisipasi:** verifikasi akses route terproteksi dan cek server-side session retrieval.

- **Risiko:** error auth ditelan (silent failure).  
  **Antisipasi:** tampilkan error message eksplisit ke user, jangan fallback sukses palsu.

---

## Checklist Eksekusi Cepat (untuk junior/AI murah)
- [ ] Sudah ambil docs BetterAuth + Next.js + Drizzle via Context7 MCP.
- [ ] Konfigurasi BetterAuth server di `src/lib/auth/*` sudah aktif.
- [ ] Route handler `/api/auth/*` sudah tersedia dan bisa dipanggil.
- [ ] Form login tidak dummy lagi, sudah memanggil BetterAuth.
- [ ] Session dipakai untuk baseline proteksi dashboard.
- [ ] Register flow sudah sesuai kebijakan admin-only.
- [ ] `npm run check` dan `npm run build` sukses.
