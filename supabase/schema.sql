-- AURA 2026 registrations — run in Supabase SQL editor when going live
-- Form: sport → name/phone/email/college/PD → fee + QR payment → pending

create extension if not exists "pgcrypto";

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  college_name text not null,
  sport text not null,
  category text not null check (category in ('men', 'women')),

  -- Captain / team contact
  captain_name text not null,
  captain_phone text not null,
  captain_email text not null,

  -- College Physical Director / sports in-charge
  pd_name text not null,
  pd_phone text not null,

  -- Optional roster (future; form does not collect yet)
  players jsonb not null default '[]'::jsonb,

  -- Fees (from config at submit) & payment proof
  fee_expected numeric,
  payment_txn_id text,
  payment_amount text,
  payment_screenshot_path text,
  payment_screenshot_url text,

  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  admin_note text,
  verified_at timestamptz,
  verified_by text,
  confirmation_sent_at timestamptz,

  ref_code text unique
);

create index if not exists registrations_status_idx on public.registrations (status);
create index if not exists registrations_sport_idx on public.registrations (sport);
create index if not exists registrations_created_idx on public.registrations (created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists registrations_updated on public.registrations;
create trigger registrations_updated
  before update on public.registrations
  for each row execute function public.set_updated_at();

create or replace function public.gen_ref_code()
returns trigger language plpgsql as $$
begin
  if new.ref_code is null or new.ref_code = '' then
    new.ref_code := 'AURA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_ref on public.registrations;
create trigger registrations_ref
  before insert on public.registrations
  for each row execute function public.gen_ref_code();

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

alter table public.registrations enable row level security;

drop policy if exists "public_insert_registration" on public.registrations;
create policy "public_insert_registration"
  on public.registrations for insert
  to anon, authenticated
  with check (true);

-- Replace placeholder emails with real organiser Gmail/college logins
-- (must match Supabase Auth users + js/config.js ADMIN_EMAILS)
drop policy if exists "admin_select_all" on public.registrations;
create policy "admin_select_all"
  on public.registrations for select
  to authenticated
  using (
    auth.jwt() ->> 'email' in (
      'aashayrajgrandhi@gmail.com'
      -- add more: , 'parin@…', 'sohan@…'
    )
  );

drop policy if exists "admin_update_all" on public.registrations;
create policy "admin_update_all"
  on public.registrations for update
  to authenticated
  using (
    auth.jwt() ->> 'email' in (
      'aashayrajgrandhi@gmail.com'
    )
  );

create or replace function public.get_registration_status(p_ref text, p_email text)
returns table (
  ref_code text,
  status text,
  college_name text,
  sport text,
  category text,
  created_at timestamptz,
  admin_note text
)
language sql security definer set search_path = public as $$
  select r.ref_code, r.status, r.college_name, r.sport, r.category, r.created_at, r.admin_note
  from public.registrations r
  where r.ref_code = p_ref and lower(r.captain_email) = lower(p_email)
  limit 1;
$$;

grant execute on function public.get_registration_status(text, text) to anon, authenticated;

drop policy if exists "anon_upload_payment" on storage.objects;
create policy "anon_upload_payment"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

drop policy if exists "admin_read_payment" on storage.objects;
create policy "admin_read_payment"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs');
