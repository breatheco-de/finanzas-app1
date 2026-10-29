# Migraciones adaptadas para Railway Postgres

Generadas desde `supabase/migrations/`. No editar a mano.

## Orden de aplicación

1. `../000_bootstrap.sql` — users + `app_current_user_id()`
2. `001_initial_schema.sql` (este folder)
3. `../002_schema_missing.sql` — tablas que solo existían en Supabase vivo
4. El resto de este folder en orden (`004` … `030`)

```bash
npm run db:adapt-migrations
```
