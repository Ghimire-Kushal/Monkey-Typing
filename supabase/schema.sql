create table if not exists race_results (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  player_name text not null,
  score integer not null,
  wpm integer not null,
  accuracy integer not null,
  created_at timestamptz not null default now()
);

alter table race_results enable row level security;

create policy "Allow public insert" on race_results
  for insert to anon
  with check (true);

create policy "Allow public read" on race_results
  for select to anon
  using (true);
