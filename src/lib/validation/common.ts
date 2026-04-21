import { z } from "zod";

export const VALIDATION_MESSAGES = {
  sessionRequired: "Sesi login tidak ditemukan. Silakan login ulang.",
  periodeFormat: "Periode harus berformat YYYY-MM.",
  periodeInvalidMonth: "Bulan pada periode harus antara 01 sampai 12.",
  storeRequired: "Toko wajib dipilih.",
  invalidPayload: "Data input tidak valid.",
  incompleteOrderExceedsTotal: "Incomplete order tidak boleh lebih dari total order.",
  slaOntimeExceedsTotal: "SLA on-time tidak boleh lebih dari total order.",
  csvRequiredHeaders: "Header CSV tidak sesuai format yang diwajibkan.",
  uploadUnknownStore: "Nama toko tidak ditemukan.",
  uploadDuplicateInFile: "Data duplikat ditemukan pada file upload.",
  uploadDuplicateInDatabase: "Data untuk toko dan periode ini sudah ada di database.",
  uploadBatchAborted: "Upload dibatalkan. Tidak ada data yang disimpan karena ada error pada 1 atau lebih baris.",
} as const;

export const periodeSchema = z.string().regex(/^\d{4}-\d{2}$/, VALIDATION_MESSAGES.periodeFormat);

export function nonNegativeNumberSchema(label: string) {
  return z.number().nonnegative(`${label} harus bernilai >= 0.`);
}

export function nonNegativeIntSchema(label: string) {
  return z.number().int(`${label} harus berupa bilangan bulat.`).nonnegative(`${label} harus bernilai >= 0.`);
}

export function firstIssueMessage(error: z.ZodError, fallbackMessage: string): string {
  return error.issues[0]?.message ?? fallbackMessage;
}
