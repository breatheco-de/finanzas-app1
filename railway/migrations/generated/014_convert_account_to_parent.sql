-- AUTO-GENERADO por scripts/adapt-migrations-for-railway.mjs
-- Fuente: supabase/migrations/014_convert_account_to_parent.sql
-- NO editar a mano — regenerar con npm run db:adapt-migrations.

-- Migration 014: RPC para convertir una cuenta simple en cuenta con bolsillos.
-- Crea un bolsillo inicial, mueve el saldo, reasigna todos los registros dependientes.
-- SECURITY INVOKER — RLS aplica normalmente.

CREATE OR REPLACE FUNCTION convert_account_to_parent(
  p_account_id  UUID,
  p_bolsillo_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_account accounts%ROWTYPE;
  v_child_id UUID;
BEGIN
  -- Lock y fetch de la cuenta (verifica que pertenece al usuario vía RLS)
  SELECT * INTO v_account
  FROM accounts
  WHERE id = p_account_id
    AND user_id = app_current_user_id()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta no encontrada o no autorizado';
  END IF;

  -- No convertir si ya tiene hijos
  IF EXISTS (SELECT 1 FROM accounts WHERE parent_id = p_account_id LIMIT 1) THEN
    RAISE EXCEPTION 'La cuenta ya tiene bolsillos';
  END IF;

  -- Crear el bolsillo inicial con el saldo completo del padre
  INSERT INTO accounts (user_id, name, type, currency, balance, parent_id)
  VALUES (
    v_account.user_id,
    p_bolsillo_name,
    v_account.type,
    v_account.currency,
    v_account.balance,
    p_account_id
  )
  RETURNING id INTO v_child_id;

  -- Vaciar el padre (pasa a ser contenedor)
  UPDATE accounts SET balance = 0 WHERE id = p_account_id;

  -- Reasignar gastos
  UPDATE expenses
  SET account_id = v_child_id
  WHERE account_id = p_account_id AND user_id = app_current_user_id();

  UPDATE expenses
  SET covering_account_id = v_child_id
  WHERE covering_account_id = p_account_id AND user_id = app_current_user_id();

  UPDATE expenses
  SET funding_account_id = v_child_id
  WHERE funding_account_id = p_account_id AND user_id = app_current_user_id();

  -- Reasignar earmarks
  UPDATE account_earmarks
  SET account_id = v_child_id
  WHERE account_id = p_account_id AND user_id = app_current_user_id();

  -- Reasignar ingresos
  UPDATE incomes
  SET account_id = v_child_id
  WHERE account_id = p_account_id AND user_id = app_current_user_id();

  -- Reasignar metas de ahorro
  UPDATE savings_goals
  SET account_id = v_child_id
  WHERE account_id = p_account_id AND user_id = app_current_user_id();

  -- Reasignar contribuciones de ahorro
  UPDATE savings_contributions
  SET account_id = v_child_id
  WHERE account_id = p_account_id AND user_id = app_current_user_id();

  -- Reasignar líneas de distribución de ingresos
  UPDATE income_distribution_lines
  SET account_id = v_child_id
  WHERE account_id = p_account_id
    AND rule_id IN (
      SELECT id FROM income_distribution_rules WHERE user_id = app_current_user_id()
    );

  RETURN v_child_id;
END;
$$;
