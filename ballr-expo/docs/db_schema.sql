-- 1. Leagues (The Tournament)
create table leagues (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  name text not null,
  admin_id uuid references auth.users(id), -- Links to the organizer
  status text default 'active' -- 'active', 'completed'
);

-- 2. Teams
create table teams (
  id uuid default gen_random_uuid() primary key,
  league_id uuid references leagues(id),
  name text not null,
  short_name text, -- e.g. "MUN" for Manchester United
  logo_url text
);

-- 3. Players
create table players (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id),
  name text not null,
  jersey_number int,
  photo_url text
);

-- 4. Matches (The Fixture)
create table matches (
  id uuid default gen_random_uuid() primary key,
  league_id uuid references leagues(id),
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
  start_time timestamp with time zone,
  status text default 'scheduled', -- 'scheduled', 'live', 'finished'
  home_score int default 0,
  away_score int default 0,
  is_synced boolean default false -- Helper for offline logic
);

-- 5. Match Events (The Timeline)
create table match_events (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id),
  player_id uuid references players(id),
  team_id uuid references teams(id),
  type text not null, -- 'goal', 'yellow_card', 'red_card', 'sub'
  minute int not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);