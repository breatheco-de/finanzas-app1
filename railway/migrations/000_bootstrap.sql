-- ============================================================
-- Railway Postgres — Bootstrap (Fase 1)
-- Reemplaza el esquema auth de Supabase.
-- Correr PRIMERO, antes que cualquier migración adaptada.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuarios de la app (Auth.js / Lucia en Fase 2).
-- Reemplaza auth.users de Supabase.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Equivalente a auth.uid() de Supabase.
-- La app debe hacer: SET LOCAL app.current_user_id = '<uuid>';
-- antes de queries/RPCs que usen RLS o app_current_user_id().
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

COMMENT ON FUNCTION app_current_user_id() IS
  'Session user for RLS/RPCs. Set with: SET LOCAL app.current_user_id = ''<uuid>'';';
