import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../theme/ThemeContext';
import { F } from '../../theme/fonts';
import { C } from '../../theme/colors';
import { fetchPatientMemories, type MemoryItem } from '../../services/memoryService';
import type { PatientStackParams } from '../../types/navigation.types';
import { HomeHeader } from '../../components/patient/home/HomeHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - 32 - GRID_GAP) / 2;

type Props = NativeStackScreenProps<PatientStackParams, 'PatientMemoriesScreen'>;

export const PatientMemoriesScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const { user } = useAuth();
  const isDark = mode === 'dark';

  const patientId = user?.id || '';
  const personId = route.params?.personId;
  const personName = route.params?.personName;

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMemories = useCallback(async (isRefresh = false) => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchPatientMemories(patientId, {
        limit: 50,
        personId: personId || undefined,
      });
      setMemories(res.memories || []);
    } catch (err) {
      console.warn('[PatientMemoriesScreen] loadMemories error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, personId]);

  useEffect(() => {
    void loadMemories();
  }, [loadMemories]);

  const handleMemoryPress = (memory: MemoryItem) => {
    navigation.navigate('PatientMemoryViewerScreen', { memory });
  };

  const title = personName ? `${personName}'s Memories` : 'Memories';

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMemories(true)}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* Brand Header + SOS */}
        <HomeHeader patientId={patientId || null} />

        {/* Back Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? '#F5F7F6' : '#161E1C'} />
            <Text style={[styles.backBtnText, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Back
            </Text>
          </Pressable>
        </View>

        {/* Heading */}
        <View style={styles.headingSection}>
          <Text style={[styles.headingTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
            {title}
          </Text>
        </View>

        {/* Memories Content */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={[styles.loadingText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Loading memories...
            </Text>
          </View>
        ) : memories.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="images-outline" size={32} color={C.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              No memories shared yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              {personName
                ? `Memories shared by ${personName} will appear here.`
                : 'When your family shares photos, videos, and stories, they will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {memories.map((mem) => {
              if (mem.media_type === 'PHOTO' && mem.media_key) {
                return (
                  <Pressable
                    key={mem.id}
                    onPress={() => handleMemoryPress(mem)}
                    accessibilityRole="button"
                    accessibilityLabel={`Memory: ${mem.title}`}
                    style={({ pressed }) => [
                      styles.mediaTile,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Image
                      source={{ uri: mem.media_key }}
                      style={styles.tileImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                );
              }

              if (mem.media_type === 'VIDEO' && mem.media_key) {
                return (
                  <Pressable
                    key={mem.id}
                    onPress={() => handleMemoryPress(mem)}
                    accessibilityRole="button"
                    accessibilityLabel={`Video memory: ${mem.title}`}
                    style={({ pressed }) => [
                      styles.mediaTile,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Image
                      source={{ uri: mem.media_key }}
                      style={styles.tileImage}
                      resizeMode="cover"
                    />
                    <View style={styles.playOverlay}>
                      <View style={styles.playButtonCircle}>
                        <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                    </View>
                  </Pressable>
                );
              }

              /* TEXT MEMORY */
              return (
                <Pressable
                  key={mem.id}
                  onPress={() => handleMemoryPress(mem)}
                  accessibilityRole="button"
                  accessibilityLabel={`Text memory: ${mem.title}`}
                  style={({ pressed }) => [
                    styles.textTile,
                    { backgroundColor: isDark ? '#1C2422' : '#E6F4F1' },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text
                    style={[styles.textTileTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}
                    numberOfLines={4}
                  >
                    {mem.caption || mem.title}
                  </Text>
                  <Text style={styles.textTileAuthor}>
                    — {mem.creator_name || mem.associated_person_name || 'Family'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 10,
  },
  backBtnText: {
    fontFamily: F.medium,
    fontSize: 16,
    marginLeft: 2,
  },
  headingSection: {
    marginTop: 6,
    marginBottom: 18,
  },
  headingTitle: {
    fontFamily: F.bold,
    fontSize: 30,
    letterSpacing: -0.4,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: F.medium,
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  mediaTile: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E0D8',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  playButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textTile: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.15,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  textTileTitle: {
    fontFamily: F.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  textTileAuthor: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#0E7A67',
  },
});
