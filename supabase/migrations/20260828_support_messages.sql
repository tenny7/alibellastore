-- Support messaging: per-order conversation threads between customer and admin.
-- Ported from the Lumiere implementation, adapted to this schema (users, not
-- profiles; inline admin subqueries, since there is no is_admin() helper here).
--
-- Additive and idempotent: safe to run on a live database.

create table if not exists public.support_messages (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  sender_role text not null check (sender_role in ('admin', 'customer')),
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_messages_order
  on public.support_messages (order_id, created_at);
create index if not exists idx_support_messages_unread
  on public.support_messages (order_id) where read_at is null;

alter table public.support_messages enable row level security;

-- Customers may read messages on their own orders.
drop policy if exists "Customers read own order messages" on public.support_messages;
create policy "Customers read own order messages" on public.support_messages
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = support_messages.order_id and o.customer_id = auth.uid()
    )
  );

-- Customers may send, as 'customer', on their own orders.
drop policy if exists "Customers send on own orders" on public.support_messages;
create policy "Customers send on own orders" on public.support_messages
  for insert with check (
    sender_role = 'customer'
    and sender_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = support_messages.order_id and o.customer_id = auth.uid()
    )
  );

-- Customers may mark messages on their own orders as read.
drop policy if exists "Customers update own order messages" on public.support_messages;
create policy "Customers update own order messages" on public.support_messages
  for update using (
    exists (
      select 1 from public.orders o
      where o.id = support_messages.order_id and o.customer_id = auth.uid()
    )
  );

-- Admins have full access, matching how the other policies here test role.
drop policy if exists "Admin manage support messages" on public.support_messages;
create policy "Admin manage support messages" on public.support_messages
  for all using ((select role from public.users where id = auth.uid()) = 'admin');

-- Kill switch for abusive senders. A blocked customer can still read their
-- threads but cannot send; enforced in /api/support/messages.
alter table public.users
  add column if not exists support_blocked boolean not null default false;
alter table public.users
  add column if not exists support_blocked_at timestamptz;

comment on table public.support_messages is
  'Per-order support conversation between a customer and store admins.';
