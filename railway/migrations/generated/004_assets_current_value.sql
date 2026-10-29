-- AUTO-GENERADO por scripts/adapt-migrations-for-railway.mjs
-- Fuente: supabase/migrations/004_assets_current_value.sql
-- NO editar a mano — regenerar con npm run db:adapt-migrations.

-- Migración 004: campo current_value en assets
-- Permite al usuario sobreescribir el valor calculado automáticamente
-- (principio IAS 16.51 — override del usuario prevalece sobre el default calculado)
-- La app calcula: purchase_price × (1 − 0.16)^años (§1.3 Cao et al. 2025)
-- Si current_value IS NOT NULL, ese valor se usa para el cálculo de maintenance.

ALTER TABLE assets
  ADD COLUMN current_value NUMERIC(18, 2) NULL;
