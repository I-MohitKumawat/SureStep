import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { HomeHeader } from '../../components/patient/home/HomeHeader';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../theme/ThemeContext';
import { F } from '../../theme/fonts';
import { C } from '../../theme/colors';
import {
  fetchConnectedPeople,
  type ConnectedPerson,
} from '../../services/relationshipService';
import {
  fetchPatientMemories,
  type MemoryItem,
} from '../../services/memoryService';
import type { PatientStackParams } from '../../types/navigation.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const GRID_GAP = 16;
// 3 columns: total available width minus 2 gaps
const COL_WIDTH = Math.floor(
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP * 2) / 3
);

export const PatientFamilyScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<NativeStackNavigationProp<PatientStackParams>>();
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const { user } = useAuth();
  const isDark = mode === 'dark';

  const patientId = user?.id || '';

  const [people, setPeople] = useState<ConnectedPerson[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [peopleList, memoriesResp] = await Promise.all([
        fetchConnectedPeople(),
        patientId ? fetchPatientMemories(patientId, { limit: 10 }) : Promise.resolve({ memories: [] }),
      ]);

      setPeople(peopleList);
      setMemories(memoriesResp.memories || []);
    } catch (err) {
      console.warn('[PatientFamilyScreen] loadData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (isFocused) {
      void loadData();
    }
  }, [isFocused, loadData]);

  const handleCall = (person: ConnectedPerson) => {
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
        console.warn('[PatientFamilyScreen] Call failed:', err);
        Alert.alert('Call Error', 'Could not initiate phone call.');
      });
  };

  const getInitials = (name: string): string => {
    return (
      name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'P'
    );
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        {/* Persistent Brand Header + SOS */}
        <HomeHeader patientId={patientId || null} />

        {/* Screen Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.screenTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
            My People
          </Text>
        </View>

        {/* People Grid */}
        {loading && !refreshing && people.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={[styles.loadingText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Loading your people...
            </Text>
          </View>
        ) : people.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
            <Text style={[styles.emptyTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              No people connected yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Family members and caregivers will appear here once connected.
            </Text>
          </View>
        ) : (
          <View style={styles.peopleGrid}>
            {people.map((person) => (
              <View key={person.id} style={styles.personColumn}>
                {/* Person Profile Tap Target */}
                <Pressable
                  onPress={() => navigation.navigate('PatientPersonDetailScreen', { person })}
                  accessibilityRole="button"
                  accessibilityLabel={`${person.name}, ${person.relationship}`}
                  style={({ pressed }) => [
                    styles.personTile,
                    pressed && { opacity: 0.82 },
                  ]}
                >
                  {/* Large Circular Avatar */}
                  <View style={styles.avatarWrap}>
                    {person.photoUrl && !avatarErrors[person.id] ? (
                      <Image
                        source={{ uri: person.photoUrl }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                        onError={() =>
                          setAvatarErrors((prev) => ({ ...prev, [person.id]: true }))
                        }
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarFallback,
                          { backgroundColor: isDark ? '#2C3835' : '#E8F3EE' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarFallbackText,
                            { color: isDark ? '#7FD8C7' : '#0E7A67' },
                          ]}
                        >
                          {getInitials(person.name)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Name */}
                  <Text
                    style={[styles.personName, { color: isDark ? '#F5F7F6' : '#161E1C' }]}
                    numberOfLines={1}
                  >
                    {person.name}
                  </Text>

                  {/* Relationship */}
                  <Text
                    style={[
                      styles.personRelationship,
                      { color: isDark ? '#9EABA7' : '#5B7570' },
                    ]}
                    numberOfLines={1}
                  >
                    {person.relationship}
                  </Text>
                </Pressable>

                {/* Call Action Button */}
                <Pressable
                  onPress={() => handleCall(person)}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${person.name}`}
                  style={({ pressed }) => [
                    styles.callButton,
                    {
                      borderColor: isDark ? '#7FD8C7' : '#1B3B36',
                      backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                    },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
                  ]}
                >
                  <Ionicons
                    name="call"
                    size={16}
                    color={isDark ? '#7FD8C7' : '#1B3B36'}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Thin Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? '#2C3835' : '#E5E0D8' },
          ]}
        />

        {/* Memories Section */}
        <View style={styles.memoriesHeader}>
          <Text style={[styles.memoriesTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
            Memories
          </Text>
          <Pressable
            onPress={() => navigation.navigate('PatientMemoriesScreen')}
            accessibilityRole="button"
            accessibilityLabel="View all memories"
            style={({ pressed }) => [styles.viewAllBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.viewAllText, { color: isDark ? '#7FD8C7' : '#0E7A67' }]}>
              View all
            </Text>
            <Ionicons
              name="chevron-forward"
              size={15}
              color={isDark ? '#7FD8C7' : '#0E7A67'}
              style={{ marginLeft: 2 }}
            />
          </Pressable>
        </View>

        {/* Memories Horizontal Carousel */}
        {memories.length === 0 ? (
          <View
            style={[
              styles.emptyMemoriesCard,
              { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.emptyMemoriesText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Photos, videos, and family notes will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memoriesScroll}
          >
            {memories.map((mem) => {
              if (mem.media_type === 'PHOTO' && mem.media_key) {
                return (
                  <Pressable
                    key={mem.id}
                    onPress={() =>
                      navigation.navigate('PatientMemoryViewerScreen', { memory: mem })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Memory photo: ${mem.title}`}
                    style={({ pressed }) => [
                      styles.memoryThumbCard,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Image
                      source={{ uri: mem.media_key }}
                      style={styles.memoryThumbImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                );
              }

              if (mem.media_type === 'VIDEO' && mem.media_key) {
                // If caption contains a duration stamp (e.g. 0:42) or default to 0:42
                const durationMatch = mem.caption?.match(/\b\d+:\d{2}\b/);
                const durationText = durationMatch ? durationMatch[0] : '0:42';

                return (
                  <Pressable
                    key={mem.id}
                    onPress={() =>
                      navigation.navigate('PatientMemoryViewerScreen', { memory: mem })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Memory video: ${mem.title}`}
                    style={({ pressed }) => [
                      styles.memoryThumbCard,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Image
                      source={{ uri: mem.media_key }}
                      style={styles.memoryThumbImage}
                      resizeMode="cover"
                    />
                    {/* Dark semi-transparent play overlay */}
                    <View style={styles.playOverlay}>
                      <View style={styles.playCircle}>
                        <Ionicons
                          name="play"
                          size={18}
                          color="#FFFFFF"
                          style={{ marginLeft: 2 }}
                        />
                      </View>
                    </View>
                    {/* Duration badge */}
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{durationText}</Text>
                    </View>
                  </Pressable>
                );
              }

              // Text Memory
              const creatorName =
                mem.creator_name || mem.associated_person_name || 'Family';

              return (
                <Pressable
                  key={mem.id}
                  onPress={() =>
                    navigation.navigate('PatientMemoryViewerScreen', { memory: mem })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Family note: ${mem.title}`}
                  style={({ pressed }) => [
                    styles.textMemoryThumbCard,
                    { backgroundColor: isDark ? '#1C2926' : '#E8F3EE' },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.textMemoryThumbTitle,
                      { color: isDark ? '#E5E7EB' : '#1B3B36' },
                    ]}
                    numberOfLines={4}
                  >
                    {mem.title}
                  </Text>
                  <Text
                    style={[
                      styles.textMemoryThumbAuthor,
                      { color: isDark ? '#7FD8C7' : '#5B7570' },
                    ]}
                    numberOfLines={1}
                  >
                    — {creatorName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8F6F0',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  titleSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 16,
  },
  screenTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    marginHorizontal: HORIZONTAL_PADDING,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 16,
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
    textAlign: 'center',
    lineHeight: 18,
  },
  peopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GRID_GAP,
    marginBottom: 8,
  },
  personColumn: {
    width: COL_WIDTH,
    alignItems: 'center',
    marginBottom: 16,
  },
  personTile: {
    alignItems: 'center',
    width: '100%',
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: '#E5E0D8',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontFamily: F.bold,
    fontSize: 26,
  },
  personName: {
    fontFamily: F.bold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 2,
  },
  personRelationship: {
    fontFamily: F.medium,
    fontSize: 13,
    textAlign: 'center',
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginHorizontal: HORIZONTAL_PADDING,
    marginVertical: 16,
  },
  memoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 14,
  },
  memoriesTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 24,
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontFamily: F.semiBold,
    fontSize: 15,
  },
  emptyMemoriesCard: {
    marginHorizontal: HORIZONTAL_PADDING,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyMemoriesText: {
    fontFamily: F.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  memoriesScroll: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 12,
  },
  memoryThumbCard: {
    width: 116,
    height: 136,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E5E0D8',
    position: 'relative',
  },
  memoryThumbImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#FFFFFF',
  },
  textMemoryThumbCard: {
    width: 116,
    height: 136,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
  },
  textMemoryThumbTitle: {
    fontFamily: F.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  textMemoryThumbAuthor: {
    fontFamily: F.medium,
    fontSize: 11,
    marginTop: 4,
  },
});
