import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";

import { PerformanceForm } from "./_components/performance-form";
import { PerformanceUploadDialog } from "./_components/performance-upload-dialog";

export default async function InputKinerjaPage() {
  const storesList = await db.query.stores.findMany();

  if (storesList.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Input Kinerja</h1>
          <p className="mt-2 text-muted-foreground">Masukkan data kinerja bulanan untuk setiap toko.</p>
        </div>

        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Belum ada toko yang terdaftar. Silakan{" "}
            <a href="/dashboard/data-toko" className="font-semibold underline hover:no-underline">
              tambahkan toko terlebih dahulu
            </a>{" "}
            sebelum menginput data kinerja.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Input Kinerja</h1>
        <p className="mt-2 text-muted-foreground">Masukkan data kinerja bulanan untuk setiap toko.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Form Input Kinerja Bulanan</CardTitle>
              <CardDescription>Pilih periode, pilih toko, lalu isi metrik kinerja bulanan.</CardDescription>
            </div>
            <PerformanceUploadDialog stores={storesList} />
          </div>
        </CardHeader>
        <CardContent>
          <PerformanceForm stores={storesList} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">Format Periode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">YYYY-MM</p>
            <p className="mt-1 text-muted-foreground text-xs">Contoh: 2024-01</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">Validasi Utama</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs">
              <li>• Incomplete ≤ Total Order</li>
              <li>• SLA On-time ≤ Total Order</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">Constraint Unik</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs">Satu kombinasi toko + periode hanya bisa disimpan sekali</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
