-- Storefront social proof, made real rather than hardcoded.
--
-- The Landing design ships an invented testimonial ("Aline M. — Kacyiru") and
-- three invented figures (41,208 orders / 4h 12m / 1.8% return rate). Rather
-- than publish claims we cannot stand behind, both become admin-managed
-- content: the landing page renders only published rows, and each section
-- hides entirely when there are none.
--
-- Values are TEXT on purpose. Real headline figures are things like "4h 12m"
-- and "1.8%", which are not numbers.
--
-- Additive and idempotent: safe to run on a live database.

create table if not exists public.testimonials (
  id uuid primary key default uuid_generate_v4(),
  author_name text not null check (char_length(author_name) between 1 and 120),
  author_location text check (char_length(author_location) <= 120),
  -- e.g. "3rd order this month" — optional supporting detail
  context text check (char_length(context) <= 160),
  body text not null check (char_length(body) between 1 and 1000),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_metrics (
  id uuid primary key default uuid_generate_v4(),
  label text not null check (char_length(label) between 1 and 80),
  value text not null check (char_length(value) between 1 and 40),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_testimonials_published
  on public.testimonials (is_published, sort_order);
create index if not exists idx_store_metrics_published
  on public.store_metrics (is_published, sort_order);

alter table public.testimonials enable row level security;
alter table public.store_metrics enable row level security;

-- Anyone may read published rows; the storefront is public.
drop policy if exists "Public read published testimonials" on public.testimonials;
create policy "Public read published testimonials" on public.testimonials
  for select using (is_published = true);

drop policy if exists "Public read published metrics" on public.store_metrics;
create policy "Public read published metrics" on public.store_metrics
  for select using (is_published = true);

-- Admins manage everything, matching how the other policies here test role.
drop policy if exists "Admin manage testimonials" on public.testimonials;
create policy "Admin manage testimonials" on public.testimonials
  for all using ((select role from public.users where id = auth.uid()) = 'admin');

drop policy if exists "Admin manage metrics" on public.store_metrics;
create policy "Admin manage metrics" on public.store_metrics
  for all using ((select role from public.users where id = auth.uid()) = 'admin');

drop trigger if exists testimonials_updated_at on public.testimonials;
create trigger testimonials_updated_at before update on public.testimonials
  for each row execute function update_updated_at();

drop trigger if exists store_metrics_updated_at on public.store_metrics;
create trigger store_metrics_updated_at before update on public.store_metrics
  for each row execute function update_updated_at();

-- "Est. 2019" in the design's hero badge. Nullable: the badge is omitted
-- until a real year is set.
alter table public.site_settings
  add column if not exists founded_year integer
  check (founded_year is null or founded_year between 1900 and 2100);

comment on table public.testimonials is
  'Customer quotes shown on the storefront. Only is_published rows are rendered.';
comment on table public.store_metrics is
  'Admin-curated headline figures. Values are text ("4h 12m", "1.8%").';

-- The design's footer has an email capture. Without somewhere to put the
-- address the form would silently discard it, so give it a home.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique check (position('@' in email) > 1),
  source text,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Inserts go through the service role in /api/newsletter, never the browser,
-- so no public policy is granted here. Admins may read the list.
drop policy if exists "Admin read subscribers" on public.newsletter_subscribers;
create policy "Admin read subscribers" on public.newsletter_subscribers
  for select using ((select role from public.users where id = auth.uid()) = 'admin');

comment on table public.newsletter_subscribers is
  'Footer email capture. Written server-side only.';
