import "dotenv/config";

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";

import { account, db, pool, user } from "../index";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password";
const ADMIN_NAME = "Admin";

async function seedAdminUser() {
  console.log(`[db:seed:admin] Ensuring admin user exists: ${ADMIN_EMAIL}`);

  await db.transaction(async (tx) => {
    const existingUser = await tx.select({ id: user.id }).from(user).where(eq(user.email, ADMIN_EMAIL)).limit(1);

    const userId =
      existingUser[0]?.id ??
      (
        await tx
          .insert(user)
          .values({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            emailVerified: true,
          })
          .$returningId()
      )[0].id;

    const existingCredential = await tx
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
      .limit(1);

    if (existingCredential.length === 0) {
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);

      await tx.insert(account).values({
        id: crypto.randomUUID(),
        accountId: String(userId),
        providerId: "credential",
        userId,
        password: hashedPassword,
      });
    }
  });

  console.log("[db:seed:admin] Admin user and credential are ready.");
}

seedAdminUser()
  .catch((error) => {
    console.error("[db:seed:admin] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
