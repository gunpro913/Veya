-- Shared exercise images: public read, admin-only write.
-- The admin role is checked server-side through public.veya_is_admin().

create table if not exists public.exercise_images (
  exercise_id text primary key,
  start_url text,
  end_url text,
  muscle_map_url text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.exercise_images enable row level security;

revoke all on table public.exercise_images from anon, authenticated;
grant select on table public.exercise_images to anon, authenticated;
grant insert, update, delete on table public.exercise_images to authenticated;

drop policy if exists "exercise_images_public_read" on public.exercise_images;
create policy "exercise_images_public_read"
on public.exercise_images
for select
to anon, authenticated
using (true);

drop policy if exists "exercise_images_admin_insert" on public.exercise_images;
create policy "exercise_images_admin_insert"
on public.exercise_images
for insert
to authenticated
with check (public.veya_is_admin());

drop policy if exists "exercise_images_admin_update" on public.exercise_images;
create policy "exercise_images_admin_update"
on public.exercise_images
for update
to authenticated
using (public.veya_is_admin())
with check (public.veya_is_admin());

drop policy if exists "exercise_images_admin_delete" on public.exercise_images;
create policy "exercise_images_admin_delete"
on public.exercise_images
for delete
to authenticated
using (public.veya_is_admin());

create or replace function public.veya_stamp_exercise_image_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists stamp_exercise_image_update on public.exercise_images;
create trigger stamp_exercise_image_update
before insert or update on public.exercise_images
for each row execute function public.veya_stamp_exercise_image_update();
