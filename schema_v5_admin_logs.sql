-- ════════════════════════════════════════════════════════════════
-- InternTrack — Schema Update 5 (Admin Logs)
-- Run this once in: supabase.com → your project → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

-- 1. Add is_admin flag to public.profiles
alter table public.profiles add column if not exists is_admin boolean default false;

-- 2. Allow admins to view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) );

-- 3. Create activity logs table
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text,
  action text not null, -- 'ADDED', 'MOVED', 'UPDATED', 'DELETED'
  company text not null,
  role text not null,
  details text,
  created_at timestamptz default now()
);

-- 4. RLS for activity_logs (Only Admins can read)
alter table public.activity_logs enable row level security;

create policy "Admins can read activity logs"
  on public.activity_logs for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) );

-- 5. Trigger Function to insert logs automatically
create or replace function log_internship_activity()
returns trigger language plpgsql security definer
as $$
declare
  u_email text;
begin
  -- Get user email from auth schema
  select email into u_email from auth.users where id = coalesce(new.user_id, old.user_id);

  if tg_op = 'INSERT' then
    insert into public.activity_logs (user_id, user_email, action, company, role, details)
    values (new.user_id, u_email, 'ADDED', new.company, new.role, 'Added to ' || new.status);
    
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
        insert into public.activity_logs (user_id, user_email, action, company, role, details)
        values (new.user_id, u_email, 'MOVED', new.company, new.role, 'Moved from ' || old.status || ' to ' || new.status);
    else
        insert into public.activity_logs (user_id, user_email, action, company, role, details)
        values (new.user_id, u_email, 'UPDATED', new.company, new.role, 'Updated application details');
    end if;

  elsif tg_op = 'DELETE' then
    insert into public.activity_logs (user_id, user_email, action, company, role, details)
    values (old.user_id, u_email, 'DELETED', old.company, old.role, 'Deleted application');
  end if;

  return coalesce(new, old);
end;
$$;

-- 6. Attach Trigger to internship_cards
drop trigger if exists on_internship_card_change on public.internship_cards;
create trigger on_internship_card_change
  after insert or update or delete on public.internship_cards
  for each row execute function log_internship_activity();
