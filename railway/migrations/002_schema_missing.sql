-- ============================================================
-- Railway Postgres — Schema que vivía solo en Supabase (002/003/012 + holdings)
-- Correr DESPUÉS de 001 adaptada, ANTES de 004+.
-- Reconstruido desde types + RPCs del repo (no había SQL en git).
-- ============================================================

-- ── accounts: jerarquía + tipo credito (parcial; 009 completa closing/due) ──
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES accounts(id) ON DELETE RESTRICT;

-- Ampliar CHECK de type para incluir credito (idempotente vía drop/add)
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts
  ADD CONSTRAINT accounts_type_check
  CHECK (type IN ('banco', 'efectivo', 'inversion', 'usd_reserva', 'credito'));

-- ── expenses: cuotas / cobertura / funding (migración 012 en vivo) ──────────
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS payment_method TEXT
    CHECK (payment_method IS NULL OR payment_method IN ('efectivo', 'debito', 'credito', 'transferencia'));
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS installments_total INTEGER;
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS installment_amount NUMERIC(18, 2);
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS covering_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS funding_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- ── installments ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS installments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id          UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  installment_number  INTEGER NOT NULL,
  amount              NUMERIC(18, 2) NOT NULL,
  due_date            DATE NOT NULL,
  paid                BOOLEAN NOT NULL DEFAULT false,
  paid_date           DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (expense_id, installment_number)
);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "installments: via expense owner" ON installments;
CREATE POLICY "installments: via expense owner" ON installments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = installments.expense_id
        AND e.user_id = app_current_user_id()
    )
  );

-- ── account_earmarks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS account_earmarks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  amount           NUMERIC(18, 2) NOT NULL,
  currency         TEXT NOT NULL CHECK (currency IN ('ARS', 'USD')),
  reason           TEXT,
  installment_id   UUID REFERENCES installments(id) ON DELETE SET NULL,
  expense_id       UUID REFERENCES expenses(id) ON DELETE SET NULL,
  release_date     DATE,
  released         BOOLEAN NOT NULL DEFAULT false,
  released_date    DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE account_earmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "account_earmarks: solo el propietario" ON account_earmarks;
CREATE POLICY "account_earmarks: solo el propietario" ON account_earmarks
  FOR ALL USING (app_current_user_id() = user_id)
  WITH CHECK (app_current_user_id() = user_id);

-- ── income_distribution_rules / lines ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS income_distribution_rules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS income_distribution_lines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id    UUID NOT NULL REFERENCES income_distribution_rules(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  label      TEXT NOT NULL,
  percentage NUMERIC(8, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE income_distribution_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "income_distribution_rules: solo el propietario" ON income_distribution_rules;
CREATE POLICY "income_distribution_rules: solo el propietario" ON income_distribution_rules
  FOR ALL USING (app_current_user_id() = user_id)
  WITH CHECK (app_current_user_id() = user_id);

ALTER TABLE income_distribution_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "income_distribution_lines: via rule owner" ON income_distribution_lines;
CREATE POLICY "income_distribution_lines: via rule owner" ON income_distribution_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM income_distribution_rules r
      WHERE r.id = income_distribution_lines.rule_id
        AND r.user_id = app_current_user_id()
    )
  );

-- ── holdings (creada ad-hoc en Supabase; ver docs/diseno-fondos-rendimiento.md) ─
CREATE TABLE IF NOT EXISTS holdings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id      UUID REFERENCES accounts(id) ON DELETE SET NULL,
  ticker          TEXT,
  name            TEXT NOT NULL,
  asset_type      TEXT NOT NULL
    CHECK (asset_type IN ('accion', 'cedear', 'bono', 'fci', 'crypto', 'otro')),
  quantity        NUMERIC(18, 8) NOT NULL,
  avg_buy_price   NUMERIC(18, 6) NOT NULL,
  currency        TEXT NOT NULL CHECK (currency IN ('ARS', 'USD')),
  current_price   NUMERIC(18, 6),
  purchase_date   DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "holdings: solo el propietario" ON holdings;
CREATE POLICY "holdings: solo el propietario" ON holdings
  FOR ALL USING (app_current_user_id() = user_id)
  WITH CHECK (app_current_user_id() = user_id);

-- ⚠ RPCs de migración 012 (create_expense_with_balance, pay_installment,
-- delete_expense_with_balance, update_expense_with_balance) NO están en el repo.
-- Hay que reconstruirlas en Fase 3 antes de que gastos/cuotas funcionen en Railway.
