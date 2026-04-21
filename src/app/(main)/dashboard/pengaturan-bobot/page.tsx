import { asc, inArray } from "drizzle-orm";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { criteriaWeights, db } from "@/db";

import { WeightsForm } from "./_components/weights-form";

const ALLOWED_CODES = ["C1", "C2", "C3"] as const;
type AllowedCode = (typeof ALLOWED_CODES)[number];
type WeightRow = {
  id: number;
  kode: AllowedCode;
  namaKriteria: string;
  tipe: "benefit" | "cost";
  bobot: number;
};

function isAllowedCode(value: string): value is AllowedCode {
  return ALLOWED_CODES.includes(value as AllowedCode);
}

export default async function Page() {
  const weights = await db
    .select({
      id: criteriaWeights.id,
      kode: criteriaWeights.kode,
      namaKriteria: criteriaWeights.namaKriteria,
      tipe: criteriaWeights.tipe,
      bobot: criteriaWeights.bobot,
    })
    .from(criteriaWeights)
    .where(inArray(criteriaWeights.kode, ["C1", "C2", "C3"]))
    .orderBy(asc(criteriaWeights.kode));

  const filteredWeights: WeightRow[] = weights.flatMap((item) =>
    isAllowedCode(item.kode) ? [{ ...item, kode: item.kode }] : [],
  );

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Bobot</CardTitle>
          <CardDescription>
            Kelola bobot C1/C2/C3 untuk perhitungan SAW. Total bobot wajib tepat 100 sebelum disimpan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeightsForm initialWeights={filteredWeights} />
        </CardContent>
      </Card>
    </div>
  );
}
