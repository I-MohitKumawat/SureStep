import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PatientStackParams } from '../../types/navigation.types';
import { useTheme } from '../../theme/ThemeContext';
import { F } from '../../theme/fonts';
import { C } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = NativeStackScreenProps<PatientStackParams, 'PatientMemoryViewerScreen'>;

export const PatientMemoryViewerScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { memory } = route.params;

  const videoRef = useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);

  const creator = memory.creator_name || memory.associated_person_name || 'Family';
  const dateFormatted = memory.created_at
    ? new Date(memory.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0B0F0E' : '#121816' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F0E" />

      {/* Top Navigation Bar with Back button and memory date */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to memories"
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>

        {dateFormatted ? (
          <Text style={styles.dateText}>{dateFormatted}</Text>
        ) : null}
      </View>

      {/* Media Presentation */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {memory.media_type === 'PHOTO' && memory.media_key ? (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: memory.media_key }}
              style={styles.photo}
              resizeMode="contain"
            />
          </View>
        ) : memory.media_type === 'VIDEO' && memory.media_key ? (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: memory.media_key }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
            />
          </View>
        ) : (
          /* TEXT Memory Presentation */
          <View style={styles.textMemoryCard}>
            <View style={styles.quoteIconWrap}>
              <Ionicons name="heart" size={28} color={C.primary} />
            </View>
            <Text style={styles.textMemoryTitle}>{memory.title}</Text>
            {memory.caption ? (
              <Text style={styles.textMemoryBody}>{memory.caption}</Text>
            ) : null}
            <Text style={styles.textMemoryAuthor}>— {creator}</Text>
          </View>
        )}

        {/* Narrative & Context details (for photo and video) */}
        {memory.media_type !== 'TEXT' && (
          <View style={styles.detailsContainer}>
            <Text style={styles.memoryTitle}>{memory.title}</Text>
            {memory.caption ? (
              <Text style={styles.memoryCaption}>{memory.caption}</Text>
            ) : null}
            <View style={styles.authorRow}>
              <Ionicons name="person-circle-outline" size={18} color="#9EABA7" style={{ marginRight: 6 }} />
              <Text style={styles.memoryAuthor}>Shared by {creator}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
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
    color: '#FFFFFF',
    marginLeft: 2,
  },
  dateText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#9EABA7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  textMemoryCard: {
    marginHorizontal: 24,
    marginVertical: 40,
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  quoteIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  textMemoryTitle: {
    fontFamily: F.bold,
    fontSize: 24,
    lineHeight: 32,
    color: '#161E1C',
    textAlign: 'center',
    marginBottom: 16,
  },
  textMemoryBody: {
    fontFamily: F.regular,
    fontSize: 17,
    lineHeight: 26,
    color: '#52605D',
    textAlign: 'center',
    marginBottom: 24,
  },
  textMemoryAuthor: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#0E7A67',
  },
  detailsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  memoryTitle: {
    fontFamily: F.bold,
    fontSize: 22,
    color: '#F5F7F6',
    marginBottom: 8,
  },
  memoryCaption: {
    fontFamily: F.regular,
    fontSize: 15,
    lineHeight: 22,
    color: '#D1DCD8',
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryAuthor: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#9EABA7',
  },
});
