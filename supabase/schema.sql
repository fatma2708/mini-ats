-- Mini ATS : schéma Supabase complet
-- À coller dans Supabase > SQL Editor > New query > Run

-- 1. Profils (un par utilisateur, rôle admin ou customer)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_name text,
  role text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz not null default now()
);

-- 2. Offres d'emploi
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  location text,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

-- 3. Candidats (rattachés à une offre)
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  linkedin_url text,
  cv_path text,          -- chemin du PDF dans le bucket "cvs"
  cv_text text,          -- texte extrait du CV, utilisé par l'IA
  notes text,
  stage text not null default 'applied'
    check (stage in ('applied','screening','interview','offer','hired','rejected')),
  ai_score int,
  ai_assessment jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.jobs(customer_id);
create index on public.candidates(customer_id);
create index on public.candidates(job_id);

-- 4. Fonction utilitaire : l'utilisateur courant est-il admin ?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 5. Création automatique du profil à l'inscription
-- Le rôle vient de app_metadata (modifiable seulement avec la clé service role,
-- donc par l'edge function create-user), jamais de user_metadata (modifiable par l'utilisateur).
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Mise à jour automatique de updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger candidates_updated_at before update on public.candidates
  for each row execute function public.touch_updated_at();

-- 7. Le customer_id d'un candidat est toujours celui de son offre
create or replace function public.set_candidate_customer()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select customer_id into new.customer_id from public.jobs where id = new.job_id;
  return new;
end; $$;

create trigger candidates_set_customer before insert or update of job_id on public.candidates
  for each row execute function public.set_candidate_customer();

-- 8. Row Level Security : chaque client ne voit que ses données, l'admin voit tout
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own (not role) or admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy "jobs: owner or admin" on public.jobs
  for all using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

create policy "candidates: owner or admin" on public.candidates
  for all using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

-- Empêche un client de se promouvoir admin
create or replace function public.protect_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end; $$;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

-- 9. Stockage des CV (bucket privé, un dossier par client : cvs/<customer_id>/...)
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false)
  on conflict (id) do nothing;

create policy "cvs: owner or admin read" on storage.objects for select
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "cvs: owner or admin write" on storage.objects for insert
  with check (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "cvs: owner or admin delete" on storage.objects for delete
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 10. Premier admin : inscris-toi d'abord dans l'app, puis lance :
-- update public.profiles set role = 'admin' where email = 'ton-email@exemple.com';
