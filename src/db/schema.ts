import { relations } from "drizzle-orm";
import {
  boolean,
  double,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * BetterAuth core tables for MySQL + Drizzle.
 * Field names follow BetterAuth conventions for compatibility.
 */
export const user = mysqlTable("user", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: int("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: int("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { fsp: 3 }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { fsp: 3 }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

/**
 * Domain tables for SPK SAW.
 */
export const criteriaTypeEnum = mysqlEnum("criteria_type", ["benefit", "cost"]);

export const criteriaWeights = mysqlTable("criteria_weights", {
  id: int("id").autoincrement().primaryKey(),
  kode: varchar("kode", { length: 10 }).notNull().unique(),
  namaKriteria: varchar("nama_kriteria", { length: 255 }).notNull(),
  tipe: criteriaTypeEnum.notNull(),
  bobot: double("bobot").notNull(),
});

export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  namaToko: varchar("nama_toko", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
});

export const performanceRecords = mysqlTable(
  "performance_records",
  {
    id: int("id").autoincrement().primaryKey(),
    storeId: int("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    periode: varchar("periode", { length: 7 }).notNull(),
    targetSales: double("target_sales").notNull(),
    actualSales: double("actual_sales").notNull(),
    totalOrder: int("total_order").notNull(),
    incompleteOrder: int("incomplete_order").notNull(),
    slaOntime: int("sla_ontime").notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("performance_records_store_id_idx").on(table.storeId),
    unique("performance_records_store_periode_unique").on(table.storeId, table.periode),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  performanceRecords: many(performanceRecords),
}));

export const performanceRecordsRelations = relations(performanceRecords, ({ one }) => ({
  store: one(stores, {
    fields: [performanceRecords.storeId],
    references: [stores.id],
  }),
}));
