import { supabase } from '@/lib/supabase';
import { MatchSetup, MatchEvent, MatchEventType } from '@/types/schema';

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function fetchMatchSetup(matchId: string): Promise<ServiceResult<MatchSetup>> {
  try {
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return { success: false, error: matchError?.message || 'Match not found' };
    }

    const { data: homeTeam, error: homeTeamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', match.home_team_id)
      .single();

    if (homeTeamError || !homeTeam) {
      return { success: false, error: homeTeamError?.message || 'Home team not found' };
    }

    const { data: awayTeam, error: awayTeamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', match.away_team_id)
      .single();

    if (awayTeamError || !awayTeam) {
      return { success: false, error: awayTeamError?.message || 'Away team not found' };
    }

    const { data: homePlayers, error: homePlayersError } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', match.home_team_id);

    if (homePlayersError) {
      return { success: false, error: homePlayersError.message };
    }

    const { data: awayPlayers, error: awayPlayersError } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', match.away_team_id);

    if (awayPlayersError) {
      return { success: false, error: awayPlayersError.message };
    }

    return {
      success: true,
      data: {
        match,
        home_team: homeTeam,
        away_team: awayTeam,
        home_players: homePlayers || [],
        away_players: awayPlayers || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function syncEvent(
  event: Omit<MatchEvent, 'id' | 'created_at'>,
  homeScore: number,
  awayScore: number
): Promise<ServiceResult<MatchEvent>> {
  try {
    const { data: insertedEvent, error: insertError } = await supabase
      .from('match_events')
      .insert({
        match_id: event.match_id,
        team_id: event.team_id,
        player_id: event.player_id,
        type: event.type,
        minute: event.minute,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    if (event.type === 'goal') {
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
        })
        .eq('id', event.match_id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    }

    return {
      success: true,
      data: insertedEvent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function updateMatchStatus(
  matchId: string,
  status: 'scheduled' | 'live' | 'finished'
): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', matchId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

