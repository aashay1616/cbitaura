-- AURA 2026 — fix payment screenshot uploads (run ALL of this in Supabase SQL Editor)
-- Root cause: storage RLS was blocking anon uploads (not file size)

-- 1) Ensure bucket exists + limits
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Recreate storage policies (drop old ones first)
drop policy if exists "anon_upload_payment" on storage.objects;
drop policy if exists "anon_update_payment" on storage.objects;
drop policy if exists "anon_select_own_payment" on storage.objects;
drop policy if exists "admin_read_payment" on storage.objects;
drop policy if exists "admin_update_payment" on storage.objects;
drop policy if exists "admin_delete_payment" on storage.objects;

-- Captains / public form can UPLOAD screenshots
create policy "anon_upload_payment"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

-- Needed when client sends x-upsert / retries
create policy "anon_update_payment"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'payment-proofs')
  with check (bucket_id = 'payment-proofs');

-- Allow reading objects in this bucket for authenticated admins
create policy "admin_read_payment"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs');

create policy "admin_update_payment"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'payment-proofs')
  with check (bucket_id = 'payment-proofs');

-- Optional: let anon read only to verify upload (can remove later)
create policy "anon_select_payment"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'payment-proofs');
