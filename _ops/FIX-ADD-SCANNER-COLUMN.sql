-- Run in Supabase → SQL Editor
-- Fixes: Could not find the 'payment_scanner_id' column of 'registrations'

alter table public.registrations
  add column if not exists payment_scanner_id text;

-- refresh PostgREST schema cache (usually automatic; this helps)
notify pgrst, 'reload schema';
