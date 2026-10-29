# Deploy en Railway

> Stack actual (opción B): **Next.js en Railway + Postgres en Railway**.
> Sin Supabase. Guía completa de migraciones:
> [`docs/migrate-railway-postgres.md`](./migrate-railway-postgres.md).

## Qué ya está listo en el repo

- `railway.toml` — build (`npm ci && npm run build`) y start
- `package.json` → `start` escucha `0.0.0.0` y `$PORT`
- Auth.js + data client Postgres (`DATABASE_URL`)

## Pasos

1. Aplicá el SQL (ver `migrate-railway-postgres.md`).
2. En Railway → servicio app → **Variables**:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | referencia al Postgres del proyecto |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `AUTH_URL` | URL pública (`https://….up.railway.app`) |
   | `AUTH_RESET_LOG_LINKS` | `1` |

3. Rama **`main`**, GitHub conectado.
4. **Networking → Generate Domain**.
5. Abrí la URL → `/login` → Registrate.

## Si falla el build

- Node ≥ 20 (`engines` en `package.json`).
- `AUTH_SECRET` y `DATABASE_URL` tienen que existir en el servicio **antes** del build
  (Next puede evaluar módulos que las leen).
- Puerto: no hardcodear `3000`; Railway setea `PORT`.
