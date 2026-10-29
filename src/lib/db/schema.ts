/**
 * Schema Drizzle — Fase 1 (Postgres Railway, sin Supabase).
 * Fuente de verdad del DDL: railway/migrations/ + generated/.
 * Acá solo las tablas que la app empezará a consumir vía Drizzle.
 * El resto se va migrando en Fase 3 al sacar el cliente Supabase.
 */
import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Reemplaza auth.users. Auth.js / Lucia en Fase 2. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  currency: text("currency").notNull(),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  expectedReturnAnnual: numeric("expected_return_annual", { precision: 6, scale: 4 }),
  parentId: uuid("parent_id"),
  closingDay: integer("closing_day"),
  dueDay: integer("due_day"),
  earnsYield: boolean("earns_yield").notNull().default(false),
  holdingId: uuid("holding_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  parentId: uuid("parent_id"),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: uuid("account_id"),
  categoryId: uuid("category_id"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  description: text("description"),
  merchant: text("merchant"),
  date: date("date").notNull(),
  source: text("source").notNull().default("app"),
  rawOcrText: text("raw_ocr_text"),
  paymentMethod: text("payment_method"),
  installmentsTotal: integer("installments_total"),
  installmentAmount: numeric("installment_amount", { precision: 18, scale: 2 }),
  coveringAccountId: uuid("covering_account_id"),
  fundingAccountId: uuid("funding_account_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const incomes = pgTable("incomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: uuid("account_id"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  source: text("source"),
  type: text("type"),
  note: text("note"),
  distributed: boolean("distributed").notNull().default(false),
  date: date("date").notNull(),
  recurring: boolean("recurring").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const holdings = pgTable("holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: uuid("account_id"),
  ticker: text("ticker"),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
  avgBuyPrice: numeric("avg_buy_price", { precision: 18, scale: 6 }).notNull(),
  currency: text("currency").notNull(),
  currentPrice: numeric("current_price", { precision: 18, scale: 6 }),
  purchaseDate: date("purchase_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Tokens de recuperación de contraseña (Fase 2 Auth.js). */
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
