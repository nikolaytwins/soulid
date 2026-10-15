# Supabase architecture

The app talks to **PostgreSQL through Prisma**. Supabase Cloud is that same Postgres plus Auth, Storage and PostgREST.

## Local (this machine)

`npm run db:up` starts an embedded Postgres with the same schema you will later push to Supabase. If Docker is available, `docker compose up -d db` is equivalent.

```
DATABASE_URL=postgresql://soul:soul@localhost:5432/soulstar?schema=public
```

Auth.js email/password writes into `public.users`. Stars (`birth_profiles`) are attached to `users.id`.

## Supabase Cloud

1. Create a project.
2. Put the URI from Project Settings → Database into `DATABASE_URL`.
3. `npx prisma db push && npx tsx prisma/seed.ts`
4. Fill:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

5. Run `supabase/rls.sql` in the SQL editor if you will also use the JS client / PostgREST.

## Leaving Supabase later

Point `DATABASE_URL` at any Postgres (VPS, RDS, Neon). Prisma models do not depend on Supabase APIs. `auth_id` is reserved for a future Supabase Auth link and can stay null.

Leaving Auth.js in place means users keep working after the move. Switching login to Supabase Auth later is an adapter change, not a data rewrite: copy `auth.users.id` into `users.auth_id`.
