export interface League {
  id: string;
  created_at: string;
  name: string;
  admin_id: string | null;
  status: string;
}

export interface Team {
  id: string;
  league_id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number | null;
  photo_url: string | null;
}

export interface Match {
  id: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  start_time: string | null;
  status: string;
  home_score: number;
  away_score: number;
  is_synced: boolean;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  type: string;
  minute: number;
  created_at: string;
}

