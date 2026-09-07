-- Run once in Supabase → SQL Editor if screenshot uploads fail from phones
-- Raises payment-proofs limit to 10MB and allows common mobile image types

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/octet-stream'
  ]
where id = 'payment-proofs';
