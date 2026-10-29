# Migración a Railway Postgres (sin Supabase) — Fases 1–3

> La app ya **no depende de Supabase**. Auth = Auth.js. Datos = Postgres vía
> `DATABASE_URL` (`src/lib/db/data-client.ts` + RPCs PL/pgSQL).

## Variables (Railway + `.env.local`)

| Variable | Obligatoria | Notas |
|---|---|---|
| `DATABASE_URL` | sí | URL del Postgres de Railway (secreta, sin `NEXT_PUBLIC_`) |
| `AUTH_SECRET` | sí | `openssl rand -base64 32` |
| `AUTH_URL` | sí en prod | `https://tu-app.up.railway.app` |
| `AUTH_RESET_LOG_LINKS` | recomendada | `1` para ver/loguear links de reset sin email |

**Ya no se usan** `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Orden SQL en el Postgres de Railway

```bash
npm run db:adapt-migrations
```

Después, en el SQL Editor / `psql "$DATABASE_URL"`:

1. `railway/migrations/000_bootstrap.sql` — `users` + `app_current_user_id()`
2. `railway/migrations/generated/001_initial_schema.sql`
3. `railway/migrations/002_schema_missing.sql` — holdings, cuotas, earmarks…
4. `railway/migrations/012_expense_balance_rpcs.sql` — **antes** de la 013
5. Resto de `railway/migrations/generated/` en orden (`004` … `030`)
6. `railway/migrations/031_password_reset_tokens.sql`

## Qué hace cada fase

| Fase | Estado | Contenido |
|---|---|---|
| 1 | ✅ | Drizzle, bootstrap `users`, migraciones adaptadas |
| 2 | ✅ | Auth.js (login/registro/reset), proxy sin Supabase Auth |
| 3 | ✅ | Data client Postgres, RPCs 012 reconstruidas, sacados `@supabase/*` |

## Arquitectura de datos (Fase 3)

- Server Components / Actions: `createClient()` en `src/lib/supabase/server.ts`
  → en realidad `createDataClient(userId)` (Postgres).
- Browser: **no** toca la DB; usa Server Actions.
- RPCs de plata: `callRpc` con `SET LOCAL app.current_user_id`.
- Filtro `user_id` automático en tablas con dueño (reemplazo de RLS).

## Checklist deploy

- [ ] SQL aplicado en orden
- [ ] Variables `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`
- [ ] Dominio público en Railway
- [ ] Registrarse en `/login` → ver Inicio vacío (base nueva)
- [ ] Crear una cuenta y un gasto de prueba

## Limitaciones conocidas

- El data-client soporta el subset de PostgREST que usa esta app (select/eq/or/
  embeds simples/rpc). Queries muy exóticas pueden requerir ampliar
  `src/lib/db/data-client.ts`.
- Sin email transaccional: reset de contraseña con `AUTH_RESET_LOG_LINKS=1`.
- Google OAuth no está en Auth.js todavía (solo email/password).
