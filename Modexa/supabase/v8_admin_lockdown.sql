-- Modexa v8 — admin lockdown + rate limits (ALREADY APPLIED to project modexa; kept here for reference)
-- * Only cybersentinel23@gmail.com and hanzlaworkspace@gmail.com are admins (they reuse the previous admin password hash).
-- * admin@modexa.local is removed from admin_users and banned (undo: update auth.users set banned_until=null ...; re-insert into admin_users).
-- * is_modexa_admin() now also checks the signed-in email against the allow-list.
-- * contact_messages / submissions: max 5 inserts per IP per hour (trigger limit_public_insert, table rate_hits).
create or replace function public.is_modexa_admin() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid())
     and lower(coalesce(auth.jwt() ->> 'email','')) in ('cybersentinel23@gmail.com','hanzlaworkspace@gmail.com');
$$;
