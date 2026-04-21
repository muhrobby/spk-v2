import type { SpkRankingRow } from "@/actions/spk";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SpkRankingTableProps = {
  rows: SpkRankingRow[];
};

function getScoreBadgeClass(nilaiAkhir: number): string {
  if (nilaiAkhir >= 4) {
    return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  }
  if (nilaiAkhir >= 3) {
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  }
  return "bg-red-100 text-red-700 hover:bg-red-100";
}

export function SpkRankingTable({ rows }: SpkRankingTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Nama Toko</TableHead>
            <TableHead className="text-center">C1</TableHead>
            <TableHead className="text-center">C2</TableHead>
            <TableHead className="text-center">C3</TableHead>
            <TableHead className="text-right">Nilai Akhir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.storeId}>
              <TableCell className="font-medium">#{row.peringkat}</TableCell>
              <TableCell>{row.namaToko}</TableCell>
              <TableCell className="text-center">{row.skorC1}</TableCell>
              <TableCell className="text-center">{row.skorC2}</TableCell>
              <TableCell className="text-center">{row.skorC3}</TableCell>
              <TableCell className="text-right">
                <Badge className={getScoreBadgeClass(row.nilaiAkhir)}>{row.nilaiAkhir.toFixed(2)}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
