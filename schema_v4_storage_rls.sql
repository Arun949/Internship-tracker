-- ════════════════════════════════════════════════════════════════
-- InternTrack — Schema Update 4
-- Fix Storage RLS Policy for 'resumes' bucket
-- Run this once in: supabase.com → your project → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

-- 1. Ensure the bucket exists and is public (if not already done via UI)
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

-- 2. Allow ANYONE to view/download resumes
create policy "Public Access to Resumes"
  on storage.objects for select
  using ( bucket_id = 'resumes' );

-- 3. Allow LOGGED IN users to upload their own resumes
create policy "Authenticated Users can Upload Resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' 
    and auth.role() = 'authenticated'
  );

-- 4. Allow users to UPDATE their own resumes
create policy "Users can Update own Resumes"
  on storage.objects for update
  using (
    bucket_id = 'resumes' 
    and auth.uid() = owner
  );
