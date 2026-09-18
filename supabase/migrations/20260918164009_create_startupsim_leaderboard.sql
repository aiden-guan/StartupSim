create table if not exists public.startupsim_leaderboard_entries (
  id text primary key,
  handle text not null check (char_length(handle) between 1 and 16 and handle ~ '^[A-Z0-9_-]+$'),
  company_name text not null check (char_length(company_name) between 1 and 32 and company_name !~ '[[:cntrl:]]'),
  founder_name text not null check (char_length(founder_name) between 1 and 32 and founder_name !~ '[[:cntrl:]]'),
  score bigint not null check (score >= 0),
  tier text not null check (tier in ('SSS', 'SS', 'S', 'A', 'B', 'C')),
  ending_id text not null check (char_length(ending_id) between 1 and 48),
  ending_title text not null check (char_length(ending_title) between 1 and 80 and ending_title !~ '[[:cntrl:]]'),
  valuation bigint not null check (valuation >= 0),
  cash bigint not null,
  arr bigint not null check (arr >= 0),
  year integer not null check (year between 2022 and 2100),
  days_elapsed integer not null check (days_elapsed between 1 and 9125),
  products_count integer not null check (products_count between 0 and 1000),
  employees_count integer not null check (employees_count between 0 and 100000),
  achievements jsonb not null default '[]'::jsonb check (jsonb_typeof(achievements) = 'array'),
  quote text not null default '' check (char_length(quote) <= 90 and quote !~ '[[:cntrl:]]'),
  verified boolean not null default true check (verified is true),
  created_at timestamptz not null default now()
);

create index if not exists startupsim_leaderboard_score_idx
  on public.startupsim_leaderboard_entries (score desc, created_at asc);

create index if not exists startupsim_leaderboard_ending_idx
  on public.startupsim_leaderboard_entries (ending_id);

create index if not exists startupsim_leaderboard_achievements_idx
  on public.startupsim_leaderboard_entries using gin (achievements);

alter table public.startupsim_leaderboard_entries enable row level security;

revoke all on table public.startupsim_leaderboard_entries from anon, authenticated;
grant select, insert, update on table public.startupsim_leaderboard_entries to service_role;
