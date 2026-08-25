-- Adds the two columns the payment work needs.
--
-- 1. orders.payment_method  — distinguishes Cash on Delivery from MoMo.
--    Without it a COD order is indistinguishable from an unpaid MoMo one.
-- 2. orders.momo_reason     — MTN's failure reason (e.g. APPROVAL_REJECTED),
--    so support can tell a customer why a payment failed. MTN returns this
--    on a failed requesttopay status; nothing currently stores it.
--
-- Both are additive and nullable, so existing rows and running code are
-- unaffected. Safe to run on a live database.

alter table public.orders
  add column if not exists payment_method text not null default 'momo';

alter table public.orders
  add column if not exists momo_reason text;

-- Constrain to the methods the app actually supports.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_method_check'
  ) then
    alter table public.orders
      add constraint orders_payment_method_check
      check (payment_method in ('momo', 'cod'));
  end if;
end $$;

comment on column public.orders.payment_method is
  'How the customer chose to pay: momo (MTN Mobile Money) or cod (Cash on Delivery).';
comment on column public.orders.momo_reason is
  'MTN reason code from a failed request-to-pay, surfaced to admin for support.';

create index if not exists orders_payment_method_idx
  on public.orders (payment_method);
