import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
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

type Props = NativeStackScreenProps<PatientStackParams, 'PatientPersonDetailScreen'>;

export const PatientPersonDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const { user } = useAuth();
  const isDark = mode === 'dark';

  const { person } = route.params;
  const patientId = user?.id || '';

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const initials = person.name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

  const loadPersonMemories = useCallback(async (isRefresh = false) => {
    if (!patientId || !person.id) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchPatientMemories(patientId, {
        limit: 20,
        personId: person.id,
      });
      setMemories(res.memories || []);
    } catch (err) {
      console.warn('[PatientPersonDetailScreen] loadPersonMemories error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, person.id]);

  useEffect(() => {
    void loadPersonMemories();
  }, [loadPersonMemories]);

  // Handle phone call action
  const handleCall = () => {
    if (!person.phone) {
      Alert.alert(
        'Phone Unavailable',
        `No contact phone number is available for ${person.name}.`
      );
      return;
    }

    const cleanPhone = person.phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanPhone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Unable to Call', 'Calling is not supported on this device.');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => {
        console.warn('[PatientPersonDetailScreen] Call failed:', err);
        Alert.alert('Call Error', 'Could not initiate phone call.');
      });
  };

  const handleMemoryPress = (memory: MemoryItem) => {
    navigation.navigate('PatientMemoryViewerScreen', { memory });
  };

  const handleViewAllMemories = () => {
    navigation.navigate('PatientMemoriesScreen', {
      personId: person.id,
      personName: person.name,
    });
  };

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
            onRefresh={() => loadPersonMemories(true)}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* Brand Header + SOS */}
        <HomeHeader patientId={patientId || null} />

        {/* Back Navigation Button */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back to My People"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? '#F5F7F6' : '#161E1C'} />
            <Text style={[styles.backBtnText, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Back
            </Text>
          </Pressable>
        </View>

        {/* Hero Section: Large circular photo, Name, Relationship, Call button */}
        <View style={styles.heroSection}>
          <View style={styles.heroAvatarWrap}>
            {person.photoUrl && !imageError ? (
              <Image
                source={{ uri: person.photoUrl }}
                style={styles.heroAvatarImg}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Text style={styles.heroAvatarFallbackText}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.heroName, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
            {person.name}
          </Text>

          <Text style={[styles.heroRelationship, { color: isDark ? '#9EABA7' : '#52605D' }]}>
            {person.relationship}
          </Text>

          {/* Prominent Call Action */}
          <Pressable
            onPress={handleCall}
            accessibilityRole="button"
            accessibilityLabel={`Call ${person.name}`}
            style={({ pressed }) => [
              styles.callButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
            ]}
          >
            <Ionicons name="call" size={24} color={C.primary} />
          </Pressable>
        </View>

        {/* Memories Section */}
        <View style={styles.memoriesHeaderRow}>
          <Text style={[styles.memoriesTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
            Memories
          </Text>
          <Pressable
            onPress={handleViewAllMemories}
            accessibilityRole="button"
            accessibilityLabel="View all memories"
            style={({ pressed }) => [styles.viewAllBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={15} color={C.primary} style={{ marginLeft: 2 }} />
          </Pressable>
        </View>

        {/* Memories Grid */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={[styles.loadingText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Loading memories...
            </Text>
          </View>
        ) : memories.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
            <Text style={[styles.emptyTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              No memories with {person.name} yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Photos and stories shared with {person.name} will appear here.
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
                    — {mem.creator_name || person.name}
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
    paddingRight: 12,
  },
  backBtnText: {
    fontFamily: F.medium,
    fontSize: 16,
    marginLeft: 2,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 26,
  },
  heroAvatarWrap: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: 'hidden',
    backgroundColor: '#E5E0D8',
    marginBottom: 16,
  },
  heroAvatarImg: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  heroAvatarFallback: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarFallbackText: {
    fontFamily: F.bold,
    fontSize: 42,
    color: '#0E7A67',
  },
  heroName: {
    fontFamily: F.bold,
    fontSize: 26,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroRelationship: {
    fontFamily: F.regular,
    fontSize: 16,
    marginBottom: 18,
  },
  callButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.8,
    borderColor: '#0E7A67',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  memoriesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  memoriesTitle: {
    fontFamily: F.bold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 8,
  },
  viewAllText: {
    fontFamily: F.medium,
    fontSize: 15,
    color: C.primary,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: F.medium,
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
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
