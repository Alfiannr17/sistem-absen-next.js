-- Jalankan di Supabase SQL Editor.
-- Model data: dosen membuat kelas, dosen membuat pertemuan di dalam kelas,
-- lalu absensi mahasiswa disimpan per pertemuan.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text not null check (role in ('mahasiswa', 'dosen')),
  nim text,
  nidn text,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  course_name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

-- Kompatibilitas jika schema lama sudah pernah dibuat.
alter table public.classes add column if not exists created_at timestamptz not null default now();
alter table public.classes add column if not exists attendance_start time;
alter table public.classes add column if not exists attendance_end time;
alter table public.classes add column if not exists late_after_minutes integer;
alter table public.classes alter column attendance_start drop not null;
alter table public.classes alter column attendance_end drop not null;
alter table public.classes drop constraint if exists classes_time_check;

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint enrollments_unique unique (class_id, student_id)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  meeting_date date not null,
  attendance_start time not null,
  attendance_end time not null,
  late_after_minutes integer not null default 15 check (late_after_minutes >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint meetings_time_check check (attendance_start < attendance_end)
);

create index if not exists meetings_class_id_idx on public.meetings(class_id);
create index if not exists meetings_active_idx on public.meetings(class_id, is_active);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present', 'late')),
  attended_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.attendance add column if not exists meeting_id uuid references public.meetings(id) on delete cascade;
alter table public.attendance drop constraint if exists attendance_unique_daily;
drop index if exists attendance_unique_daily;
create unique index if not exists attendance_unique_meeting_student
on public.attendance(meeting_id, student_id)
where meeting_id is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, nim, nidn)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'mahasiswa'),
    new.raw_user_meta_data->>'nim',
    new.raw_user_meta_data->>'nidn'
  )
  on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    nim = excluded.nim,
    nidn = excluded.nidn;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_dosen(user_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = user_id
      and profiles.role = 'dosen'
  )
  or exists (
    select 1 from auth.users
    where users.id = user_id
      and users.raw_user_meta_data->>'role' = 'dosen'
  );
$$;

create or replace function public.is_mahasiswa(user_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = user_id
      and profiles.role = 'mahasiswa'
  )
  or exists (
    select 1 from auth.users
    where users.id = user_id
      and users.raw_user_meta_data->>'role' = 'mahasiswa'
  );
$$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.meetings enable row level security;
alter table public.attendance enable row level security;

-- GRANT ini yang memperbaiki error "permission denied for table profiles".
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.enrollments to authenticated;
grant select, insert, update, delete on public.meetings to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
grant execute on function public.is_dosen(uuid) to authenticated;
grant execute on function public.is_mahasiswa(uuid) to authenticated;

drop policy if exists "Authenticated can read profiles" on public.profiles;
create policy "Authenticated can read profiles"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Authenticated can find classes" on public.classes;
create policy "Authenticated can find classes"
on public.classes for select
to authenticated
using (true);

drop policy if exists "Dosen can create own classes" on public.classes;
create policy "Dosen can create own classes"
on public.classes for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and public.is_dosen(auth.uid())
);

drop policy if exists "Dosen can update own classes" on public.classes;
create policy "Dosen can update own classes"
on public.classes for update
to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

drop policy if exists "Enrollment readable by owner or teacher" on public.enrollments;
create policy "Enrollment readable by owner or teacher"
on public.enrollments for select
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1 from public.classes
    where classes.id = enrollments.class_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "Mahasiswa can join as self" on public.enrollments;
create policy "Mahasiswa can join as self"
on public.enrollments for insert
to authenticated
with check (
  student_id = auth.uid()
  and public.is_mahasiswa(auth.uid())
);

drop policy if exists "Meetings readable by teacher or enrolled student" on public.meetings;
create policy "Meetings readable by teacher or enrolled student"
on public.meetings for select
to authenticated
using (
  exists (
    select 1 from public.classes
    where classes.id = meetings.class_id
      and classes.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.enrollments
    where enrollments.class_id = meetings.class_id
      and enrollments.student_id = auth.uid()
  )
);

drop policy if exists "Dosen can create meetings in own classes" on public.meetings;
create policy "Dosen can create meetings in own classes"
on public.meetings for insert
to authenticated
with check (
  exists (
    select 1 from public.classes
    where classes.id = meetings.class_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "Dosen can update meetings in own classes" on public.meetings;
create policy "Dosen can update meetings in own classes"
on public.meetings for update
to authenticated
using (
  exists (
    select 1 from public.classes
    where classes.id = meetings.class_id
      and classes.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.classes
    where classes.id = meetings.class_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "Attendance readable by owner or teacher" on public.attendance;
create policy "Attendance readable by owner or teacher"
on public.attendance for select
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1 from public.classes
    where classes.id = attendance.class_id
      and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "Mahasiswa can attend active meeting as self" on public.attendance;
create policy "Mahasiswa can attend active meeting as self"
on public.attendance for insert
to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.enrollments
    where enrollments.class_id = attendance.class_id
      and enrollments.student_id = auth.uid()
  )
  and exists (
    select 1 from public.meetings
    where meetings.id = attendance.meeting_id
      and meetings.class_id = attendance.class_id
      and meetings.is_active = true
  )
);
