-- ============================================================
-- Migración 012 (reconstruida para Railway) — RPCs de gastos/cuotas
-- No existía en el repo (corrida ad-hoc en Supabase). Reconstruida
-- desde call sites + CLAUDE.md / lecciones. Usa app_current_user_id()
-- y apply_balance_delta (migración 028 adaptada).
--
-- Orden: después de 002_schema_missing y de generated/028 (apply_balance_delta).
-- Si 028 todavía no corrió, apply_balance_delta se define acá como fallback.
-- ============================================================

CREATE OR REPLACE FUNCTION apply_balance_delta(
  p_account_id UUID,
  p_delta      NUMERIC
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_holding_id UUID;
  v_price      NUMERIC;
  v_qty        NUMERIC;
  v_new_qty    NUMERIC;
BEGIN
  IF p_delta = 0 THEN RETURN; END IF;

  SELECT holding_id INTO v_holding_id
  FROM accounts
  WHERE id = p_account_id AND user_id = app_current_user_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta % no encontrada o sin permisos', p_account_id;
  END IF;

  IF v_holding_id IS NULL THEN
    UPDATE accounts SET balance = balance + p_delta
    WHERE id = p_account_id AND user_id = app_current_user_id();
    RETURN;
  END IF;

  SELECT quantity, current_price INTO v_qty, v_price
  FROM holdings WHERE id = v_holding_id FOR UPDATE;

  IF v_price IS NULL OR v_price <= 0 THEN
    RAISE EXCEPTION 'La cuenta % está vinculada a un holding sin precio', p_account_id;
  END IF;

  v_new_qty := v_qty + (p_delta / v_price);
  IF v_new_qty < 0 THEN
    RAISE EXCEPTION 'Cantidad de holding negativa en cuenta %', p_account_id;
  END IF;

  UPDATE holdings SET quantity = v_new_qty WHERE id = v_holding_id;
  UPDATE accounts SET balance = v_new_qty * v_price WHERE id = p_account_id;
END;
$$;

-- ─── create_expense_with_balance ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_expense_with_balance(
  p_expense       JSONB,
  p_installments  JSONB DEFAULT '[]'::jsonb,
  p_earmark       JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_id UUID;
  v_uid UUID := app_current_user_id();
  v_method TEXT := COALESCE(p_expense->>'payment_method', 'debito');
  v_account UUID;
  v_covering UUID;
  v_funding UUID;
  v_amount NUMERIC := (p_expense->>'amount')::numeric;
  v_inst JSONB;
  v_last_due DATE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  v_account := NULLIF(p_expense->>'account_id', '')::uuid;
  v_covering := NULLIF(p_expense->>'covering_account_id', '')::uuid;
  v_funding := NULLIF(p_expense->>'funding_account_id', '')::uuid;

  INSERT INTO expenses (
    user_id, account_id, category_id, amount, currency, description, merchant,
    date, source, payment_method, installments_total, installment_amount,
    covering_account_id, funding_account_id
  ) VALUES (
    v_uid,
    v_account,
    NULLIF(p_expense->>'category_id', '')::uuid,
    v_amount,
    p_expense->>'currency',
    p_expense->>'description',
    p_expense->>'merchant',
    (p_expense->>'date')::date,
    COALESCE(p_expense->>'source', 'app'),
    v_method,
    NULLIF(p_expense->>'installments_total', '')::int,
    NULLIF(p_expense->>'installment_amount', '')::numeric,
    v_covering,
    v_funding
  )
  RETURNING id INTO v_id;

  -- Efectivo / débito / transferencia: sale la plata ya
  IF v_method IS DISTINCT FROM 'credito' THEN
    IF v_account IS NULL THEN
      RAISE EXCEPTION 'Falta account_id para gasto no-crédito';
    END IF;
    PERFORM apply_balance_delta(v_account, -v_amount);
  END IF;

  -- Cuotas
  IF v_method = 'credito' AND jsonb_array_length(COALESCE(p_installments, '[]'::jsonb)) > 0 THEN
    FOR v_inst IN SELECT * FROM jsonb_array_elements(p_installments)
    LOOP
      INSERT INTO installments (expense_id, installment_number, amount, due_date)
      VALUES (
        v_id,
        (v_inst->>'installment_number')::int,
        (v_inst->>'amount')::numeric,
        (v_inst->>'due_date')::date
      );
      v_last_due := (v_inst->>'due_date')::date;
    END LOOP;
  END IF;

  -- Earmark de cobertura
  IF p_earmark IS NOT NULL AND v_covering IS NOT NULL THEN
    IF v_funding IS NOT NULL THEN
      PERFORM apply_balance_delta(v_funding, -v_amount);
      PERFORM apply_balance_delta(v_covering, v_amount);
    END IF;

    INSERT INTO account_earmarks (
      user_id, account_id, amount, currency, reason, expense_id, release_date, released
    ) VALUES (
      v_uid,
      v_covering,
      COALESCE((p_earmark->>'amount')::numeric, v_amount),
      COALESCE(p_earmark->>'currency', p_expense->>'currency'),
      p_earmark->>'reason',
      v_id,
      NULLIF(p_earmark->>'release_date', '')::date,
      false
    );
  END IF;

  RETURN v_id;
END;
$$;

-- ─── pay_installment ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION pay_installment(
  p_installment_id UUID,
  p_account_id     UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_uid UUID := app_current_user_id();
  v_inst RECORD;
  v_exp RECORD;
  v_pay_from UUID;
  v_earmark RECORD;
  v_new_amt NUMERIC;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT i.* INTO v_inst
  FROM installments i
  JOIN expenses e ON e.id = i.expense_id
  WHERE i.id = p_installment_id AND e.user_id = v_uid
  FOR UPDATE OF i;

  IF NOT FOUND THEN RAISE EXCEPTION 'Cuota no encontrada'; END IF;
  IF v_inst.paid THEN RETURN; END IF;

  SELECT * INTO v_exp FROM expenses WHERE id = v_inst.expense_id;

  v_pay_from := COALESCE(v_exp.covering_account_id, p_account_id);
  IF v_pay_from IS NULL THEN
    RAISE EXCEPTION 'Falta cuenta para pagar la cuota';
  END IF;

  PERFORM apply_balance_delta(v_pay_from, -v_inst.amount);

  UPDATE installments
  SET paid = true, paid_date = CURRENT_DATE
  WHERE id = p_installment_id;

  -- Reducir earmark del expense
  SELECT * INTO v_earmark
  FROM account_earmarks
  WHERE expense_id = v_exp.id AND released = false AND user_id = v_uid
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    v_new_amt := v_earmark.amount - v_inst.amount;
    IF v_new_amt <= 0.009 THEN
      UPDATE account_earmarks
      SET amount = 0, released = true, released_date = CURRENT_DATE
      WHERE id = v_earmark.id;
    ELSE
      UPDATE account_earmarks SET amount = v_new_amt WHERE id = v_earmark.id;
    END IF;
  END IF;
END;
$$;

-- ─── delete_expense_with_balance ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION delete_expense_with_balance(
  p_expense_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_uid UUID := app_current_user_id();
  v_exp RECORD;
  v_unpaid NUMERIC;
BEGIN
  SELECT * INTO v_exp FROM expenses
  WHERE id = p_expense_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gasto no encontrado'; END IF;

  IF v_exp.payment_method = 'credito' THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_unpaid
    FROM installments WHERE expense_id = v_exp.id AND paid = false;

    IF v_exp.covering_account_id IS NOT NULL AND v_exp.funding_account_id IS NOT NULL THEN
      -- Había movimiento funding→covering: revertir solo lo impago
      IF v_unpaid > 0 THEN
        PERFORM apply_balance_delta(v_exp.covering_account_id, -v_unpaid);
        PERFORM apply_balance_delta(v_exp.funding_account_id, v_unpaid);
      END IF;
    END IF;
  ELSE
    IF v_exp.account_id IS NOT NULL THEN
      PERFORM apply_balance_delta(v_exp.account_id, v_exp.amount);
    END IF;
  END IF;

  DELETE FROM account_earmarks WHERE expense_id = v_exp.id;
  DELETE FROM installments WHERE expense_id = v_exp.id;
  DELETE FROM expenses WHERE id = v_exp.id;
END;
$$;

-- ─── update_expense_with_balance ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_expense_with_balance(
  p_expense_id UUID,
  p_updates    JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_uid UUID := app_current_user_id();
  v_exp RECORD;
  v_new_amount NUMERIC;
  v_diff NUMERIC;
BEGIN
  SELECT * INTO v_exp FROM expenses
  WHERE id = p_expense_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gasto no encontrado'; END IF;

  IF v_exp.payment_method = 'credito' AND p_updates ? 'amount' THEN
    RAISE EXCEPTION 'El monto de un gasto en cuotas no se puede editar';
  END IF;

  IF v_exp.payment_method IS DISTINCT FROM 'credito'
     AND p_updates ? 'amount'
     AND v_exp.account_id IS NOT NULL THEN
    v_new_amount := (p_updates->>'amount')::numeric;
    v_diff := v_new_amount - v_exp.amount;
    -- diff positivo = gastó más → debitar más
    PERFORM apply_balance_delta(v_exp.account_id, -v_diff);
  END IF;

  UPDATE expenses SET
    amount      = COALESCE((p_updates->>'amount')::numeric, amount),
    merchant    = CASE WHEN p_updates ? 'merchant' THEN p_updates->>'merchant' ELSE merchant END,
    description = CASE WHEN p_updates ? 'description' THEN p_updates->>'description' ELSE description END,
    category_id = CASE WHEN p_updates ? 'category_id'
      THEN NULLIF(p_updates->>'category_id', '')::uuid ELSE category_id END,
    date        = COALESCE((p_updates->>'date')::date, date)
  WHERE id = p_expense_id;
END;
$$;
