"use server";

import { revalidatePath } from "next/cache";

import { and, eq, inArray, or } from "drizzle-orm";
import type { z } from "zod";
import { z as zod } from "zod";

import { db } from "@/db";
import { performanceRecords, stores } from "@/db/schema";
import { getAuthSession } from "@/lib/auth/session";
import { firstIssueMessage, VALIDATION_MESSAGES } from "@/lib/validation/common";
import {
  type CreatePerformanceRecordsBatchInput,
  type CreatePerformanceRecordsBatchResult,
  groupDuplicateRows,
  performanceRecordSchema,
  strictPeriodeSchema,
} from "@/lib/validation/performance";

const validatePerformanceUploadPreviewSchema = zod.object({
  rows: zod.array(
    zod.object({
      rowNumber: zod.number().int().positive(),
      storeId: zod.number().int().positive(),
      periode: zod.string().regex(/^\d{4}-\d{2}$/),
    }),
  ),
});

type ValidatePerformanceUploadPreviewInput = z.infer<typeof validatePerformanceUploadPreviewSchema>;

const createPerformanceRecordsBatchSchema = zod.object({
  rows: zod.array(
    zod.object({
      rowNumber: zod.number().int().positive(),
      storeId: zod.number().int().positive(VALIDATION_MESSAGES.storeRequired),
      periode: strictPeriodeSchema,
      targetSales: zod.number().nonnegative("Target penjualan harus bernilai >= 0."),
      actualSales: zod.number().nonnegative("Penjualan aktual harus bernilai >= 0."),
      totalOrder: zod
        .number()
        .int("Total order harus berupa bilangan bulat.")
        .nonnegative("Total order harus bernilai >= 0."),
      incompleteOrder: zod
        .number()
        .int("Incomplete order harus berupa bilangan bulat.")
        .nonnegative("Incomplete order harus bernilai >= 0."),
      slaOntime: zod
        .number()
        .int("SLA on-time harus berupa bilangan bulat.")
        .nonnegative("SLA on-time harus bernilai >= 0."),
    }),
  ),
});

export async function validatePerformanceUploadPreview(input: ValidatePerformanceUploadPreviewInput) {
  const session = await getAuthSession();
  if (!session) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.sessionRequired,
      rowErrors: [] as Array<{ rowNumber: number; messages: string[] }>,
    };
  }

  const parsed = validatePerformanceUploadPreviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: firstIssueMessage(parsed.error, VALIDATION_MESSAGES.invalidPayload),
      rowErrors: [] as Array<{ rowNumber: number; messages: string[] }>,
    };
  }

  if (parsed.data.rows.length === 0) {
    return {
      success: true,
      message: "Tidak ada baris kandidat untuk validasi database.",
      rowErrors: [] as Array<{ rowNumber: number; messages: string[] }>,
    };
  }

  const uniqueStoreIds = Array.from(new Set(parsed.data.rows.map((row) => row.storeId)));
  const uniquePeriodes = Array.from(new Set(parsed.data.rows.map((row) => row.periode)));

  const conditions = parsed.data.rows.map((row) =>
    and(eq(performanceRecords.storeId, row.storeId), eq(performanceRecords.periode, row.periode)),
  );

  const existingRecords = await db
    .select({
      storeId: performanceRecords.storeId,
      periode: performanceRecords.periode,
    })
    .from(performanceRecords)
    .where(
      and(
        inArray(performanceRecords.storeId, uniqueStoreIds),
        inArray(performanceRecords.periode, uniquePeriodes),
        or(...conditions),
      ),
    );

  const existingKeys = new Set(existingRecords.map((record) => `${record.storeId}:${record.periode}`));

  const rowErrors = parsed.data.rows
    .filter((row) => existingKeys.has(`${row.storeId}:${row.periode}`))
    .map((row) => ({
      rowNumber: row.rowNumber,
      messages: [VALIDATION_MESSAGES.uploadDuplicateInDatabase],
    }));

  return {
    success: true,
    message:
      rowErrors.length > 0
        ? `Ditemukan ${rowErrors.length} baris konflik dengan database.`
        : "Tidak ada konflik database.",
    rowErrors,
  };
}

export async function createPerformanceRecordsBatch(
  input: CreatePerformanceRecordsBatchInput,
): Promise<CreatePerformanceRecordsBatchResult> {
  const session = await getAuthSession();
  if (!session) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.sessionRequired,
      savedCount: 0,
    };
  }

  const parsed = createPerformanceRecordsBatchSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const rowIndex = typeof issue?.path?.[1] === "number" ? issue.path[1] : undefined;
    const rowNumber = rowIndex !== undefined ? input.rows[rowIndex]?.rowNumber : undefined;

    return {
      success: false,
      message: firstIssueMessage(parsed.error, VALIDATION_MESSAGES.invalidPayload),
      savedCount: 0,
      rowErrors: rowNumber
        ? [
            {
              rowNumber,
              messages: [firstIssueMessage(parsed.error, VALIDATION_MESSAGES.invalidPayload)],
            },
          ]
        : undefined,
    };
  }

  const rows = parsed.data.rows;
  if (rows.length === 0) {
    return {
      success: false,
      message: "Tidak ada data valid untuk disimpan.",
      savedCount: 0,
    };
  }

  const duplicateGroups = groupDuplicateRows(rows.map((row) => ({ storeId: row.storeId, periode: row.periode })));
  if (duplicateGroups.size > 0) {
    const rowErrors = Array.from(duplicateGroups.values()).flatMap((positions) =>
      positions.map((position) => ({
        rowNumber: rows[position]?.rowNumber ?? position + 2,
        messages: [VALIDATION_MESSAGES.uploadDuplicateInFile],
      })),
    );

    return {
      success: false,
      message: VALIDATION_MESSAGES.uploadBatchAborted,
      savedCount: 0,
      rowErrors,
    };
  }

  const uniqueStoreIds = Array.from(new Set(rows.map((row) => row.storeId)));

  const existingStores = await db.select({ id: stores.id }).from(stores).where(inArray(stores.id, uniqueStoreIds));

  const existingStoreSet = new Set(existingStores.map((store) => store.id));
  const missingStoreRows = rows.filter((row) => !existingStoreSet.has(row.storeId));
  if (missingStoreRows.length > 0) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.uploadBatchAborted,
      savedCount: 0,
      rowErrors: missingStoreRows.map((row) => ({
        rowNumber: row.rowNumber,
        messages: [VALIDATION_MESSAGES.uploadUnknownStore],
      })),
    };
  }

  const uniquePeriodes = Array.from(new Set(rows.map((row) => row.periode)));
  const conditions = rows.map((row) =>
    and(eq(performanceRecords.storeId, row.storeId), eq(performanceRecords.periode, row.periode)),
  );

  const existingRecords = await db
    .select({
      storeId: performanceRecords.storeId,
      periode: performanceRecords.periode,
    })
    .from(performanceRecords)
    .where(
      and(
        inArray(performanceRecords.storeId, uniqueStoreIds),
        inArray(performanceRecords.periode, uniquePeriodes),
        or(...conditions),
      ),
    );

  const existingKeys = new Set(existingRecords.map((record) => `${record.storeId}:${record.periode}`));
  const dbConflicts = rows.filter((row) => existingKeys.has(`${row.storeId}:${row.periode}`));
  if (dbConflicts.length > 0) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.uploadBatchAborted,
      savedCount: 0,
      rowErrors: dbConflicts.map((row) => ({
        rowNumber: row.rowNumber,
        messages: [VALIDATION_MESSAGES.uploadDuplicateInDatabase],
      })),
    };
  }

  try {
    await db.transaction(async (tx) => {
      for (const row of rows) {
        await tx.insert(performanceRecords).values({
          storeId: row.storeId,
          periode: row.periode,
          targetSales: row.targetSales,
          actualSales: row.actualSales,
          totalOrder: row.totalOrder,
          incompleteOrder: row.incompleteOrder,
          slaOntime: row.slaOntime,
        });
      }
    });
  } catch (_error) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.uploadBatchAborted,
      savedCount: 0,
      rowErrors: rows.map((row) => ({
        rowNumber: row.rowNumber,
        messages: [VALIDATION_MESSAGES.uploadDuplicateInDatabase],
      })),
    };
  }

  revalidatePath("/dashboard/input-kinerja");

  return {
    success: true,
    message: `${rows.length} data kinerja berhasil disimpan.`,
    savedCount: rows.length,
  };
}

export async function createPerformanceRecord(input: z.infer<typeof performanceRecordSchema>) {
  const session = await getAuthSession();
  if (!session) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.sessionRequired,
    };
  }

  const validation = performanceRecordSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: firstIssueMessage(validation.error, VALIDATION_MESSAGES.invalidPayload),
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const validData = validation.data;

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, validData.storeId),
  });

  if (!store) {
    return {
      success: false,
      message: "Toko tidak ditemukan.",
    };
  }

  const existing = await db.query.performanceRecords.findFirst({
    where: and(eq(performanceRecords.storeId, validData.storeId), eq(performanceRecords.periode, validData.periode)),
  });

  if (existing) {
    return {
      success: false,
      message: `Data kinerja untuk toko "${store.namaToko}" pada periode ${validData.periode} sudah ada. Silakan gunakan periode lain.`,
    };
  }

  await db.insert(performanceRecords).values({
    storeId: validData.storeId,
    periode: validData.periode,
    targetSales: validData.targetSales,
    actualSales: validData.actualSales,
    totalOrder: validData.totalOrder,
    incompleteOrder: validData.incompleteOrder,
    slaOntime: validData.slaOntime,
  });

  revalidatePath("/dashboard/input-kinerja");

  return {
    success: true,
    message: "Data kinerja berhasil disimpan.",
  };
}
