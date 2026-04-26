-- ============================================================
-- user_progress テーブル作成
-- Supabase SQL Editor で実行してください
-- ============================================================
 
create table if not exists public.user_progress (
  user_id         uuid        primary key references auth.users(id) on delete cascade,
  level           int         not null default 1,
  current_exp     int         not null default 0,
  total_exp       int         not null default 0,
  streak_days     int         not null default 0,
  last_active_date date,
  obtained_badges text[]      not null default '{}',
  updated_at      timestamptz not null default now()
);
 
-- RLS を有効化（自分のレコードのみ読み書き可能）
alter table public.user_progress enable row level security;
 
create policy "user_progress: select own"
  on public.user_progress for select
  using (auth.uid() = user_id);
 
create policy "user_progress: insert own"
  on public.user_progress for insert
  with check (auth.uid() = user_id);
 
create policy "user_progress: update own"
  on public.user_progress for update
  using (auth.uid() = user_id);
 