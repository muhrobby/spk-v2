import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { getDatabaseUrl } from "./config";
import * as schema from "./schema";

export * from "./config";
export * from "./schema";

const pool = mysql.createPool({
  uri: getDatabaseUrl(),
  connectionLimit: 10,
});

export const db = drizzle(pool, { schema, mode: "default" });

export { pool, schema };
