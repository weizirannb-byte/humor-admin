-- Week 6: admin area for the Three Takes database.
-- Run once in the Supabase SQL Editor of the Three Takes project.
-- Everything runs in one transaction: if any statement fails, nothing changes.

-- ───────────────────────── Who is an admin ─────────────────────────

alter table public.profiles
  add column is_superadmin boolean not null default false;

-- Nobody can make themselves an admin through the website or the API.
-- Requests from the app run as the "anon" or "authenticated" database roles;
-- for them this trigger forces new profiles to false and rejects any change.
-- Only the project owner (the SQL Editor, role "postgres") can flip the flag.
create function public.protect_superadmin_flag()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_superadmin := false;
    elsif new.is_superadmin is distinct from old.is_superadmin then
      raise exception 'is_superadmin can only be changed by the project owner'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_superadmin
  before insert or update on public.profiles
  for each row execute function public.protect_superadmin_flag();

revoke execute on function public.protect_superadmin_flag() from public, anon, authenticated;

-- "Is the person making this request an admin?" Used inside the policies below.
-- security definer: it reads the flag even though profiles are private.
create function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_superadmin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.is_superadmin() from public, anon;
grant execute on function public.is_superadmin() to authenticated;

-- ───────────────────────── What admins may do ─────────────────────────
-- These are extra policies. Policies of the same kind are OR-ed, so normal
-- users keep exactly the access they had; admins get the extra rows.

-- READ users/profiles
create policy "Admins can read all profiles"
  on public.profiles for select to authenticated
  using ((select public.is_superadmin()));

-- CREATE / UPDATE / DELETE AI-generated captions (READ was already public)
create policy "Admins can add captions to any post"
  on public.captions for insert to authenticated
  with check ((select public.is_superadmin()));

create policy "Admins can edit captions"
  on public.captions for update to authenticated
  using ((select public.is_superadmin()))
  with check ((select public.is_superadmin()));

create policy "Admins can delete captions"
  on public.captions for delete to authenticated
  using ((select public.is_superadmin()));

-- The grants open the actions; the policies above limit them to admins.
-- upvotes / downvotes stay out of reach: only the vote trigger changes them.
grant update (voice, content, prompt, model) on public.captions to authenticated;
grant delete on public.captions to authenticated;

-- READ upvotes / downvotes
create policy "Admins can read all caption votes"
  on public.caption_votes for select to authenticated
  using ((select public.is_superadmin()));

create policy "Admins can read all joke votes"
  on public.joke_votes for select to authenticated
  using ((select public.is_superadmin()));

-- ───────────────────────── Bootstrapping ─────────────────────────
-- The admin area needs an admin, but nobody can grant it from the app.
-- The way in: the project owner sets the flag here, in the SQL Editor:
--
--   update public.profiles set is_superadmin = true
--   where email = 'your-email@example.com';
