import { z } from "zod";

import { nonNegativeIntSchema, nonNegativeNumberSchema, VALIDATION_MESSAGES } from "@/lib/validation/common";

export const strictPeriodeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, VALIDATION_MESSAGES.periodeFormat)
  .refine((value) => {
    const [, monthStr] = value.split("-");
    const month = Number(monthStr);
    return Number.isInteger(month) && month >= 1 && month <= 12;
  }, VALIDATION_MESSAGES.periodeInvalidMonth);

export const performanceMetricsSchema = z
  .object({
    targetSales: nonNegativeNumberSchema("Target penjualan"),
    actualSales: nonNegativeNumberSchema("Penjualan aktual"),
    totalOrder: nonNegativeIntSchema("Total order"),
    incompleteOrder: nonNegativeIntSchema("Incomplete order"),
    slaOntime: nonNegativeIntSchema("SLA on-time"),
  })
  .superRefine((values, ctx) => {
    if (values.incompleteOrder > values.totalOrder) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["incompleteOrder"],
        message: VALIDATION_MESSAGES.incompleteOrderExceedsTotal,
      });
    }

    if (values.slaOntime > values.totalOrder) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slaOntime"],
        message: VALIDATION_MESSAGES.slaOntimeExceedsTotal,
      });
    }
  });

export const performanceRecordSchema = performanceMetricsSchema.extend({
  storeId: z.number().int().positive(VALIDATION_MESSAGES.storeRequired),
  periode: strictPeriodeSchema,
});

export const performanceFormSchema = performanceMetricsSchema.extend({
  storeId: z.string().regex(/^\d+$/, VALIDATION_MESSAGES.storeRequired),
  periode: strictPeriodeSchema,
});

export function buildPerformanceDuplicateKey(storeId: number, periode: string): string {
  return `${storeId}:${periode}`;
}

export function groupDuplicateRows<T extends { storeId: number; periode: string }>(rows: T[]): Map<string, number[]> {
  const grouped = new Map<string, number[]>();

  for (const [index, row] of rows.entries()) {
    const key = buildPerformanceDuplicateKey(row.storeId, row.periode);
    const positions = grouped.get(key) ?? [];
    positions.push(index);
    grouped.set(key, positions);
  }

  const duplicatesOnly = new Map<string, number[]>();
  for (const [key, positions] of grouped.entries()) {
    if (positions.length > 1) {
      duplicatesOnly.set(key, positions);
    }
  }

  return duplicatesOnly;
}

export type ParsedPerformanceUploadRow = {
  rowNumber: number;
  namaToko: string;
  periode: string;
  targetSales: string;
  actualSales: string;
  totalOrder: string;
  incompleteOrder: string;
  slaOntime: string;
};

export type PerformanceUploadPreviewRow = {
  rowNumber: number;
  namaToko: string;
  periode: string;
  targetSales: number | null;
  actualSales: number | null;
  totalOrder: number | null;
  incompleteOrder: number | null;
  slaOntime: number | null;
  storeId: number | null;
  isValid: boolean;
  errors: string[];
};

export type PerformanceUploadPreviewSummary = {
  totalRows: number;
  validRows: number;
  errorRows: number;
};

export type ValidatePerformanceUploadPreviewResult = {
  success: boolean;
  message: string;
  rows: PerformanceUploadPreviewRow[];
  summary: PerformanceUploadPreviewSummary;
  hasErrors: boolean;
};

export type CreatePerformanceRecordsBatchInput = {
  rows: Array<{
    rowNumber: number;
    storeId: number;
    periode: string;
    targetSales: number;
    actualSales: number;
    totalOrder: number;
    incompleteOrder: number;
    slaOntime: number;
  }>;
};

export type CreatePerformanceRecordsBatchResult = {
  success: boolean;
  message: string;
  savedCount: number;
  rowErrors?: Array<{
    rowNumber: number;
    messages: string[];
  }>;
};
