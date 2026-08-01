-- AURA 2026 registration schema (run in Supabase SQL editor)
-- Project: create free project at https://supabase.com

-- Extensions
create extension if not exists "pgcrypto";

-- Registrations
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Team / college
  college_name text not null,
  sport text not null,
  category text not null check (category in ('men', 'women')),
  team_name text,

  -- Captain
  captain_name text not null,
  captain_phone text not null,
  captain_email text not null,

  -- Players as JSON array: [{ "name": "...", "phone": "..." }]
  players jsonb not null default '[]'::jsonb,

  -- Payment
  payment_txn_id text,
  payment_amount text,
  payment_screenshot_path text,
  payment_screenshot_url text,

  -- Workflow
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  admin_note text,
  verified_at timestamptz,
  verified_by text,
  confirmation_sent_at timestamptz,

  -- Tracking
  ref_code text unique
);

create index if not exists registrations_status_idx on public.registrations (status);
create index if not exists registrations_sport_idx on public.registrations (sport);
create index if not exists registrations_created_idx on public.registrations (created_at desc);

-- Auto-update updated_at
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

-- Generate short ref code
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

-- Storage bucket for payment screenshots (run in dashboard or via API)
-- Storage → New bucket: payment-proofs  (public read OR signed URLs)
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- RLS
alter table public.registrations enable row level security;

-- Anyone can insert a new registration (public form)
create policy "public_insert_registration"
  on public.registrations for insert
  to anon, authenticated
  with check (true);

-- Anyone can read their own by ref_code + email via RPC preferred;
-- For admin: authenticated users in admin list
create policy "admin_select_all"
  on public.registrations for select
  to authenticated
  using (
    auth.jwt() ->> 'email' in (
      -- Add organiser emails here (must match Supabase Auth users)
      'admin@example.com'
    )
  );

create policy "admin_update_all"
  on public.registrations for update
  to authenticated
  using (
    auth.jwt() ->> 'email' in (
      'admin@example.com'
    )
  );

-- Public can select only with exact ref match via security definer function
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
language sql
security definer
set search_path = public
as $$
  select r.ref_code, r.status, r.college_name, r.sport, r.category, r.created_at, r.admin_note
  from public.registrations r
  where r.ref_code = p_ref
    and lower(r.captain_email) = lower(p_email)
  limit 1;
$$;

grant execute on function public.get_registration_status(text, text) to anon, authenticated;

-- Storage policies: anon can upload payment proofs
create policy "anon_upload_payment"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

create policy "admin_read_payment"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs');

-- Optional: Edge Function "send-confirmation" on status change to verified
-- Deploy with Resend/SendGrid API key — see REGISTRATION-SYSTEM.md
