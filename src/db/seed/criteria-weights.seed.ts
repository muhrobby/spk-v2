import "dotenv/config";

import { criteriaWeights, db, pool } from "../index";

const DEFAULT_CRITERIA_WEIGHTS = [
  {
    kode: "C1",
    namaKriteria: "Rasio Penjualan",
    tipe: "benefit" as const,
    bobot: 40,
  },
  {
    kode: "C2",
    namaKriteria: "Rasio Tepat Waktu",
    tipe: "benefit" as const,
    bobot: 30,
  },
  {
    kode: "C3",
    namaKriteria: "Rasio Pesanan Bermasalah",
    tipe: "cost" as const,
    bobot: 30,
  },
];

async function seedCriteriaWeights() {
  console.log("[db:seed] Start seeding default criteria_weights...");

  await db.transaction(async (tx) => {
    for (const criteria of DEFAULT_CRITERIA_WEIGHTS) {
      await tx
        .insert(criteriaWeights)
        .values(criteria)
        .onDuplicateKeyUpdate({
          set: {
            namaKriteria: criteria.namaKriteria,
            tipe: criteria.tipe,
            bobot: criteria.bobot,
          },
        });
    }
  });

  console.log(`[db:seed] Done. Processed ${DEFAULT_CRITERIA_WEIGHTS.length} rows.`);
}

seedCriteriaWeights()
  .catch((error) => {
    console.error("[db:seed] Failed to seed criteria_weights:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
