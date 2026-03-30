-- Run this in your Supabase SQL Editor to set up the database

create table if not exists lessons (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  topic text not null,
  source text default 'phrase',
  raw_input text,
  structures text[]
);

create table if not exists vocabulary (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  lesson_id uuid references lessons(id) on delete cascade,
  fr text not null,
  es text not null,
  categoria text not null,
  times_seen integer default 0,
  times_correct integer default 0
);

create table if not exists exercises (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  type text not null,
  correct boolean,
  vocab_ids uuid[]
);

-- Enable Row Level Security (optional but recommended)
alter table lessons enable row level security;
alter table vocabulary enable row level security;
alter table exercises enable row level security;

-- Allow all for anonymous (single-user app — tighten later if needed)
create policy "allow all" on lessons for all using (true) with check (true);
create policy "allow all" on vocabulary for all using (true) with check (true);
create policy "allow all" on exercises for all using (true) with check (true);
