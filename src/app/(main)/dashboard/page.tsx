import { AlertCircle } from "lucide-react";

import { getAvailablePeriodes, getSpkRanking, resolvePeriode } from "@/actions/spk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { SpkRankingTable } from "./_components/spk-ranking-table";

type DashboardPageProps = {
  searchParams: Promise<{
    periode?: string;
  }>;
};

export default async function Page({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const periode = await resolvePeriode(params.periode);
  const [rankingResult, periodes] = await Promise.all([getSpkRanking({ periode }), getAvailablePeriodes()]);

  const hasData = rankingResult.success && rankingResult.rows.length > 0;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard SPK</CardTitle>
          <CardDescription>
            Ranking toko berdasarkan hasil perhitungan SAW. Pilih periode untuk melihat hasil evaluasi bulanan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="space-y-1.5">
              <label htmlFor="periode" className="font-medium text-sm">
                Periode
              </label>
              <Input id="periode" name="periode" type="month" defaultValue={periode} className="w-[180px]" />
            </div>
            <Button type="submit">Tampilkan Ranking</Button>
          </form>

          {periodes.length > 0 && (
            <p className="text-muted-foreground text-xs">
              Periode tersedia: {periodes.slice(0, 6).join(", ")}
              {periodes.length > 6 ? " ..." : ""}
            </p>
          )}

          {!rankingResult.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gagal memuat ranking</AlertTitle>
              <AlertDescription>{rankingResult.message}</AlertDescription>
            </Alert>
          )}

          {rankingResult.success && !hasData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Belum ada data</AlertTitle>
              <AlertDescription>{rankingResult.message}</AlertDescription>
            </Alert>
          )}

          {hasData && <SpkRankingTable rows={rankingResult.rows} />}
        </CardContent>
      </Card>
    </div>
  );
}
