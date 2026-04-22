# Issue Task 5 — Route Protection dan Guard Dashboard

## Tujuan
Memastikan seluruh area dashboard hanya bisa diakses user yang sudah login, dengan alur redirect yang konsisten (login/unauthorized) dan tidak bergantung pada proteksi UI saja.

## Acceptance Criteria (Target Akhir)
- Route dashboard hanya dapat diakses user terautentikasi.
- User tanpa akses diarahkan ke halaman login/unauthorized sesuai kebijakan.
- Navigasi auth → dashboard berjalan konsisten.

## Dependency
**Task 4** harus sudah selesai (BetterAuth login + session sudah aktif).

## File yang Kemungkinan Diubah
- `src/proxy.ts` (enable jika dipilih)
- `src/app/(main)/dashboard/layout.tsx`
- Helper auth server (mis. `src/lib/auth/session.ts`)
- Halaman unauthorized/login (hanya jika perlu sinkronisasi redirect UX)

---

## Catatan Wajib: Skill dan MCP yang Harus Dipakai

### Skill relevan (wajib diprioritaskan)
1. `better-auth-best-practices` — cara benar membaca session BetterAuth di server.
2. `nextjs-app-router-patterns` — pola guard di App Router (layout, redirect, proxy).
3. `security-and-hardening` — cegah akses tidak sah, hindari bypass via URL langsung.
4. `backend-patterns` — konsistensi boundary auth check server-side.
5. `source-driven-development` — implementasi harus sesuai docs resmi BetterAuth/Next.js.
6. `planning-and-task-breakdown` — scope Task 5 fokus proteksi route + navigasi.

### MCP relevan (wajib dipakai)
1. **Context7 MCP**:
   - BetterAuth: `getSession` server-side pattern.
   - Next.js App Router: redirect/guard via server component dan proxy/middleware pattern.
2. **IDE diagnostics MCP**:
   - cek error TypeScript setelah menambah proxy/guard helper.

> Jangan mengandalkan asumsi behavior cookie/session. Ambil pola final dari docs resmi via Context7.

---

## Keputusan Scope yang Wajib Ditetapkan Dulu
Sebelum implementasi, tetapkan policy akses berikut:

1. **Unauthenticated → Login**  
   Akses `/dashboard*` tanpa session harus redirect ke halaman login.
2. **Authenticated → Dashboard**  
   User yang sudah login dan membuka halaman login/register sebaiknya diarahkan ke dashboard default.
3. **Unauthorized page**  
   Gunakan `/unauthorized` untuk kasus “sudah login tapi tidak punya role/permission” (siapkan hook, walau role penuh bisa dilanjut di task berikutnya).

---

## Rencana Implementasi Bertahap (untuk junior/AI murah)

### 1. Kunci referensi resmi guard pattern
**Tujuan:** pilih pola guard yang stabil dan sesuai stack saat ini.

1. Query Context7 untuk:
   - BetterAuth server-side session retrieval.
   - Next.js App Router route protection (layout/proxy).
2. Tetapkan strategi guard:
   - **Minimal:** guard di dashboard layout.
   - **Rekomendasi:** kombinasi proxy + layout guard (defense in depth).

**Output tahap ini:**
- Policy redirect yang jelas.
- Keputusan apakah `src/proxy.ts` diaktifkan.

---

### 2. Standarisasi helper auth server
**Tujuan:** satu pintu untuk baca session dan enforce akses.

1. Pastikan helper `getAuthSession` dan `requireAuthSession` tersedia di layer `src/lib/auth/*`.
2. Tambahkan helper opsional untuk redirect login dengan callback URL (agar UX kembali ke halaman semula jika dibutuhkan).
3. Hindari logic guard tersebar di banyak file tanpa helper bersama.

---

### 3. Implement proteksi global via `src/proxy.ts` (jika dipilih)
**Tujuan:** blok akses lebih awal sebelum masuk rendering dashboard.

1. Tambahkan matcher untuk route privat (`/dashboard/:path*`).
2. Jika tidak ada session valid:
   - redirect ke login.
3. Jika ada session:
   - lanjutkan request.
4. (Opsional) Route auth (`/auth/*`) diarahkan ke dashboard bila user sudah login.

**Catatan:** tetap pertahankan guard di layout sebagai lapisan kedua.

---

### 4. Perkuat guard di dashboard layout
**Tujuan:** memastikan proteksi tetap aktif walau proxy tidak match edge case tertentu.

1. Di `src/app/(main)/dashboard/layout.tsx`, panggil helper guard server-side di awal render.
2. Jika session tidak ada:
   - redirect ke login.
3. Jika session ada:
   - render dashboard normal.

---

### 5. Sinkronkan navigasi auth ↔ dashboard
**Tujuan:** alur user tidak membingungkan.

1. Setelah login sukses, redirect konsisten ke dashboard default.
2. Akses halaman auth saat sudah login:
   - redirect ke dashboard (hindari loop/login ulang yang tidak perlu).
3. Jika ada kasus unauthorized:
   - arahkan ke `/unauthorized` dengan pesan yang konsisten.

---

### 6. Verifikasi skenario akses utama
**Tujuan:** acceptance criteria terbukti secara fungsional.

1. User belum login buka `/dashboard` → redirect ke login.
2. User login valid → bisa masuk dashboard.
3. User login lalu refresh/reopen tab dashboard → tetap bisa akses (session terbaca).
4. User logout lalu akses dashboard lagi → kembali ke login.
5. Jalankan `npm run check` dan `npm run build`.

---

## Checkpoint B (Access)
- Alur autentikasi admin berjalan dari login sampai akses dashboard terlindungi.

---

## Definition of Done (DoD)
Task 5 dianggap selesai jika:
- Semua route dashboard privat terlindungi dari user tanpa session.
- Redirect untuk unauthenticated/unauthorized berjalan sesuai policy.
- Navigasi login → dashboard konsisten dan tidak loop.
- Tidak ada error TypeScript/lint/build setelah perubahan guard.

---

## Risiko Umum + Antisipasi
- **Risiko:** guard hanya di client, sehingga URL langsung masih bisa bypass.  
  **Antisipasi:** semua check akses dilakukan server-side (proxy/layout/helper).

- **Risiko:** redirect loop antara auth page dan dashboard.  
  **Antisipasi:** tetapkan aturan satu arah yang eksplisit untuk authenticated vs unauthenticated.

- **Risiko:** perbedaan behavior antara proxy dan layout guard.  
  **Antisipasi:** samakan helper session dan policy redirect di satu source of truth.

- **Risiko:** unauthorized dan unauthenticated tercampur.  
  **Antisipasi:** pisahkan tujuan redirect: login untuk belum auth, unauthorized untuk sudah auth tapi tidak berizin.

---

## Checklist Eksekusi Cepat (untuk junior/AI murah)
- [ ] Sudah ambil docs BetterAuth + Next.js guard pattern via Context7 MCP.
- [ ] Policy redirect (login/unauthorized) sudah ditetapkan jelas.
- [ ] `src/proxy.ts` diaktifkan (jika dipilih) dengan matcher route dashboard.
- [ ] Guard server-side di dashboard layout aktif.
- [ ] Navigasi auth → dashboard konsisten setelah login.
- [ ] Skenario akses utama sudah diuji.
- [ ] `npm run check` dan `npm run build` sukses.
