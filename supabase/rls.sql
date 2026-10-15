-- Row Level Security for a future Supabase project using this Prisma schema.
-- Prisma keeps camelCase column names; identifiers are quoted.
-- Apply AFTER `prisma db push` against the Supabase DATABASE_URL.

alter table public.users enable row level security;
alter table public.birth_profiles enable row level security;
alter table public.purchases enable row level security;
alter table public.entitlements enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.email_logs enable row level security;
alter table public.analytics_events enable row level security;
alter table public.products enable row level security;
alter table public.product_translations enable row level security;
alter table public.unlock_rules enable row level security;
alter table public.interpretations enable row level security;
alter table public.pattern_rules enable row level security;
alter table public.site_settings enable row level security;
alter table public.webhook_events enable row level security;

create policy "users read self"
  on public.users for select
  using (auth.uid()::text = "authId" or auth.uid()::text = id);

create policy "users update self"
  on public.users for update
  using (auth.uid()::text = "authId" or auth.uid()::text = id);

create policy "profiles read own or unclaimed"
  on public.birth_profiles for select
  using (
    "userId" is null
    or "userId" in (select id from public.users where "authId" = auth.uid()::text)
  );

create policy "profiles write own"
  on public.birth_profiles for all
  using ("userId" in (select id from public.users where "authId" = auth.uid()::text));

create policy "purchases own"
  on public.purchases for select
  using ("userId" in (select id from public.users where "authId" = auth.uid()::text));

create policy "entitlements own"
  on public.entitlements for select
  using ("userId" in (select id from public.users where "authId" = auth.uid()::text));

create policy "catalog read"
  on public.products for select using (true);
create policy "catalog translations read"
  on public.product_translations for select using (true);
create policy "unlock rules read"
  on public.unlock_rules for select using (true);
create policy "interpretations read"
  on public.interpretations for select using (true);
create policy "pattern rules read"
  on public.pattern_rules for select using ("isActive" = true);
