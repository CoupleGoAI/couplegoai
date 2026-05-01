-- Add quiz gate flag to profiles
alter table public.profiles
  add column quiz_completed boolean not null default false;

-- Store quiz results per user (upsertable — user can retake)
create table public.profile_quiz_results (
  user_id          uuid        not null references auth.users(id) on delete cascade,
  love_style       text        not null,
  conflict_style   text        not null,
  safety_style     text        not null,
  love_answers     jsonb       not null default '[]',
  conflict_answers jsonb       not null default '[]',
  safety_answers   jsonb       not null default '[]',
  completed_at     timestamptz not null default now(),

  primary key (user_id)
);

alter table public.profile_quiz_results enable row level security;

create policy "Users can manage own quiz results"
  on public.profile_quiz_results
  for all
  to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
