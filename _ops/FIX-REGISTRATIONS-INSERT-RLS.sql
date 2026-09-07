-- AURA 2026 — make public registration INSERT work
-- Run ALL of this in Supabase → SQL → New query → Run

grant usage on schema public to anon, authenticated;
grant insert on table public.registrations to anon, authenticated;
grant select, update on table public.registrations to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter table public.registrations enable row level security;

-- Wipe old policies on this table and recreate cleanly
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'registrations'
  loop
    execute format('drop policy if exists %I on public.registrations', r.policyname);
  end loop;
end $$;

-- Public register form can INSERT
create policy "public_insert_registration"
  on public.registrations
  for insert
  to anon, authenticated
  with check (true);

-- Only shared CC login can READ
create policy "admin_select_all"
  on public.registrations
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'aura.cbit.cc@gmail.com');

-- Only shared CC login can UPDATE (verify/reject)
create policy "admin_update_all"
  on public.registrations
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'aura.cbit.cc@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'aura.cbit.cc@gmail.com');

-- Confirm what exists
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'registrations'
order by cmd, policyname;

notify pgrst, 'reload schema';
