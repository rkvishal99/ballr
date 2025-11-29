export type MatchStatus = 'scheduled' | 'live' | 'finished';
export type MatchEventType = 'goal' | 'yellow_card' | 'red_card';

export interface Match {
  id: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  start_time: string | null;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  is_synced: boolean;
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

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  type: MatchEventType;
  minute: number;
  created_at: string;
}

export interface MatchSetup {
  match: Match;
  home_team: Team;
  away_team: Team;
  home_players: Player[];
  away_players: Player[];
}

