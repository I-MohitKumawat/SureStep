/**
 * SureStep — src/screens/family/PatientMemoriesScreen.tsx
 * Screen displaying the patient's cherished memories for Family members.
 * Aligns with "Ramesh’s Cherished Memories.png".
 *
 * Connected to:
 *   GET /patients/:patientId/memories
 *   POST /patients/:patientId/memories
 *   DELETE /patients/:patientId/memories/:id
 *
 * Guarded by canonical permission: 'Manage Patient Memories' or Circle Owner.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../../types/navigation.types';
import { useFamilyContext } from '../../context/FamilyContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  fetchPatientMemories,
  createPatientMemory,
  deletePatientMemory,
  MemoryItem,
} from '../../services/memoryService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

type Props = NativeStackScreenProps<FamilyStackParams, 'PatientMemoriesScreen'>;

type FilterType = 'ALL' | 'PHOTO' | 'VIDEO' | 'TEXT';

export const PatientMemoriesScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { patientId, patientName = 'Patient' } = route.params;
  const { isOwner, hasPermission } = useFamilyContext();

  const canManageMemories = isOwner || hasPermission('Manage Patient Memories');

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');

  // Modal State for Adding Memory
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'PHOTO' | 'TEXT' | 'VIDEO'>('PHOTO');
  const [newCaption, setNewCaption] = useState('');
  const [creating, setCreating] = useState(false);

  const loadMemories = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchPatientMemories(patientId, { limit: 50 });
      setMemories(res.memories || []);
    } catch (err) {
      console.warn('[PatientMemoriesScreen] loadMemories error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadMemories();
  }, [loadMemories]);

  const filteredMemories = memories.filter((m) => {
    if (selectedFilter === 'ALL') return true;
    return m.media_type === selectedFilter;
  });

  const photoCount = memories.filter((m) => m.media_type === 'PHOTO').length;
  const videoCount = memories.filter((m) => m.media_type === 'VIDEO').length;
  const textCount = memories.filter((m) => m.media_type === 'TEXT').length;

  const handleCreateMemory = async () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      Alert.alert('Required', 'Please enter a title for this memory.');
      return;
    }

    try {
      setCreating(true);
      await createPatientMemory(patientId, {
        title: trimmedTitle,
        media_type: newType,
        caption: newCaption.trim() || undefined,
      });
      setModalVisible(false);
      setNewTitle('');
      setNewCaption('');
      Alert.alert('Memory Added', 'The cherished memory has been added.');
      void loadMemories();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add memory.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMemory = (memory: MemoryItem) => {
    if (!canManageMemories) return;
    Alert.alert(
      'Delete Memory',
      `Are you sure you want to remove "${memory.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePatientMemory(patientId, memory.id);
              setMemories((prev) => prev.filter((m) => m.id !== memory.id));
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete memory.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{patientName}’s Memories</Text>
          <Text style={styles.headerSubtitle}>Cherished stories, photos, and notes</Text>
        </View>
        {canManageMemories && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'ALL' && styles.filterChipTextActive]}>
              All ({memories.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'PHOTO' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('PHOTO')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'PHOTO' && styles.filterChipTextActive]}>
              Photos ({photoCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'VIDEO' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('VIDEO')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'VIDEO' && styles.filterChipTextActive]}>
              Videos ({videoCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'TEXT' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('TEXT')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'TEXT' && styles.filterChipTextActive]}>
              Notes ({textCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0E7A67" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadMemories(true)} tintColor="#0E7A67" />}
          showsVerticalScrollIndicator={false}
        >
          {filteredMemories.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="images-outline" size={36} color="#8A9592" />
              <Text style={styles.emptyTitle}>No Memories Found</Text>
              <Text style={styles.emptyDesc}>
                {canManageMemories
                  ? `Add precious moments, family photos, or heartfelt notes for ${patientName}.`
                  : `No memories shared yet for ${patientName}.`}
              </Text>
              {canManageMemories && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyAddBtnText}>Add First Memory</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredMemories.map((memory) => {
                const isText = memory.media_type === 'TEXT';
                const isVideo = memory.media_type === 'VIDEO';

                return (
                  <TouchableOpacity
                    key={memory.id}
                    style={styles.card}
                    onPress={() =>
                      navigation.navigate('PatientMemoryViewerScreen', { memory })
                    }
                    onLongPress={() => canManageMemories && handleDeleteMemory(memory)}
                    activeOpacity={0.85}
                  >
                    {isText ? (
                      <View style={styles.textCardInner}>
                        <Ionicons name="book-outline" size={24} color="#0E7A67" />
                        <Text style={styles.textCardTitle} numberOfLines={2}>
                          {memory.title}
                        </Text>
                        <Text style={styles.textCardCaption} numberOfLines={4}>
                          {memory.caption || 'Cherished moment'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.mediaCardInner}>
                        {memory.media_key ? (
                          <Image
                            source={{ uri: memory.media_key }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.placeholderMedia}>
                            <Ionicons
                              name={isVideo ? 'videocam' : 'image'}
                              size={32}
                              color="#8A9592"
                            />
                          </View>
                        )}
                        {isVideo && (
                          <View style={styles.playBadge}>
                            <Ionicons name="play" size={16} color="#FFFFFF" />
                          </View>
                        )}
                        <View style={styles.mediaDetails}>
                          <Text style={styles.mediaTitle} numberOfLines={1}>
                            {memory.title}
                          </Text>
                          {memory.creator_name && (
                            <Text style={styles.mediaAuthor} numberOfLines={1}>
                              Added by {memory.creator_name}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Memory Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a Cherished Memory</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#161E1C" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.typeSelectorRow}>
              {(['PHOTO', 'TEXT', 'VIDEO'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, newType === t && styles.typeBtnActive]}
                  onPress={() => setNewType(t)}
                >
                  <Text style={[styles.typeBtnText, newType === t && styles.typeBtnTextActive]}>
                    {t === 'PHOTO' ? 'Photo' : t === 'TEXT' ? 'Note / Story' : 'Video'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Ramesh’s 70th Birthday"
              placeholderTextColor="#8A9592"
            />

            <Text style={styles.modalLabel}>Description / Caption</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={newCaption}
              onChangeText={setNewCaption}
              placeholder="Share the story behind this memory..."
              placeholderTextColor="#8A9592"
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitMemoryBtn, creating && { opacity: 0.6 }]}
              onPress={handleCreateMemory}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitMemoryBtnText}>Save Memory</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#161E1C',
  },
  headerSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0E7A67',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
    backgroundColor: '#FAF8F5',
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  filterChipActive: {
    backgroundColor: '#0E7A67',
    borderColor: '#0E7A67',
  },
  filterChipText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#52605D',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: F.semiBold,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: F.semiBold,
    fontSize: 16,
    color: '#161E1C',
    marginTop: 10,
  },
  emptyDesc: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E7A67',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 16,
  },
  emptyAddBtnText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    overflow: 'hidden',
    marginBottom: 4,
  },
  textCardInner: {
    padding: 14,
    backgroundColor: '#FBF9F5',
    minHeight: 150,
  },
  textCardTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#161E1C',
    marginTop: 8,
  },
  textCardCaption: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 6,
    lineHeight: 16,
  },
  mediaCardInner: {
    height: 180,
  },
  mediaImage: {
    width: '100%',
    height: 120,
  },
  placeholderMedia: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0ECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    position: 'absolute',
    top: 45,
    left: '50%',
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaDetails: {
    padding: 8,
  },
  mediaTitle: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#161E1C',
  },
  mediaAuthor: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#8A9592',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#161E1C',
  },
  modalLabel: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#161E1C',
    marginBottom: 6,
    marginTop: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#EBF5F3',
    borderColor: '#0E7A67',
  },
  typeBtnText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#52605D',
  },
  typeBtnTextActive: {
    color: '#0E7A67',
    fontFamily: F.semiBold,
  },
  modalInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: F.regular,
    fontSize: 14,
    color: '#161E1C',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitMemoryBtn: {
    backgroundColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitMemoryBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
