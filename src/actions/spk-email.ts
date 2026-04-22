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

type AuthSession = Awaited<ReturnType<typeof getAuthSession>>;

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

function getWebhookConfig(): { url: string | null; errorMessage: string | null } {
  const value = process.env.N8N_RANKING_WEBHOOK_URL;
  if (!value) {
    return { url: null, errorMessage: null };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { url: null, errorMessage: null };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        url: null,
        errorMessage: "Konfigurasi webhook harus memakai URL http atau https yang valid.",
      };
    }

    return { url: parsed.toString(), errorMessage: null };
  } catch {
    return {
      url: null,
      errorMessage: "Konfigurasi webhook harus berupa URL absolut yang valid.",
    };
  }
}

function getRequestedBy(session: AuthSession): { userId: string | null; email: string | null } {
  if (!session || typeof session !== "object") {
    return { userId: null, email: null };
  }

  const user = "user" in session ? session.user : undefined;
  const sessionUserId =
    "userId" in session && typeof session.userId === "string"
      ? session.userId
      : "session" in session && session.session && typeof session.session.userId === "string"
        ? session.session.userId
        : null;

  const userId =
    user && typeof user === "object" && "id" in user && typeof user.id === "string" ? user.id : sessionUserId;
  const email =
    user && typeof user === "object" && "email" in user && typeof user.email === "string" ? user.email : null;

  return {
    userId,
    email,
  };
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

export async function sendSpkRankingToEmail(input: SendSpkRankingToEmailInput): Promise<SendSpkRankingToEmailResult> {
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

  const webhookConfig = getWebhookConfig();
  if (webhookConfig.errorMessage) {
    return {
      success: false,
      message: webhookConfig.errorMessage,
    };
  }

  if (!webhookConfig.url) {
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
    requestedBy: getRequestedBy(session),
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
    const response = await fetch(webhookConfig.url, {
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
