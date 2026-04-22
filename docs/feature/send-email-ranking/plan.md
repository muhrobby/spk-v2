# Send Ranking Email via n8n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur kirim hasil ranking SPK ke 1 email tujuan dari halaman Dashboard, dengan payload JSON yang dikirim sinkron ke webhook n8n.

**Architecture:** UI Dashboard menampilkan tombol `Kirim ke Email` saat ranking tersedia. Tombol membuka dialog untuk input email, lalu submit ke Server Action baru yang validasi session + input, mengambil ulang ranking dari server, dan mengirim payload JSON ke n8n webhook secara sinkron. n8n bertanggung jawab membuat CSV dan mengirim email.

**Tech Stack:** Next.js 16 App Router, React 19 Client Components, Server Actions, Zod 4, Better Auth session, Sonner, shadcn/ui Dialog/Button/Input/Alert, npm, Biome.

---

## Penting: Gunakan Skill Ini

I'm using the writing-plans skill to create the implementation plan.

---

## Scope Lock (Jangan Dilanggar)

- In scope:
  - Tambah Server Action khusus kirim ranking ke webhook n8n.
  - Tambah dialog email di Dashboard SPK.
  - Integrasi UI Dashboard agar tombol kirim muncul hanya saat ranking ada.
  - Tambah env var `N8N_RANKING_WEBHOOK_URL` di `.env.example`.

- Out of scope:
  - Multi-recipient email.
  - Route Handler API baru (`/api/*`) untuk fitur ini.
  - Auth webhook n8n production (token/signature) di fase ini.
  - Perubahan formula ranking SPK.
  - Perubahan fitur Input Kinerja, Data Toko, Pengaturan Bobot.

---

## Dampak ke Fitur Lain (Wajib Dipahami sebelum Koding)

Fitur yang disentuh langsung:

1. `/dashboard` (halaman ranking SPK)
2. `src/actions` (penambahan action baru)
3. `.env.example` (penambahan konfigurasi)

Fitur yang **tidak boleh berubah perilakunya**:

1. `/dashboard/input-kinerja` (manual + upload CSV)
2. `/dashboard/data-toko`
3. `/dashboard/pengaturan-bobot`
4. Engine ranking `getSpkRanking` di `src/actions/spk.ts`

Risiko jika salah implementasi:

- Jika kirim data ranking dari client (bukan re-fetch server), data bisa tidak konsisten.
- Jika edit `src/actions/spk.ts` sembarangan, ranking bisa berubah dan merusak hasil bisnis.
- Jika ubah `src/lib/validation/common.ts` tanpa hati-hati, pesan validasi fitur lain bisa regress.

Guardrails anti-bug lintas fitur:

- Buat file action baru (`spk-email.ts`), jangan menumpuk logic di `spk.ts`.
- Jangan ubah logic kalkulasi SAW di `spk.ts`.
- Jangan ubah action existing: `performance.ts`, `stores.ts`, `weights.ts`.
- Jalankan regresi manual lintas menu setelah implementasi.

---

## File Map dan Tanggung Jawab

### Create

- `src/actions/spk-email.ts`
  - Server Action kirim ranking ke webhook n8n.
  - Validasi `periode` + `recipientEmail`.
  - Re-fetch ranking dari server.
  - Error mapping sinkron ke hasil UI.

- `src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx`
  - Trigger button + dialog input email.
  - Submit ke `sendSpkRankingToEmail`.
  - Menangani state loading/success/error.

### Modify

- `src/app/(main)/dashboard/page.tsx`
  - Tambahkan render tombol/dialog kirim email saat `hasData`.
  - Pertahankan flow `Tampilkan Ranking` yang sudah ada.

- `.env.example`
  - Tambah `N8N_RANKING_WEBHOOK_URL`.

### Keep Unchanged

- `src/actions/spk.ts` (kalkulasi ranking dan type rows)
- `src/actions/performance.ts`
- `src/actions/stores.ts`
- `src/actions/weights.ts`
- `src/components/ui/*`

---

## Kontrak Payload yang Harus Diikuti

Payload ke n8n (app -> webhook):

```json
{
  "version": "1.0",
  "requestedAt": "2026-04-22T08:30:12.511Z",
  "requestedBy": {
    "userId": "1",
    "email": "admin@example.com"
  },
  "recipientEmail": "recipient@example.com",
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

Aturan respons:

- `HTTP 2xx` + `body.success !== false` => sukses.
- `HTTP 2xx` + `body.success === false` => gagal bisnis.
- `HTTP non-2xx` => gagal integrasi.
- timeout/network => gagal integrasi.

---

## Task 0: Pre-flight dan Scope Lock

**Files (read only):**

- `docs/feature/send-email-ranking/specs.md`
- `src/app/(main)/dashboard/page.tsx`
- `src/actions/spk.ts`
- `.env.example`

**Acceptance criteria:**

- Pengerja paham bahwa fitur baru ini tidak boleh mengubah formula ranking.
- Pengerja paham bahwa workflow email sinkron berjalan via Server Action, bukan API route baru.

- [ ] **Step 1: Validasi script verifikasi yang tersedia**

Jalankan:

```bash
npm run check --help
```

Expected:

```text
Command npm check dikenali. Tidak perlu menjalankan full check di step ini.
```

- [ ] **Step 2: Baca spec yang sudah disetujui**

Fokus baca:

```text
- keputusan final: server action, 1 email, JSON payload, sinkron, no auth webhook (dev only)
- payload contract app -> n8n
- mapping error UI
```

- [ ] **Step 3: Lock scope sebelum coding**

Checklist wajib bernilai "ya":

```text
[ ] Saya tidak akan mengubah formula/rule ranking di src/actions/spk.ts
[ ] Saya tidak akan menambah API route baru untuk fitur ini
[ ] Saya tidak akan mengubah fitur input-kinerja/data-toko/pengaturan-bobot
[ ] Saya hanya akan membuat 2 file baru + modifikasi 2 file existing
```

---

## Task 1: Buat Server Action Integrasi n8n

**Files:**

- Create: `src/actions/spk-email.ts`

**Kenapa task ini ada:**

Semua boundary penting (auth, validasi input, integrasi webhook, mapping error) harus terjadi di server agar aman dan konsisten.

**Acceptance criteria:**

- Action memvalidasi session + input.
- Action re-fetch ranking dari server berdasarkan `periode`.
- Action kirim payload JSON ke n8n secara sinkron dengan timeout.
- Action mengembalikan pesan user-friendly tanpa membocorkan detail internal webhook.

- [ ] **Step 1: Buat file action baru dengan isi lengkap berikut**

Tambahkan file `src/actions/spk-email.ts`:

```ts
"use server";

import { z } from "zod";

import { getSpkRanking } from "@/actions/spk";
import { getAuthSession } from "@/lib/auth/session";
import { firstIssueMessage, periodeSchema, VALIDATION_MESSAGES } from "@/lib/validation/common";

const N8N_TIMEOUT_MS = 15_000;

const sendSpkRankingToEmailSchema = z.object({
  periode: periodeSchema,
  recipientEmail: z.string().trim().email("Alamat email tujuan tidak valid."),
});

type SendSpkRankingToEmailInput = z.infer<typeof sendSpkRankingToEmailSchema>;

export type SendSpkRankingToEmailResult = {
  success: boolean;
  message: string;
};

type N8nResponseBody = {
  success?: unknown;
  message?: unknown;
};

type N8nRankingPayload = {
  version: "1.0";
  requestedAt: string;
  requestedBy: {
    userId: string | null;
    email: string | null;
  };
  recipientEmail: string;
  ranking: {
    periode: string;
    generatedAt: string;
    rows: Array<{
      peringkat: number;
      storeId: number;
      namaToko: string;
      skorC1: number;
      skorC2: number;
      skorC3: number;
      nilaiAkhir: number;
    }>;
  };
};

type SessionLike = {
  user?: {
    id?: unknown;
    email?: unknown;
  };
  session?: {
    userId?: unknown;
  };
};

function getWebhookUrl(): string | null {
  const value = process.env.N8N_RANKING_WEBHOOK_URL;
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readResponseMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const message = (body as N8nResponseBody).message;
  if (typeof message !== "string") {
    return null;
  }

  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readResponseSuccess(body: unknown): boolean | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const success = (body as N8nResponseBody).success;
  return typeof success === "boolean" ? success : null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function toRequestedBy(session: SessionLike) {
  const sessionUserId = session.session?.userId;
  const userId =
    typeof sessionUserId === "string" || typeof sessionUserId === "number" ? String(sessionUserId) : null;

  const email = typeof session.user?.email === "string" ? session.user.email : null;

  return {
    userId,
    email,
  };
}

export async function sendSpkRankingToEmail(
  input: SendSpkRankingToEmailInput,
): Promise<SendSpkRankingToEmailResult> {
  const session = await getAuthSession();
  if (!session) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.sessionRequired,
    };
  }

  const parsed = sendSpkRankingToEmailSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: firstIssueMessage(parsed.error, "Input pengiriman email tidak valid."),
    };
  }

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: "Konfigurasi webhook belum tersedia. Hubungi admin aplikasi.",
    };
  }

  const rankingResult = await getSpkRanking({ periode: parsed.data.periode });
  if (!rankingResult.success) {
    return {
      success: false,
      message: rankingResult.message,
    };
  }

  if (rankingResult.rows.length === 0 || !rankingResult.periode) {
    return {
      success: false,
      message: "Tidak ada data ranking untuk periode ini.",
    };
  }

  const nowIso = new Date().toISOString();
  const payload: N8nRankingPayload = {
    version: "1.0",
    requestedAt: nowIso,
    requestedBy: toRequestedBy(session as SessionLike),
    recipientEmail: parsed.data.recipientEmail,
    ranking: {
      periode: rankingResult.periode,
      generatedAt: nowIso,
      rows: rankingResult.rows.map((row) => ({
        peringkat: row.peringkat,
        storeId: row.storeId,
        namaToko: row.namaToko,
        skorC1: row.skorC1,
        skorC2: row.skorC2,
        skorC3: row.skorC3,
        nilaiAkhir: row.nilaiAkhir,
      })),
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    let responseBody: unknown = null;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      return {
        success: false,
        message: "Pengiriman ditolak oleh layanan automasi.",
      };
    }

    const webhookSuccess = readResponseSuccess(responseBody);
    if (webhookSuccess === false) {
      return {
        success: false,
        message: readResponseMessage(responseBody) ?? "Pengiriman gagal diproses oleh automasi.",
      };
    }

    return {
      success: true,
      message: readResponseMessage(responseBody) ?? "Permintaan kirim email ranking berhasil diteruskan.",
    };
  } catch (error) {
    if (isAbortError(error)) {
      return {
        success: false,
        message: "Gagal menghubungi layanan email.",
      };
    }

    return {
      success: false,
      message: "Gagal menghubungi layanan email.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
```

- [ ] **Step 2: Jalankan check parsial untuk file action baru**

Jalankan:

```bash
npx @biomejs/biome check "src/actions/spk-email.ts"
```

Expected:

```text
No diagnostics found.
```

- [ ] **Step 3: Lakukan sanity check TypeScript dengan build cepat nanti (jangan skip)**

Catatan:

```text
- Proyek ini tidak punya script typecheck terpisah.
- Validasi kompilasi TypeScript dilakukan saat npm run build di Task verifikasi.
```

- [ ] **Step 4: Commit checkpoint task action (opsional tapi direkomendasikan)**

```bash
git add "src/actions/spk-email.ts"
git commit -m "feat: add server action to dispatch ranking email webhook"
```

---

## Task 2: Buat Komponen Dialog Kirim Email (Client)

**Files:**

- Create: `src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx`

**Kenapa task ini ada:**

UX butuh interaksi dialog yang jelas: input email, info periode, jumlah baris ranking, loading sinkron, dan feedback error/sukses.

**Acceptance criteria:**

- Tombol `Kirim ke Email` ada sebagai trigger dialog.
- Input hanya 1 email.
- Submit memanggil Server Action sinkron.
- Saat gagal, dialog tetap terbuka dan menampilkan pesan error.

- [ ] **Step 1: Buat file komponen dengan isi lengkap berikut**

Tambahkan `src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx`:

```tsx
"use client";

import { useState } from "react";

import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { sendSpkRankingToEmail } from "@/actions/spk-email";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SendRankingEmailDialogProps = {
  periode: string;
  rowsCount: number;
};

const emailSchema = z.string().trim().email("Masukkan alamat email yang valid.");

export function SendRankingEmailDialog({ periode, rowsCount }: SendRankingEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = !isSubmitting && email.trim().length > 0 && rowsCount > 0;

  function resetState() {
    setEmail("");
    setFormError(null);
    setIsSubmitting(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      setFormError(parsedEmail.error.issues[0]?.message ?? "Masukkan alamat email yang valid.");
      return;
    }

    setIsSubmitting(true);
    const result = await sendSpkRankingToEmail({
      periode,
      recipientEmail: parsedEmail.data,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.message);
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setOpen(false);
    resetState();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary" disabled={rowsCount === 0}>
          <Mail className="mr-1.5 size-4" />
          Kirim ke Email
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kirim Ranking ke Email</DialogTitle>
          <DialogDescription>
            Data ranking akan dikirim ke workflow n8n untuk dibuatkan file CSV dan diteruskan ke email tujuan.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" noValidate onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs">Periode</p>
              <p className="font-medium">{periode}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Jumlah Data Ranking</p>
              <p className="font-medium">{rowsCount.toLocaleString("id-ID")}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="recipient-email" className="font-medium text-sm">
              Email tujuan
            </label>
            <Input
              id="recipient-email"
              name="recipientEmail"
              type="email"
              placeholder="contoh@domain.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-muted-foreground text-xs">Fase ini mendukung 1 email tujuan per pengiriman.</p>
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Jalankan check parsial komponen dialog**

Jalankan:

```bash
npx @biomejs/biome check "src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx"
```

Expected:

```text
No diagnostics found.
```

- [ ] **Step 3: Commit checkpoint task UI dialog (opsional tapi direkomendasikan)**

```bash
git add "src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx"
git commit -m "feat: add ranking email dialog component"
```

---

## Task 3: Integrasikan Dialog ke Halaman Dashboard SPK

**Files:**

- Modify: `src/app/(main)/dashboard/page.tsx`

**Kenapa task ini ada:**

Agar tombol `Kirim ke Email` muncul hanya dalam konteks yang benar: saat ranking berhasil dihitung dan memiliki data.

**Acceptance criteria:**

- Tombol `Tampilkan Ranking` tetap berfungsi seperti sebelumnya.
- Tombol `Kirim ke Email` hanya muncul saat `hasData` true.
- Tidak ada perubahan ke rendering tabel ranking selain penambahan action.

- [ ] **Step 1: Tambah import komponen baru**

Tambahkan import ini pada `src/app/(main)/dashboard/page.tsx`:

```tsx
import { SendRankingEmailDialog } from "./_components/send-ranking-email-dialog";
```

- [ ] **Step 2: Bungkus area aksi jadi flex container, lalu render dialog kondisional**

Ganti blok form lama:

```tsx
<form className="flex flex-wrap items-end gap-3" method="get">
  <div className="space-y-1.5">
    <label htmlFor="periode" className="font-medium text-sm">
      Periode
    </label>
    <Input id="periode" name="periode" type="month" defaultValue={periode} className="w-[180px]" />
  </div>
  <Button type="submit">Tampilkan Ranking</Button>
</form>
```

dengan blok ini:

```tsx
<div className="flex flex-wrap items-end gap-3">
  <form className="flex flex-wrap items-end gap-3" method="get">
    <div className="space-y-1.5">
      <label htmlFor="periode" className="font-medium text-sm">
        Periode
      </label>
      <Input id="periode" name="periode" type="month" defaultValue={periode} className="w-[180px]" />
    </div>
    <Button type="submit">Tampilkan Ranking</Button>
  </form>

  {hasData && <SendRankingEmailDialog periode={periode} rowsCount={rankingResult.rows.length} />}
</div>
```

Alasan struktur ini:

```text
- Tombol dialog bukan bagian submit form periode.
- UX tetap jelas: cari ranking dulu, lalu aksi kirim email tersedia jika data ada.
```

- [ ] **Step 3: Jalankan check parsial file page dashboard**

Jalankan:

```bash
npx @biomejs/biome check "src/app/(main)/dashboard/page.tsx"
```

Expected:

```text
No diagnostics found.
```

- [ ] **Step 4: Commit checkpoint integrasi page (opsional tapi direkomendasikan)**

```bash
git add "src/app/(main)/dashboard/page.tsx"
git commit -m "feat: show send ranking email action on dashboard"
```

---

## Task 4: Tambahkan Konfigurasi Environment

**Files:**

- Modify: `.env.example`

**Kenapa task ini ada:**

Agar integrasi n8n tidak hardcoded dan bisa dikonfigurasi per environment.

**Acceptance criteria:**

- Ada variabel `N8N_RANKING_WEBHOOK_URL` di `.env.example`.
- Ada keterangan singkat bahwa ini webhook dev/internal untuk fase tanpa auth.

- [ ] **Step 1: Tambahkan blok env baru di akhir `.env.example`**

Tambahkan baris berikut:

```env
# n8n Webhook for send ranking email (DEV/internal phase, no auth)
# Example local n8n: http://localhost:5678/webhook/send-ranking-email
N8N_RANKING_WEBHOOK_URL=
```

- [ ] **Step 2: Jalankan sanity check file env (manual)**

Checklist:

```text
[ ] Tidak mengubah variabel env lama
[ ] Tidak menghapus komentar existing
[ ] Penambahan berada di bagian akhir agar mudah ditemukan
```

- [ ] **Step 3: Commit checkpoint env update (opsional)**

```bash
git add ".env.example"
git commit -m "chore: add n8n ranking webhook env example"
```

---

## Task 5: Verifikasi Fungsional + Regresi Lintas Fitur

**Files (verify):**

- `src/actions/spk-email.ts`
- `src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx`
- `src/app/(main)/dashboard/page.tsx`
- `.env.example`

**Acceptance criteria:**

- Verifikasi `npm run check` dan `npm run build` lolos.
- Flow kirim email sinkron bekerja sesuai skenario sukses/gagal.
- Tidak ada regresi di fitur lain.

- [ ] **Step 1: Jalankan full static checks**

Jalankan:

```bash
npm run check
```

Expected:

```text
Biome check selesai tanpa error.
```

Jika gagal:

```text
- perbaiki hanya file yang diubah oleh fitur ini
- jangan refactor file lain yang tidak terkait
```

- [ ] **Step 2: Jalankan production build**

Jalankan:

```bash
npm run build
```

Expected:

```text
Build Next.js selesai sukses tanpa type/runtime compile error.
```

- [ ] **Step 3: Siapkan n8n minimal untuk QA sinkron**

Checklist n8n:

```text
[ ] Webhook aktif dan menerima POST JSON
[ ] Workflow mengembalikan response JSON success/message
[ ] (Opsional) Kirim email sungguhan via Gmail SMTP
```

- [ ] **Step 4: Verifikasi skenario sukses utama di `/dashboard`**

Checklist manual:

```text
[ ] Pilih periode dengan data ranking
[ ] Klik Tampilkan Ranking
[ ] Tombol Kirim ke Email muncul
[ ] Isi email valid
[ ] Klik Kirim -> tombol berubah "Mengirim..."
[ ] Setelah response 2xx sukses, dialog tertutup
[ ] Toast sukses muncul
```

- [ ] **Step 5: Verifikasi skenario error boundary**

Checklist manual:

```text
[ ] Email invalid -> tampil error validasi, request tidak dikirim
[ ] Periode tanpa data ranking -> action return "Tidak ada data ranking..."
[ ] Env webhook kosong -> action return error konfigurasi
[ ] Webhook timeout -> action return "Gagal menghubungi layanan email."
[ ] Webhook non-2xx -> action return "Pengiriman ditolak oleh layanan automasi."
[ ] Webhook 2xx tapi success:false -> action return gagal bisnis
```

- [ ] **Step 6: Verifikasi anti-regresi fitur lain (wajib, jangan skip)**

Checklist manual:

```text
[ ] /dashboard/input-kinerja terbuka normal
[ ] Dialog Upload CSV tetap bisa dibuka
[ ] Form Input Manual tetap bisa dibuka dan submit normal
[ ] /dashboard/data-toko terbuka normal
[ ] /dashboard/pengaturan-bobot terbuka normal
```

Catatan penting:

```text
Walau file fitur lain tidak diubah, build/global import error bisa tetap merusak halaman lain.
Makanya smoke test lintas menu wajib dilakukan.
```

- [ ] **Step 7: Final diff sanity check (hanya file yang diharapkan)**

Jalankan:

```bash
git diff --name-only
```

Expected file list (implementasi, tanpa file lain):

```text
src/actions/spk-email.ts
src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx
src/app/(main)/dashboard/page.tsx
.env.example
docs/feature/send-email-ranking/plan.md
```

Jika ada file lain:

```text
- stop dulu
- audit kenapa file itu berubah
- keluarkan dari commit jika tidak relevan
```

---

## Definition of Done

Pekerjaan dinyatakan selesai hanya jika semua poin ini terpenuhi:

```text
[ ] Server Action sendSpkRankingToEmail tersedia dan tervalidasi
[ ] Dialog kirim email muncul di Dashboard saat ranking ada
[ ] Pengiriman sinkron ke n8n berjalan sesuai kontrak JSON
[ ] Pesan error user-friendly untuk semua skenario gagal utama
[ ] .env.example memuat N8N_RANKING_WEBHOOK_URL
[ ] npm run check lolos
[ ] npm run build lolos
[ ] Smoke test lintas fitur dashboard lolos
```

---

## Rollback Plan (Jika Terjadi Masalah)

Urutan rollback aman:

1. Hapus render `SendRankingEmailDialog` dari `src/app/(main)/dashboard/page.tsx`.
2. Hapus file `src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx`.
3. Hapus file `src/actions/spk-email.ts`.
4. Hapus `N8N_RANKING_WEBHOOK_URL` dari `.env.example` jika perlu rollback penuh.

Dampak rollback:

- Fitur Dashboard kembali seperti semula (hanya tampil ranking).
- Fitur lain tidak terdampak karena tidak ada schema/database migration.

---

## Suggested Final Commit (Jika dikerjakan tanpa checkpoint)

```bash
git add "src/actions/spk-email.ts" "src/app/(main)/dashboard/_components/send-ranking-email-dialog.tsx" "src/app/(main)/dashboard/page.tsx" ".env.example" "docs/feature/send-email-ranking/plan.md"
git commit -m "feat: add dashboard ranking email dispatch via n8n webhook"
```

---

## Catatan untuk Junior Programmer / AI Cost-Efficient Worker

- Ikuti task berurutan dari Task 0 sampai Task 5, jangan lompat.
- Jangan improvisasi arsitektur baru (misalnya bikin `/api/send-email`) karena scope sudah dikunci.
- Jangan memindahkan kalkulasi ranking ke client.
- Kalau bingung, pilih solusi paling kecil yang memenuhi acceptance criteria.
- Jika muncul ide "sekalian refactor" file lain, **jangan lakukan** pada task ini.

---

## Referensi Teknis yang Dipakai

- Next.js App Router Server Actions (v16.2.2):
  - `https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/01-getting-started/07-mutating-data.mdx`
- Next.js form + server action component API:
  - `https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/03-api-reference/02-components/form.mdx`
- Zod v4 `email()` dan `safeParse`:
  - `https://github.com/colinhacks/zod/blob/v4.0.1/packages/docs/content/api.mdx`
  - `https://github.com/colinhacks/zod/blob/v4.0.1/packages/docs/content/error-customization.mdx`
