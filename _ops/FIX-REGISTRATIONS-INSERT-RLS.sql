-- Run in Supabase → SQL Editor (NEW query)
-- Fixes: "new row violates row-level security policy for table registrations"
-- Allows the public register form (anon key) to INSERT pending teams

-- Ensure RLS is on
alter table public.registrations enable row level security;

-- Public form can create rows
drop policy if exists "public_insert_registration" on public.registrations;
create policy "public_insert_registration"
  on public.registrations for insert
  to anon, authenticated
  with check (true);

-- Shared CC admin can read all
drop policy if exists "admin_select_all" on public.registrations;
create policy "admin_select_all"
  on public.registrations for select
  to authenticated
  using (
    auth.jwt() ->> 'email' in (
      'aura.cbit.cc@gmail.com'
    )
  );

-- Shared CC admin can update (verify / reject)
drop policy if exists "admin_update_all" on public.registrations;
create policy "admin_update_all"
  on public.registrations for update
  to authenticated
  using (
    auth.jwt() ->> 'email' in (
      'aura.cbit.cc@gmail.com'
    )
  )
  with check (
    auth.jwt() ->> 'email' in (
      'aura.cbit.cc@gmail.com'
    )
  );

notify pgrst, 'reload schema';
