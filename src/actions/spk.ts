"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { criteriaWeights, db, performanceRecords, stores } from "@/db";
import { getAuthSession } from "@/lib/auth/session";
import { firstIssueMessage, periodeSchema, VALIDATION_MESSAGES } from "@/lib/validation/common";

const ALLOWED_CODES = ["C1", "C2", "C3"] as const;
type AllowedCode = (typeof ALLOWED_CODES)[number];

const getRankingInputSchema = z.object({
  periode: periodeSchema,
});

type CriteriaWeightMap = Record<AllowedCode, number>;

export type SpkRankingRow = {
  storeId: number;
  namaToko: string;
  periode: string;
  skorC1: number;
  skorC2: number;
  skorC3: number;
  nilaiAkhir: number;
  peringkat: number;
};

export type SpkRankingResult = {
  success: boolean;
  message: string;
  periode: string | null;
  weights: CriteriaWeightMap | null;
  rows: SpkRankingRow[];
};

function toCurrentPeriode(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return numerator / denominator;
}

function scoreC1SalesRatio(ratio: number): number {
  if (ratio < 0.85) return 1;
  if (ratio <= 0.94) return 2;
  if (ratio <= 0.99) return 3;
  if (ratio <= 1.14) return 4;
  return 5;
}

function scoreC2SlaRatio(ratio: number): number {
  if (ratio < 0.9) return 1;
  if (ratio <= 0.94) return 2;
  if (ratio <= 0.97) return 3;
  if (ratio <= 0.99) return 4;
  return 5;
}

function scoreC3IncompleteRatio(ratio: number): number {
  if (ratio < 0.01) return 5;
  if (ratio <= 0.019) return 4;
  if (ratio <= 0.029) return 3;
  if (ratio <= 0.039) return 2;
  return 1;
}

function normalizeWeights(input: Array<{ kode: string; bobot: number }>): CriteriaWeightMap | null {
  const mapped: Partial<CriteriaWeightMap> = {};

  for (const weight of input) {
    if (!ALLOWED_CODES.includes(weight.kode as AllowedCode)) {
      continue;
    }
    mapped[weight.kode as AllowedCode] = weight.bobot;
  }

  if (typeof mapped.C1 !== "number" || typeof mapped.C2 !== "number" || typeof mapped.C3 !== "number") {
    return null;
  }

  return {
    C1: mapped.C1,
    C2: mapped.C2,
    C3: mapped.C3,
  };
}

export async function getAvailablePeriodes(): Promise<string[]> {
  const rows = await db
    .select({ periode: performanceRecords.periode })
    .from(performanceRecords)
    .groupBy(performanceRecords.periode)
    .orderBy(desc(performanceRecords.periode));

  return rows.map((row) => row.periode);
}

export async function getSpkRanking(input: { periode: string }): Promise<SpkRankingResult> {
  const session = await getAuthSession();
  if (!session) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.sessionRequired,
      periode: null,
      weights: null,
      rows: [],
    };
  }

  const parsed = getRankingInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: firstIssueMessage(parsed.error, "Periode tidak valid."),
      periode: null,
      weights: null,
      rows: [],
    };
  }

  const { periode } = parsed.data;

  const weightsRaw = await db
    .select({
      kode: criteriaWeights.kode,
      bobot: criteriaWeights.bobot,
    })
    .from(criteriaWeights)
    .where(inArray(criteriaWeights.kode, [...ALLOWED_CODES]))
    .orderBy(asc(criteriaWeights.kode));

  const weights = normalizeWeights(weightsRaw);
  if (!weights) {
    return {
      success: false,
      message: "Bobot C1/C2/C3 belum lengkap. Silakan cek menu Pengaturan Bobot.",
      periode,
      weights: null,
      rows: [],
    };
  }

  const records = await db
    .select({
      storeId: performanceRecords.storeId,
      namaToko: stores.namaToko,
      periode: performanceRecords.periode,
      targetSales: performanceRecords.targetSales,
      actualSales: performanceRecords.actualSales,
      totalOrder: performanceRecords.totalOrder,
      incompleteOrder: performanceRecords.incompleteOrder,
      slaOntime: performanceRecords.slaOntime,
    })
    .from(performanceRecords)
    .innerJoin(stores, eq(stores.id, performanceRecords.storeId))
    .where(and(eq(performanceRecords.periode, periode)))
    .orderBy(asc(stores.namaToko));

  if (records.length === 0) {
    return {
      success: true,
      message: `Belum ada data kinerja untuk periode ${periode}.`,
      periode,
      weights,
      rows: [],
    };
  }

  const ranked = records
    .map((record) => {
      const c1Ratio = safeRatio(record.actualSales, record.targetSales);
      const c2Ratio = safeRatio(record.slaOntime, record.totalOrder);
      const c3Ratio = safeRatio(record.incompleteOrder, record.totalOrder);

      const skorC1 = scoreC1SalesRatio(c1Ratio);
      const skorC2 = scoreC2SlaRatio(c2Ratio);
      const skorC3 = scoreC3IncompleteRatio(c3Ratio);

      const nilaiMentah = (skorC1 * weights.C1 + skorC2 * weights.C2 + skorC3 * weights.C3) / 100;

      return {
        storeId: record.storeId,
        namaToko: record.namaToko,
        periode: record.periode,
        skorC1,
        skorC2,
        skorC3,
        nilaiMentah,
      };
    })
    .sort((a, b) => {
      if (b.nilaiMentah !== a.nilaiMentah) {
        return b.nilaiMentah - a.nilaiMentah;
      }
      return a.namaToko.localeCompare(b.namaToko, "id-ID");
    })
    .map((item, index) => ({
      storeId: item.storeId,
      namaToko: item.namaToko,
      periode: item.periode,
      skorC1: item.skorC1,
      skorC2: item.skorC2,
      skorC3: item.skorC3,
      nilaiAkhir: Number(item.nilaiMentah.toFixed(2)),
      peringkat: index + 1,
    }));

  return {
    success: true,
    message: "Ranking SPK berhasil dihitung.",
    periode,
    weights,
    rows: ranked,
  };
}

function resolvePeriodeOrDefault(input?: string): string {
  const parsed = periodeSchema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }

  return toCurrentPeriode();
}

export async function resolvePeriode(input?: string): Promise<string> {
  return resolvePeriodeOrDefault(input);
}
