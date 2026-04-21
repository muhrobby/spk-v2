"use server";

import { revalidatePath } from "next/cache";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { criteriaWeights, db } from "@/db";
import { getAuthSession } from "@/lib/auth/session";
import { firstIssueMessage, nonNegativeNumberSchema, VALIDATION_MESSAGES } from "@/lib/validation/common";

const ALLOWED_CODES = ["C1", "C2", "C3"] as const;

const updateWeightItemSchema = z.object({
  id: z.number().int().positive(),
  kode: z.enum(ALLOWED_CODES),
  bobot: nonNegativeNumberSchema("Bobot").max(100, "Bobot maksimal 100."),
});

const updateWeightsSchema = z
  .object({
    weights: z.array(updateWeightItemSchema).length(3),
  })
  .superRefine((data, ctx) => {
    const uniqueCodes = new Set(data.weights.map((item) => item.kode));
    if (uniqueCodes.size !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Setiap kode kriteria harus unik (C1, C2, C3).",
        path: ["weights"],
      });
    }

    const total = data.weights.reduce((sum, item) => sum + item.bobot, 0);
    if (Math.abs(total - 100) > 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total bobot harus 100. Total saat ini: ${total.toFixed(2)}.`,
        path: ["weights"],
      });
    }
  });

export type UpdateWeightsInput = z.infer<typeof updateWeightsSchema>;

export type UpdateWeightsResult = {
  success: boolean;
  message: string;
};

export async function updateWeightsAction(input: UpdateWeightsInput): Promise<UpdateWeightsResult> {
  const session = await getAuthSession();
  if (!session) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.sessionRequired,
    };
  }

  const parsed = updateWeightsSchema.safeParse(input);
  if (!parsed.success) {
    const firstMessage = firstIssueMessage(parsed.error, "Payload bobot tidak valid.");
    return {
      success: false,
      message: firstMessage,
    };
  }

  await db.transaction(async (tx) => {
    for (const item of parsed.data.weights) {
      await tx
        .update(criteriaWeights)
        .set({ bobot: item.bobot })
        .where(and(eq(criteriaWeights.id, item.id), eq(criteriaWeights.kode, item.kode)));
    }
  });

  revalidatePath("/dashboard/pengaturan-bobot");

  return {
    success: true,
    message: "Bobot kriteria berhasil diperbarui.",
  };
}
