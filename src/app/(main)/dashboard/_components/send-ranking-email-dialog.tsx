"use client";

import { type FormEvent, useState } from "react";

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
const SEND_ERROR_MESSAGE = "Gagal menghubungi layanan email.";

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      setFormError(parsedEmail.error.issues[0]?.message ?? "Masukkan alamat email yang valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendSpkRankingToEmail({
        periode,
        recipientEmail: parsedEmail.data,
      });

      if (!result.success) {
        setFormError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      resetState();
    } catch {
      setFormError(SEND_ERROR_MESSAGE);
      toast.error(SEND_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setFormError(null);
        } else if (!isSubmitting) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary" disabled={rowsCount === 0 || isSubmitting}>
          <Mail className="mr-1.5 size-4" />
          Kirim ke Email
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kirim Ranking ke Email</DialogTitle>
          <DialogDescription>
            Ranking yang sedang tampil akan diteruskan ke webhook n8n untuk diproses menjadi CSV dan dikirim ke
            penerima.
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
            <p className="text-muted-foreground text-xs">Fase ini hanya mendukung 1 email tujuan.</p>
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
