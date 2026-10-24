create extension if not exists pgcrypto;

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  prospect_name text not null default 'Unknown prospect',
  company_name text not null default '',
  call_started_at timestamptz not null default now(),
  call_ended_at timestamptz,
  current_stage integer not null default 1 check (current_stage between 1 and 8),
  outcome text check (outcome in (
    'Meeting booked', 'Follow-up scheduled', 'Send information',
    'Referred to someone', 'Not interested', 'No answer / wrong contact',
    'Call dropped / ended early', 'Other'
  )),
  next_step text,
  next_step_at text,
  created_at timestamptz not null default now()
);

create table if not exists public.call_stage_results (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  stage_number integer not null check (stage_number between 1 and 8),
  event_key text not null default 'not_recorded',
  prospect_words text not null default '',
  saved_at timestamptz not null default now(),
  unique (call_id, stage_number)
);

create index if not exists calls_started_idx on public.calls (call_started_at desc);
create index if not exists stage_results_call_idx on public.call_stage_results (call_id, stage_number);

-- This demo uses the backend service-role key, which bypasses RLS.
-- Do not expose that key in the browser. For a multi-user production app,
-- add authentication and owner_id-based RLS before storing real prospect data.
alter table public.calls enable row level security;
alter table public.call_stage_results enable row level security;
