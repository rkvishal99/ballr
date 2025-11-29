import { create } from 'zustand';
import { MatchSetup, MatchEvent, MatchEventType } from '@/types/schema';

interface MatchState {
  matchId: string | null;
  homeScore: number;
  awayScore: number;
  isPlaying: boolean;
  startTime: number | null;
  events: MatchEvent[];
  homeTeam: { id: string; name: string; short_name: string | null; logo_url: string | null } | null;
  awayTeam: { id: string; name: string; short_name: string | null; logo_url: string | null } | null;
  homePlayers: Array<{ id: string; name: string; jersey_number: number | null }>;
  awayPlayers: Array<{ id: string; name: string; jersey_number: number | null }>;
  initializeMatch: (matchData: MatchSetup) => void;
  toggleTimer: () => void;
  addEvent: (type: MatchEventType, teamId: string, playerId: string, minute: number) => void;
  getElapsedTime: () => number;
  formatElapsedTime: () => string;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matchId: null,
  homeScore: 0,
  awayScore: 0,
  isPlaying: false,
  startTime: null,
  events: [],
  homeTeam: null,
  awayTeam: null,
  homePlayers: [],
  awayPlayers: [],

  initializeMatch: (matchData: MatchSetup) => {
    set({
      matchId: matchData.match.id,
      homeScore: matchData.match.home_score,
      awayScore: matchData.match.away_score,
      isPlaying: matchData.match.status === 'live',
      startTime: matchData.match.start_time
        ? new Date(matchData.match.start_time).getTime()
        : null,
      events: [],
      homeTeam: {
        id: matchData.home_team.id,
        name: matchData.home_team.name,
        short_name: matchData.home_team.short_name,
        logo_url: matchData.home_team.logo_url,
      },
      awayTeam: {
        id: matchData.away_team.id,
        name: matchData.away_team.name,
        short_name: matchData.away_team.short_name,
        logo_url: matchData.away_team.logo_url,
      },
      homePlayers: matchData.home_players.map((p) => ({
        id: p.id,
        name: p.name,
        jersey_number: p.jersey_number,
      })),
      awayPlayers: matchData.away_players.map((p) => ({
        id: p.id,
        name: p.name,
        jersey_number: p.jersey_number,
      })),
    });
  },

  toggleTimer: () => {
    const { isPlaying, startTime } = get();
    if (isPlaying) {
      set({ isPlaying: false });
    } else {
      const now = Date.now();
      const elapsed = startTime ? now - startTime : 0;
      set({
        isPlaying: true,
        startTime: now - elapsed,
      });
    }
  },

  addEvent: (type: MatchEventType, teamId: string, playerId: string, minute: number) => {
    const { matchId, homeScore, awayScore, homeTeam, awayTeam, events } = get();
    if (!matchId) return;

    const newEvent: MatchEvent = {
      id: `temp-${Date.now()}`,
      match_id: matchId,
      team_id: teamId,
      player_id: playerId,
      type,
      minute,
      created_at: new Date().toISOString(),
    };

    let newHomeScore = homeScore;
    let newAwayScore = awayScore;

    if (type === 'goal') {
      if (teamId === homeTeam?.id) {
        newHomeScore = homeScore + 1;
      } else if (teamId === awayTeam?.id) {
        newAwayScore = awayScore + 1;
      }
    }

    set({
      events: [newEvent, ...events],
      homeScore: newHomeScore,
      awayScore: newAwayScore,
    });
  },

  getElapsedTime: () => {
    const { isPlaying, startTime } = get();
    if (!isPlaying || !startTime) return 0;
    return Date.now() - startTime;
  },

  formatElapsedTime: () => {
    const elapsed = get().getElapsedTime();
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },
}));

