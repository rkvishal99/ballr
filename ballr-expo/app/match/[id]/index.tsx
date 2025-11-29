import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Play, Pause, Goal, RectangleVertical } from 'lucide-react-native';
import { useMatchStore } from '@/store/matchStore';
import { fetchMatchSetup, updateMatchStatus } from '@/services/matchService';
import { MatchEventType } from '@/types/schema';

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    matchId,
    homeScore,
    awayScore,
    isPlaying,
    homeTeam,
    awayTeam,
    events,
    initializeMatch,
    toggleTimer,
    formatElapsedTime,
  } = useMatchStore();

  const [timerDisplay, setTimerDisplay] = useState('00:00');

  useEffect(() => {
    if (id) {
      loadMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setTimerDisplay(formatElapsedTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, formatElapsedTime]);

  const loadMatch = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const result = await fetchMatchSetup(id);
    if (result.success && result.data) {
      initializeMatch(result.data);
      setTimeout(() => {
        if (useMatchStore.getState().isPlaying) {
          setTimerDisplay(useMatchStore.getState().formatElapsedTime());
        }
      }, 100);
    } else {
      setError(result.error || 'Failed to load match');
    }
    setLoading(false);
  };

  const handleToggleTimer = async () => {
    const wasPlaying = isPlaying;
    toggleTimer();

    if (!wasPlaying && matchId) {
      const result = await updateMatchStatus(matchId, 'live');
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to update match status');
        toggleTimer();
      }
    }
  };

  const handleGoal = (teamId: string) => {
    router.push({
      pathname: '/match/[id]/player-select',
      params: { id, teamId, eventType: 'goal' },
    });
  };

  const handleCard = async (teamId: string, type: 'yellow_card' | 'red_card') => {
    if (!matchId || !homeTeam || !awayTeam) return;

    const players = teamId === homeTeam.id
      ? useMatchStore.getState().homePlayers
      : useMatchStore.getState().awayPlayers;

    if (players.length === 0) {
      Alert.alert('No Players', 'No players available for this team');
      return;
    }

    router.push({
      pathname: '/match/[id]/player-select',
      params: { id, teamId, eventType: type },
    });
  };

  const getEventIcon = (type: MatchEventType) => {
    switch (type) {
      case 'goal':
        return <Goal size={16} color="#34d399" />;
      case 'yellow_card':
        return <RectangleVertical size={16} color="#fbbf24" />;
      case 'red_card':
        return <RectangleVertical size={16} color="#ef4444" />;
      default:
        return null;
    }
  };

  const getPlayerName = (playerId: string) => {
    const allPlayers = [
      ...useMatchStore.getState().homePlayers,
      ...useMatchStore.getState().awayPlayers,
    ];
    return allPlayers.find((p) => p.id === playerId)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#171717' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-4" style={{ color: '#fff', marginTop: 16 }}>
            Loading match...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !homeTeam || !awayTeam) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#171717' }}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-red-500 text-lg mb-4" style={{ color: '#ef4444', fontSize: 18, marginBottom: 16 }}>
            {error || 'Match not found'}
          </Text>
          <TouchableOpacity
            onPress={loadMatch}
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
          <View className="flex-row items-center justify-between mb-6" style={{ marginBottom: 24 }}>
            <View className="flex-1" style={{ flex: 1 }}>
              <Text className="text-white text-2xl font-bold" style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>
                {timerDisplay}
              </Text>
              <Text
                className={`text-sm ${isPlaying ? 'text-emerald-400' : 'text-gray-400'}`}
                style={{ color: isPlaying ? '#34d399' : '#9ca3af', fontSize: 14, marginTop: 4 }}>
                {isPlaying ? 'LIVE' : 'PAUSED'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleToggleTimer}
              className="bg-emerald-600 px-6 py-3 rounded-lg flex-row items-center"
              style={{
                backgroundColor: '#10b981',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              {isPlaying ? (
                <Pause size={20} color="#fff" />
              ) : (
                <Play size={20} color="#fff" />
              )}
              <Text className="text-white font-semibold ml-2" style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>
                {isPlaying ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            className="bg-neutral-800 rounded-xl p-6 mb-6"
            style={{
              backgroundColor: '#262626',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}>
            <View className="flex-row items-center justify-between" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View className="flex-1 items-center" style={{ flex: 1, alignItems: 'center' }}>
                <Text className="text-gray-400 text-sm mb-2" style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8 }}>
                  {homeTeam.short_name || homeTeam.name}
                </Text>
                <Text className="text-white text-6xl font-bold" style={{ color: '#fff', fontSize: 60, fontWeight: '700' }}>
                  {homeScore}
                </Text>
              </View>
              <Text className="text-gray-500 text-2xl mx-4" style={{ color: '#6b7280', fontSize: 20, marginHorizontal: 16 }}>
                -
              </Text>
              <View className="flex-1 items-center" style={{ flex: 1, alignItems: 'center' }}>
                <Text className="text-gray-400 text-sm mb-2" style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8 }}>
                  {awayTeam.short_name || awayTeam.name}
                </Text>
                <Text className="text-white text-6xl font-bold" style={{ color: '#fff', fontSize: 60, fontWeight: '700' }}>
                  {awayScore}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-6" style={{ marginBottom: 24 }}>
            <Text className="text-white text-lg font-semibold mb-3" style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
              Controls
            </Text>
            <View className="flex-row gap-3 mb-3" style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => handleGoal(homeTeam.id)}
                className="flex-1 bg-emerald-600 py-4 rounded-lg items-center min-h-[48px] justify-center"
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 48,
                }}>
                <Goal size={24} color="#fff" />
                <Text className="text-white font-semibold mt-1" style={{ color: '#fff', fontWeight: '600', marginTop: 4 }}>
                  Home Goal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleGoal(awayTeam.id)}
                className="flex-1 bg-emerald-600 py-4 rounded-lg items-center min-h-[48px] justify-center"
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 48,
                }}>
                <Goal size={24} color="#fff" />
                <Text className="text-white font-semibold mt-1" style={{ color: '#fff', fontWeight: '600', marginTop: 4 }}>
                  Away Goal
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3" style={{ flexDirection: 'row', gap: 12 }}>
              <View className="flex-1" style={{ flex: 1 }}>
                <Text className="text-gray-400 text-xs mb-2 text-center" style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>
                  Home Team
                </Text>
                <View className="flex-row gap-2" style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleCard(homeTeam.id, 'yellow_card')}
                    className="flex-1 bg-yellow-600 py-3 rounded-lg items-center min-h-[48px] justify-center"
                    style={{
                      flex: 1,
                      backgroundColor: '#d97706',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 48,
                    }}>
                    <RectangleVertical size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCard(homeTeam.id, 'red_card')}
                    className="flex-1 bg-red-600 py-3 rounded-lg items-center min-h-[48px] justify-center"
                    style={{
                      flex: 1,
                      backgroundColor: '#dc2626',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 48,
                    }}>
                    <RectangleVertical size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-1" style={{ flex: 1 }}>
                <Text className="text-gray-400 text-xs mb-2 text-center" style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>
                  Away Team
                </Text>
                <View className="flex-row gap-2" style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleCard(awayTeam.id, 'yellow_card')}
                    className="flex-1 bg-yellow-600 py-3 rounded-lg items-center min-h-[48px] justify-center"
                    style={{
                      flex: 1,
                      backgroundColor: '#d97706',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 48,
                    }}>
                    <RectangleVertical size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCard(awayTeam.id, 'red_card')}
                    className="flex-1 bg-red-600 py-3 rounded-lg items-center min-h-[48px] justify-center"
                    style={{
                      flex: 1,
                      backgroundColor: '#dc2626',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 48,
                    }}>
                    <RectangleVertical size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text className="text-white text-lg font-semibold mb-3" style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
              Events
            </Text>
            {events.length === 0 ? (
              <View
                className="bg-neutral-800 rounded-lg p-6 items-center"
                style={{
                  backgroundColor: '#262626',
                  borderRadius: 8,
                  padding: 24,
                  alignItems: 'center',
                }}>
                <Text className="text-gray-400" style={{ color: '#9ca3af' }}>
                  No events yet
                </Text>
              </View>
            ) : (
              <View
                className="bg-neutral-800 rounded-lg"
                style={{
                  backgroundColor: '#262626',
                  borderRadius: 8,
                }}>
                {events.map((event) => (
                  <View
                    key={event.id}
                    className="flex-row items-center justify-between p-4 border-b border-gray-700 last:border-b-0"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#374151',
                    }}>
                    <View className="flex-row items-center flex-1" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {getEventIcon(event.type)}
                      <View className="ml-3 flex-1" style={{ marginLeft: 12, flex: 1 }}>
                        <Text className="text-white font-medium" style={{ color: '#fff', fontWeight: '500' }}>
                          {getPlayerName(event.player_id)}
                        </Text>
                        <Text className="text-gray-400 text-sm capitalize" style={{ color: '#9ca3af', fontSize: 14, textTransform: 'capitalize' }}>
                          {event.type.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-400" style={{ color: '#9ca3af' }}>
                      {event.minute}&apos;
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

