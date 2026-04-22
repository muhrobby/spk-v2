# Design Doc: Send Ranking ke Email via n8n

## 1) Ringkasan

Fitur ini menambahkan aksi kirim hasil ranking SPK dari halaman Dashboard ke email tujuan melalui webhook n8n.

Keputusan yang sudah dikunci:

- Integrasi memakai **Opsi 1**: Next.js Server Action langsung mengirim payload ke webhook n8n.
- Format kirim dari app ke n8n adalah **JSON ranking** (bukan CSV).
- Input penerima email hanya **1 email**.
- Alur kirim **sinkron**: UI menunggu respons n8n.
- Webhook n8n **tanpa auth dulu** (khusus dev/internal).

## 2) Tujuan dan Non-Tujuan

### Tujuan

- Menyediakan tombol `Kirim ke Email` setelah ranking ditampilkan.
- Menyediakan dialog input email tujuan.
- Mengirim payload ranking JSON ke n8n secara sinkron.
- Menampilkan feedback sukses/gagal yang jelas di UI.

### Non-Tujuan (fase ini)

- Multi-recipient email.
- Lampiran dibentuk di aplikasi Next.js.
- Retry queue/background job di sisi aplikasi.
- Hardening webhook production (token/signature/IP allowlist).

## 3) Kondisi Saat Ini

- Halaman ranking ada di `src/app/(main)/dashboard/page.tsx`.
- Tombol utama saat ini hanya `Tampilkan Ranking`.
- Tabel ranking dirender oleh `src/app/(main)/dashboard/_components/spk-ranking-table.tsx`.
- Perhitungan ranking dilakukan server-side oleh `src/actions/spk.ts` melalui `getSpkRanking`.

## 4) Arsitektur Usulan

### Komponen utama

1. **Dashboard UI (client area)**
   - Menampilkan tombol `Kirim ke Email` saat data ranking tersedia.
   - Membuka dialog untuk input email.

2. **Server Action Email Dispatch**
   - Menerima `periode` + `recipientEmail`.
   - Validasi input dan session.
   - Re-fetch ranking dari server (`getSpkRanking`) sebagai trust boundary.
   - POST payload JSON ke `N8N_RANKING_WEBHOOK_URL`.
   - Return hasil sukses/gagal terstruktur ke client.

3. **n8n workflow**
   - Menerima JSON ranking.
   - Generate CSV dari `ranking.rows`.
   - Kirim email dengan lampiran CSV.
   - Kembalikan HTTP response untuk alur sinkron.

### Alur data

1. User klik `Tampilkan Ranking`.
2. Ranking tampil di halaman.
3. User klik `Kirim ke Email` dan isi email.
4. Client submit ke Server Action.
5. Server Action validasi + ambil ranking terbaru dari server.
6. Server Action kirim payload JSON ke n8n dan menunggu respons.
7. UI menampilkan status sukses/gagal berdasarkan respons action.

## 5) Kontrak Data App -> n8n

### Payload (v1)

```json
{
  "version": "1.0",
  "requestedAt": "2026-04-22T08:30:12.511Z",
  "requestedBy": {
    "userId": "usr_xxx",
    "email": "operator@example.com"
  },
  "recipientEmail": "penerima@example.com",
  "ranking": {
    "periode": "2026-04",
    "generatedAt": "2026-04-22T08:30:12.511Z",
    "rows": [
      {
        "peringkat": 1,
        "storeId": 7,
        "namaToko": "Toko A",
        "skorC1": 5,
        "skorC2": 4,
        "skorC3": 5,
        "nilaiAkhir": 4.56
      }
    ]
  }
}
```

### Respons yang diharapkan dari n8n

Sukses (`2xx`):

```json
{
  "success": true,
  "message": "Email ranking berhasil dikirim"
}
```

Gagal bisnis (`4xx/5xx`):

```json
{
  "success": false,
  "message": "Gagal mengirim email"
}
```

Catatan:

- Server Action hanya mengandalkan status HTTP + message aman untuk user.
- Jika `2xx` tetapi body menyatakan `success: false`, perlakukan sebagai gagal bisnis.
- Detail internal n8n tidak ditampilkan mentah ke UI.

## 6) Validasi dan Error Handling

### Boundary validation di Server Action

- `periode`: pakai `periodeSchema` existing.
- `recipientEmail`: `z.string().email()`.
- Session wajib ada (`getAuthSession`).
- Data ranking wajib `success = true` dan `rows.length > 0`.

### Pemetaan error ke pesan UI

- Input invalid -> `Email atau periode tidak valid.`
- Session invalid -> pesan session required existing.
- Ranking kosong -> `Tidak ada data ranking untuk periode ini.`
- Env webhook belum diisi -> `Konfigurasi webhook belum tersedia.`
- Timeout/network -> `Gagal menghubungi layanan email.`
- Respons non-2xx -> `Pengiriman ditolak oleh layanan automasi.`
- Respons 2xx tapi `success: false` -> `Pengiriman gagal diproses oleh automasi.`

## 7) Desain UI/UX

### Penempatan aksi

- Tombol `Kirim ke Email` hanya ditampilkan saat ranking tersedia (`hasData = true`).
- Lokasi: area aksi di card Dashboard SPK dekat filter periode.

### Dialog kirim email

- Input tunggal: `Email tujuan`.
- Info readonly:
  - Periode aktif.
  - Jumlah data ranking.
- Tombol:
  - `Kirim` (primary)
  - `Batal` (secondary)

### State sinkron

- Saat submit: tampilkan loading (`Mengirim...`) dan disable aksi.
- Sukses: dialog ditutup + tampil feedback sukses.
- Gagal: dialog tetap terbuka + tampil pesan error agar user bisa retry.

## 8) Rencana Perubahan File

### Create

- `src/actions/spk-email.ts`
  - Server Action `sendSpkRankingToEmail`.
  - Zod schema input.
  - POST sinkron ke webhook n8n.

- `src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx`
  - Client component trigger + dialog + submit flow.

### Modify

- `src/app/(main)/dashboard/page.tsx`
  - Render komponen `SendRankingEmailDialog` saat `hasData`.
  - Pass `periode` dan `rowsCount`.

- `.env.example`
  - Tambah `N8N_RANKING_WEBHOOK_URL=`.

## 9) Konfigurasi Environment

Variabel baru:

```bash
N8N_RANKING_WEBHOOK_URL=
```

Jika belum diisi, action harus fail fast dengan pesan konfigurasi.

## 10) Rekomendasi Workflow n8n (fase awal)

1. Webhook trigger menerima payload JSON.
2. Function/Code node transform `ranking.rows` -> CSV.
3. Email node (Gmail SMTP) kirim email + lampiran CSV.
4. Respond to Webhook node mengembalikan JSON sukses/gagal.

Catatan provider email:

- Dev cepat: Gmail.
- Production: provider SMTP dedicated (Resend/Brevo/SendGrid/Mailgun).

## 11) Security Notes

Fase ini menerima webhook tanpa auth berdasarkan keputusan saat desain.

Posisi CSRF pada desain ini:

- Mutasi dipicu dari Server Action di aplikasi sendiri (same-origin), bukan endpoint publik browser -> n8n.
- Browser tidak mengakses webhook n8n secara langsung; request ke n8n dilakukan server-to-server.

Risk yang disadari:

- Endpoint n8n bisa dipanggil pihak lain bila URL diketahui.

Mitigasi fase berikutnya (wajib sebelum production):

- Tambah header token (`X-Webhook-Token`) atau signature.
- Batasi source IP/reverse proxy allowlist.
- Tambah rate limit di sisi n8n/edge.

## 12) Acceptance Criteria

- User dapat klik `Tampilkan Ranking`, lalu melihat opsi `Kirim ke Email` saat data ada.
- User dapat mengisi satu email valid dan submit.
- App mengirim payload JSON ranking ke webhook n8n.
- UI menunggu hasil sinkron dan menampilkan status sukses/gagal.
- Tidak ada kebocoran detail error internal n8n ke user.

## 13) Verifikasi

### Manual scenarios

- Skenario sukses kirim email.
- Email invalid.
- Periode tanpa ranking.
- Webhook URL kosong.
- Webhook timeout/non-2xx.

### Command verification

```bash
npm run check
npm run build
```

## 14) Open Follow-up (Post-MVP)

- Tambah auth webhook.
- Tambah multi-recipient.
- Tambah retry mechanism + idempotency key.
- Tambah audit log pengiriman email.
