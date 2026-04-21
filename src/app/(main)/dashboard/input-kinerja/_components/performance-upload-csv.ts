import { VALIDATION_MESSAGES } from "@/lib/validation/common";
import {
  buildPerformanceDuplicateKey,
  type ParsedPerformanceUploadRow,
  type PerformanceUploadPreviewRow,
  type PerformanceUploadPreviewSummary,
  performanceMetricsSchema,
  strictPeriodeSchema,
} from "@/lib/validation/performance";

const REQUIRED_HEADERS = [
  "nama_toko",
  "periode",
  "target_penjualan",
  "penjualan_aktual",
  "total_order",
  "incomplete_order",
  "sla_ontime",
] as const;

type StoreOption = {
  id: number;
  namaToko: string;
};

type CsvParseResult =
  | {
      success: true;
      rows: ParsedPerformanceUploadRow[];
      rowErrors: Map<number, string[]>;
    }
  | {
      success: false;
      message: string;
    };

export type LocalPreviewResult = {
  rows: PerformanceUploadPreviewRow[];
  summary: PerformanceUploadPreviewSummary;
  hasErrors: boolean;
  errorSummary: string[];
};

export function parsePerformanceUploadCsv(csvText: string): CsvParseResult {
  const normalized = csvText
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  if (lines.length === 0 || lines[0]?.trim() === "") {
    return {
      success: false,
      message: "File CSV kosong atau tidak memiliki header.",
    };
  }

  const header = splitCsvLine(lines[0]);
  const isHeaderValid =
    header.length === REQUIRED_HEADERS.length &&
    REQUIRED_HEADERS.every((required, index) => header[index] === required);

  if (!isHeaderValid) {
    return {
      success: false,
      message: VALIDATION_MESSAGES.csvRequiredHeaders,
    };
  }

  const rows: ParsedPerformanceUploadRow[] = [];
  const rowErrors = new Map<number, string[]>();

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rowNumber = lineIndex + 1;
    const line = lines[lineIndex] ?? "";
    const cells = splitCsvLine(line);

    if (cells.every((cell) => cell === "")) {
      continue;
    }

    if (cells.length !== REQUIRED_HEADERS.length) {
      rowErrors.set(rowNumber, [
        `Jumlah kolom tidak sesuai header. Diharapkan ${REQUIRED_HEADERS.length} kolom, ditemukan ${cells.length}.`,
      ]);
    }

    rows.push({
      rowNumber,
      namaToko: cells[0] ?? "",
      periode: cells[1] ?? "",
      targetSales: cells[2] ?? "",
      actualSales: cells[3] ?? "",
      totalOrder: cells[4] ?? "",
      incompleteOrder: cells[5] ?? "",
      slaOntime: cells[6] ?? "",
    });
  }

  return {
    success: true,
    rows,
    rowErrors,
  };
}

export function buildLocalPerformancePreview(
  rows: ParsedPerformanceUploadRow[],
  stores: StoreOption[],
  rowErrors: Map<number, string[]>,
): LocalPreviewResult {
  const storeMap = new Map(stores.map((store) => [normalizeStoreName(store.namaToko), store.id]));

  const previewRows: PerformanceUploadPreviewRow[] = rows.map((row) => {
    const errors = [...(rowErrors.get(row.rowNumber) ?? [])];

    validateRequiredString(row.namaToko, "Nama toko", errors);
    validateRequiredString(row.periode, "Periode", errors);
    validateRequiredString(row.targetSales, "Target penjualan", errors);
    validateRequiredString(row.actualSales, "Penjualan aktual", errors);
    validateRequiredString(row.totalOrder, "Total order", errors);
    validateRequiredString(row.incompleteOrder, "Incomplete order", errors);
    validateRequiredString(row.slaOntime, "SLA on-time", errors);

    const storeId = row.namaToko.trim() ? (storeMap.get(normalizeStoreName(row.namaToko)) ?? null) : null;
    if (row.namaToko.trim() !== "" && storeId === null) {
      errors.push(`${VALIDATION_MESSAGES.uploadUnknownStore} (${row.namaToko}).`);
    }

    const targetSales = parseNumericField(row.targetSales, "Target penjualan", errors, false);
    const actualSales = parseNumericField(row.actualSales, "Penjualan aktual", errors, false);
    const totalOrder = parseNumericField(row.totalOrder, "Total order", errors, true);
    const incompleteOrder = parseNumericField(row.incompleteOrder, "Incomplete order", errors, true);
    const slaOntime = parseNumericField(row.slaOntime, "SLA on-time", errors, true);

    const periodeValidation = strictPeriodeSchema.safeParse(row.periode);
    if (!periodeValidation.success) {
      errors.push(...periodeValidation.error.issues.map((issue) => issue.message));
    }

    if (
      targetSales !== null &&
      actualSales !== null &&
      totalOrder !== null &&
      incompleteOrder !== null &&
      slaOntime !== null
    ) {
      const metricsValidation = performanceMetricsSchema.safeParse({
        targetSales,
        actualSales,
        totalOrder,
        incompleteOrder,
        slaOntime,
      });

      if (!metricsValidation.success) {
        errors.push(...metricsValidation.error.issues.map((issue) => issue.message));
      }
    }

    return {
      rowNumber: row.rowNumber,
      namaToko: row.namaToko,
      periode: row.periode,
      targetSales,
      actualSales,
      totalOrder,
      incompleteOrder,
      slaOntime,
      storeId,
      isValid: true,
      errors,
    };
  });

  const duplicateGroups = new Map<string, number[]>();
  for (const row of previewRows) {
    if (!row.periode.trim()) {
      continue;
    }

    const key =
      row.storeId !== null
        ? `store:${buildPerformanceDuplicateKey(row.storeId, row.periode)}`
        : `name:${normalizeStoreName(row.namaToko)}:${row.periode}`;
    const grouped = duplicateGroups.get(key) ?? [];
    grouped.push(row.rowNumber);
    duplicateGroups.set(key, grouped);
  }

  for (const row of previewRows) {
    if (!row.periode.trim()) {
      continue;
    }

    const key =
      row.storeId !== null
        ? `store:${buildPerformanceDuplicateKey(row.storeId, row.periode)}`
        : `name:${normalizeStoreName(row.namaToko)}:${row.periode}`;
    const duplicates = duplicateGroups.get(key) ?? [];

    if (duplicates.length > 1) {
      row.errors.push(`${VALIDATION_MESSAGES.uploadDuplicateInFile} (baris: ${duplicates.join(", ")}).`);
    }

    row.isValid = row.errors.length === 0;
  }

  const summary: PerformanceUploadPreviewSummary = {
    totalRows: previewRows.length,
    validRows: previewRows.filter((row) => row.isValid).length,
    errorRows: previewRows.filter((row) => !row.isValid).length,
  };

  const errorSummary = previewRows.flatMap((row) => row.errors.map((error) => `Baris ${row.rowNumber}: ${error}`));

  return {
    rows: previewRows,
    summary,
    hasErrors: summary.errorRows > 0,
    errorSummary,
  };
}

function splitCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
}

function normalizeStoreName(value: string): string {
  return value.trim().toLowerCase();
}

function validateRequiredString(value: string, label: string, errors: string[]) {
  if (!value.trim()) {
    errors.push(`${label} wajib diisi.`);
  }
}

function parseNumericField(value: string, label: string, errors: string[], integerOnly: boolean): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors.push(`${label} harus berupa angka.`);
    return null;
  }

  if (integerOnly && !Number.isInteger(parsed)) {
    errors.push(`${label} harus berupa bilangan bulat.`);
    return null;
  }

  return parsed;
}
