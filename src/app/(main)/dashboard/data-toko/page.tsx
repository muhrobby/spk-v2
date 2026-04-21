import { desc } from "drizzle-orm";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db, stores } from "@/db";

import { StoresManager } from "./_components/stores-manager";

export default async function Page() {
  const storesData = await db
    .select({
      id: stores.id,
      namaToko: stores.namaToko,
      createdAt: stores.createdAt,
    })
    .from(stores)
    .orderBy(desc(stores.createdAt));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Toko</CardTitle>
          <CardDescription>Kelola data toko yang digunakan pada proses input kinerja bulanan.</CardDescription>
        </CardHeader>
        <CardContent>
          <StoresManager initialStores={storesData} />
        </CardContent>
      </Card>
    </div>
  );
}
