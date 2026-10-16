-- Only for databases where an older schema.sql was already run.
-- The role is now read from app_metadata (writable only with the service role key)
-- instead of user_metadata (writable by anyone through the public sign-up API).
-- Run in Supabase > SQL Editor, then redeploy: supabase functions deploy create-user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, company_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    coalesce(new.raw_app_meta_data->>'role', 'customer')
  );
  return new;
end; $$;
