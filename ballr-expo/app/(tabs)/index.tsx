import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Team, MatchStatus } from '@/types/schema';

interface MatchWithTeams {
  id: string;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  start_time: string | null;
  home_team: Team;
  away_team: Team;
}

export default function HomeScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
        .in('status', ['live', 'scheduled'])
        .order('status', { ascending: false })
        .order('start_time', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      if (data) {
        const typedMatches = data as unknown as MatchWithTeams[];
        setMatches(typedMatches);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const formatStartTime = (startTime: string | null) => {
    if (!startTime) return null;
    const date = new Date(startTime);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleMatchPress = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#171717' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-4" style={{ color: '#fff' }}>
            Loading matches...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#171717' }}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-red-500 text-lg mb-4" style={{ color: '#ef4444' }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchMatches}
            className="bg-blue-600 px-6 py-3 rounded-lg"
            style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
            <Text className="text-white font-semibold" style={{ color: '#fff', fontWeight: '600' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#171717' }}>
      <ScrollView className="flex-1" style={{ backgroundColor: '#171717' }}>
        <View className="px-4" style={{ paddingHorizontal: 16 }}>
          <Text
            className="text-white text-3xl font-bold mb-6"
            style={{ color: '#fff', fontSize: 30, fontWeight: '700', marginBottom: 24 }}>
            Live Matches
          </Text>

          {matches.length === 0 ? (
            <View
              className="bg-gray-800 rounded-xl p-8 items-center"
              style={{
                backgroundColor: '#1f2937',
                borderRadius: 12,
                padding: 32,
                alignItems: 'center',
              }}>
              <Text className="text-gray-400 text-lg" style={{ color: '#9ca3af', fontSize: 18 }}>
                No matches found
              </Text>
              <Text
                className="text-gray-500 text-sm mt-2"
                style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
                Check back later for live or scheduled matches
              </Text>
            </View>
          ) : (
            <View className="gap-4" style={{ gap: 16 }}>
              {matches.map((match) => (
                <TouchableOpacity
                  key={match.id}
                  onPress={() => handleMatchPress(match.id)}
                  className="bg-neutral-800 p-4 rounded-xl mb-3 flex-row justify-between items-center"
                  style={{
                    backgroundColor: '#262626',
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <View className="flex-1" style={{ flex: 1 }}>
                    <Text
                      className="text-white text-lg font-semibold"
                      style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                      {match.home_team?.short_name || match.home_team?.name || 'Home'} vs{' '}
                      {match.away_team?.short_name || match.away_team?.name || 'Away'}
                    </Text>
                    {match.status === 'live' && (
                      <View className="flex-row items-center mt-2">
                        <Text
                          className="text-emerald-400 text-2xl font-bold"
                          style={{ color: '#34d399', fontSize: 24, fontWeight: '700' }}>
                          {match.home_score} - {match.away_score}
                        </Text>
                      </View>
                    )}
                    {match.status === 'scheduled' && match.start_time && (
                      <Text
                        className="text-gray-400 text-sm mt-2"
                        style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
                        Starts at {formatStartTime(match.start_time)}
                      </Text>
                    )}
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      match.status === 'live' ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 9999,
                      backgroundColor: match.status === 'live' ? '#10b981' : '#4b5563',
                    }}>
                    <Text
                      className="text-white text-xs font-bold uppercase"
                      style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                      {match.status === 'live' ? 'LIVE' : match.status.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
