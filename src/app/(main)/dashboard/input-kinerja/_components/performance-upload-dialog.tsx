"use client";

import { useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, Download, FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { createPerformanceRecordsBatch, validatePerformanceUploadPreview } from "@/actions/performance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  ParsedPerformanceUploadRow,
  PerformanceUploadPreviewRow,
  PerformanceUploadPreviewSummary,
} from "@/lib/validation/performance";

import { buildLocalPerformancePreview, parsePerformanceUploadCsv } from "./performance-upload-csv";

type StoreOption = {
  id: number;
  namaToko: string;
};

const EMPTY_SUMMARY: PerformanceUploadPreviewSummary = {
  totalRows: 0,
  validRows: 0,
  errorRows: 0,
};

export function PerformanceUploadDialog({ stores }: { stores: StoreOption[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<PerformanceUploadPreviewRow[]>([]);
  const [summary, setSummary] = useState<PerformanceUploadPreviewSummary>(EMPTY_SUMMARY);
  const [errorSummary, setErrorSummary] = useState<string[]>([]);
  const [dbValidationError, setDbValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasRows = previewRows.length > 0;
  const hasErrors = summary.errorRows > 0;

  const summaryItems = useMemo(
    () => [
      { label: "Total Baris", value: summary.totalRows },
      { label: "Valid", value: summary.validRows },
      { label: "Error", value: summary.errorRows },
    ],
    [summary],
  );

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsProcessing(true);
    setSelectedFileName(file.name);

    try {
      const raw = await file.text();
      const parsed = parsePerformanceUploadCsv(raw);

      if (!parsed.success) {
        setPreviewRows([]);
        setSummary(EMPTY_SUMMARY);
        setErrorSummary([parsed.message]);
        toast.error(parsed.message);
        return;
      }

      if (parsed.rows.length === 0) {
        setPreviewRows([]);
        setSummary(EMPTY_SUMMARY);
        setErrorSummary(["File tidak berisi data baris yang dapat diproses."]);
        toast.error("File tidak berisi data baris yang dapat diproses.");
        return;
      }

      const localPreview = buildLocalPerformancePreview(
        parsed.rows as ParsedPerformanceUploadRow[],
        stores,
        parsed.rowErrors,
      );

      setDbValidationError(null);

      if (localPreview.hasErrors) {
        setPreviewRows(localPreview.rows);
        setSummary(localPreview.summary);
        setErrorSummary(localPreview.errorSummary);
        toast.error(`File memiliki ${localPreview.summary.errorRows} baris error.`);
      } else {
        const validationResult = await validatePerformanceUploadPreview({
          rows: localPreview.rows
            .filter((row) => row.isValid && row.storeId !== null)
            .map((row) => ({
              rowNumber: row.rowNumber,
              storeId: row.storeId as number,
              periode: row.periode,
            })),
        });

        if (!validationResult.success) {
          setPreviewRows(localPreview.rows);
          setSummary(localPreview.summary);
          setErrorSummary([validationResult.message]);
          setDbValidationError(validationResult.message);
          toast.error(validationResult.message);
          return;
        }

        const mergedRows = mergeDatabaseValidationResult(localPreview.rows, validationResult.rowErrors);
        const mergedSummary = {
          totalRows: mergedRows.length,
          validRows: mergedRows.filter((row) => row.isValid).length,
          errorRows: mergedRows.filter((row) => !row.isValid).length,
        };
        const mergedErrorSummary = mergedRows.flatMap((row) =>
          row.errors.map((error) => `Baris ${row.rowNumber}: ${error}`),
        );

        setPreviewRows(mergedRows);
        setSummary(mergedSummary);
        setErrorSummary(mergedErrorSummary);

        if (mergedSummary.errorRows > 0) {
          toast.error(`Ditemukan ${mergedSummary.errorRows} baris error setelah validasi database.`);
        } else {
          toast.success(`Preview berhasil. ${mergedSummary.validRows} baris siap diproses.`);
        }
      }
    } catch (_error) {
      setPreviewRows([]);
      setSummary(EMPTY_SUMMARY);
      setErrorSummary(["Terjadi kesalahan saat membaca file CSV."]);
      setDbValidationError(null);
      setIsSubmitting(false);
      toast.error("Terjadi kesalahan saat membaca file CSV.");
    } finally {
      setIsProcessing(false);
    }
  }

  function resetState() {
    setSelectedFileName(null);
    setPreviewRows([]);
    setSummary(EMPTY_SUMMARY);
    setErrorSummary([]);
    setDbValidationError(null);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function downloadTemplateCsv() {
    const template = [
      "nama_toko,periode,target_penjualan,penjualan_aktual,total_order,incomplete_order,sla_ontime",
      "Contoh Toko,2025-06,10000000,9500000,150,5,140",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "template-upload-kinerja.csv";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function onSaveBatch() {
    const rowsToSave = previewRows
      .filter((row) => row.isValid)
      .map((row) => ({
        rowNumber: row.rowNumber,
        storeId: row.storeId as number,
        periode: row.periode,
        targetSales: row.targetSales as number,
        actualSales: row.actualSales as number,
        totalOrder: row.totalOrder as number,
        incompleteOrder: row.incompleteOrder as number,
        slaOntime: row.slaOntime as number,
      }));

    if (rowsToSave.length === 0) {
      toast.error("Tidak ada data valid untuk disimpan.");
      return;
    }

    setIsSubmitting(true);
    const result = await createPerformanceRecordsBatch({ rows: rowsToSave });
    setIsSubmitting(false);

    if (!result.success) {
      const rowErrors = result.rowErrors ?? [];
      const rowErrorMap = new Map(rowErrors.map((item) => [item.rowNumber, item.messages]));
      const mergedRows = previewRows.map((row) => {
        const messages = rowErrorMap.get(row.rowNumber) ?? [];
        if (messages.length === 0) {
          return row;
        }

        const nextErrors = Array.from(new Set([...row.errors, ...messages]));
        return {
          ...row,
          errors: nextErrors,
          isValid: false,
        };
      });

      const mergedSummary = {
        totalRows: mergedRows.length,
        validRows: mergedRows.filter((row) => row.isValid).length,
        errorRows: mergedRows.filter((row) => !row.isValid).length,
      };
      const mergedErrorSummary = mergedRows.flatMap((row) =>
        row.errors.map((error) => `Baris ${row.rowNumber}: ${error}`),
      );

      setPreviewRows(mergedRows);
      setSummary(mergedSummary);
      setErrorSummary(mergedErrorSummary);
      setDbValidationError(result.message);
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    resetState();
    setOpen(false);
    router.refresh();
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
        <Button type="button" variant="outline" size="sm">
          <Upload className="mr-1.5 size-4" />
          Upload CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Upload Data Kinerja</DialogTitle>
          <DialogDescription>
            Upload file CSV, cek preview, lalu perbaiki baris yang error sebelum lanjut.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isSubmitting}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Membaca file...
                </>
              ) : (
                <>
                  <FileUp className="mr-1.5 size-4" />
                  Pilih File CSV
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplateCsv}
              disabled={isProcessing || isSubmitting}
            >
              <Download className="mr-1.5 size-4" />
              Download Template
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={resetState}
              disabled={isProcessing || isSubmitting || (!hasRows && !selectedFileName)}
            >
              Reset
            </Button>

            {selectedFileName ? (
              <Badge variant="outline">{selectedFileName}</Badge>
            ) : (
              <Badge variant="outline">Belum ada file</Badge>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onFileSelected}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {summaryItems.map((item) => (
              <div key={item.label} className="rounded-lg border bg-muted/20 p-3">
                <p className="text-muted-foreground text-xs">{item.label}</p>
                <p className="font-semibold text-xl">{item.value}</p>
              </div>
            ))}
          </div>

          {errorSummary.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Terdapat error pada data upload:</p>
                  <ScrollArea className="h-28 rounded border bg-background p-2">
                    <ul className="space-y-1 text-xs">
                      {errorSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {dbValidationError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{dbValidationError}</AlertDescription>
            </Alert>
          )}

          {hasRows && (
            <ScrollArea className="h-96 rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Baris</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nama Toko</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Target Penjualan</TableHead>
                    <TableHead>Penjualan Aktual</TableHead>
                    <TableHead>Total Order</TableHead>
                    <TableHead>Incomplete Order</TableHead>
                    <TableHead>SLA Ontime</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.rowNumber} className={row.isValid ? "" : "bg-destructive/5"}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>
                        <Badge variant={row.isValid ? "secondary" : "destructive"}>
                          {row.isValid ? "Valid" : "Error"}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.namaToko || "-"}</TableCell>
                      <TableCell>{row.periode || "-"}</TableCell>
                      <TableCell>{row.targetSales ?? "-"}</TableCell>
                      <TableCell>{row.actualSales ?? "-"}</TableCell>
                      <TableCell>{row.totalOrder ?? "-"}</TableCell>
                      <TableCell>{row.incompleteOrder ?? "-"}</TableCell>
                      <TableCell>{row.slaOntime ?? "-"}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <ul className="list-disc space-y-0.5 pl-4 text-destructive text-xs">
                            {row.errors.map((error) => (
                              <li key={`${row.rowNumber}-${error}`}>{error}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Tutup
          </Button>
          <Button
            type="button"
            disabled={!hasRows || hasErrors || isProcessing || isSubmitting || Boolean(dbValidationError)}
            onClick={onSaveBatch}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Data"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function mergeDatabaseValidationResult(
  rows: PerformanceUploadPreviewRow[],
  rowErrors: Array<{ rowNumber: number; messages: string[] }>,
): PerformanceUploadPreviewRow[] {
  const rowErrorMap = new Map(rowErrors.map((item) => [item.rowNumber, item.messages]));

  return rows.map((row) => {
    const dbErrors = rowErrorMap.get(row.rowNumber) ?? [];
    const mergedErrors = [...row.errors, ...dbErrors];

    return {
      ...row,
      errors: mergedErrors,
      isValid: mergedErrors.length === 0,
    };
  });
}
