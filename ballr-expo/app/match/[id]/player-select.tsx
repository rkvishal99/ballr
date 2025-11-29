import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMatchStore } from '@/store/matchStore';
import { syncEvent } from '@/services/matchService';
import { MatchEventType } from '@/types/schema';

export default function PlayerSelectScreen() {
  const { id, teamId, eventType } = useLocalSearchParams<{
    id: string;
    teamId: string;
    eventType: MatchEventType;
  }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { homeTeam, awayTeam, homePlayers, awayPlayers, addEvent } = useMatchStore();

  const players = teamId === homeTeam?.id ? homePlayers : awayPlayers;
  const teamName = teamId === homeTeam?.id ? homeTeam.name : awayTeam?.name;

  const handlePlayerSelect = async (playerId: string) => {
    if (!id || !teamId) return;

    setLoading(true);

    const elapsedSeconds = Math.floor(useMatchStore.getState().getElapsedTime() / 1000);
    const minute = Math.floor(elapsedSeconds / 60);

    addEvent(eventType as MatchEventType, teamId, playerId, minute);

    const updatedState = useMatchStore.getState();
    const eventData = {
      match_id: id,
      team_id: teamId,
      player_id: playerId,
      type: eventType as MatchEventType,
      minute,
    };

    const result = await syncEvent(eventData, updatedState.homeScore, updatedState.awayScore);

    setLoading(false);

    if (result.success) {
      router.back();
    } else {
      Alert.alert('Sync Error', result.error || 'Failed to sync event to server');
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#171717' }}>
      <View
        className="bg-neutral-800 px-4 py-6 border-b border-gray-700"
        style={{
          backgroundColor: '#262626',
          paddingHorizontal: 16,
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderBottomColor: '#374151',
        }}>
        <Text className="text-white text-xl font-semibold" style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>
          Select Player - {teamName}
        </Text>
        <Text className="text-gray-400 text-sm mt-1 capitalize" style={{ color: '#9ca3af', fontSize: 14, marginTop: 4, textTransform: 'capitalize' }}>
          {eventType?.replace('_', ' ')}
        </Text>
      </View>

      {loading && (
        <View
          className="absolute inset-0 bg-black/50 items-center justify-center z-10"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-4" style={{ color: '#fff', marginTop: 16 }}>
            Syncing...
          </Text>
        </View>
      )}

      <ScrollView className="flex-1" style={{ backgroundColor: '#171717' }}>
        {players.length === 0 ? (
          <View className="p-6 items-center" style={{ padding: 24, alignItems: 'center' }}>
            <Text className="text-gray-400" style={{ color: '#9ca3af' }}>
              No players available
            </Text>
          </View>
        ) : (
          <View className="p-4" style={{ padding: 16 }}>
            {players.map((player) => (
              <TouchableOpacity
                key={player.id}
                onPress={() => handlePlayerSelect(player.id)}
                disabled={loading}
                className="bg-neutral-800 rounded-lg p-4 mb-3 flex-row items-center justify-between min-h-[48px]"
                style={{
                  backgroundColor: '#262626',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 48,
                  opacity: loading ? 0.5 : 1,
                }}>
                <View className="flex-1" style={{ flex: 1 }}>
                  <Text className="text-white text-lg font-medium" style={{ color: '#fff', fontSize: 18, fontWeight: '500' }}>
                    {player.name}
                  </Text>
                  {player.jersey_number && (
                    <Text className="text-gray-400 text-sm" style={{ color: '#9ca3af', fontSize: 14 }}>
                      #{player.jersey_number}
                    </Text>
                  )}
                </View>
                <View
                  className="w-8 h-8 bg-gray-700 rounded-full items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#374151',
                    borderRadius: 9999,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text className="text-white font-semibold" style={{ color: '#fff', fontWeight: '600' }}>
                    {player.jersey_number || '?'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

