/**
 * FamilyStoriesScreen — Upload and view family photos/voice notes.
 * Photos route to familiarity_assets (appear on patient's familiarity feed).
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useFamilyContext } from '../../context/FamilyContext';
import { getCareNotes, createCareNote, type CareNote } from '../../services/familyService';
import apiClient from '../../services/apiClient';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<FamilyStackParams, 'FamilyStoriesScreen'>;

export const FamilyStoriesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patient } = useFamilyContext();
  const patientId = route.params?.patientId ?? patient?.id ?? '';

  const [stories,     setStories]     = useState<any[]>([]);
  const [notes,       setNotes]       = useState<CareNote[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [noteText,    setNoteText]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [tab,         setTab]         = useState<'Stories' | 'Notes'>('Stories');

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      const [storiesRes, notesRes] = await Promise.allSettled([
        apiClient.get(`/familiarity/patient/${patientId}`),
        getCareNotes(),
      ]);
      if (storiesRes.status === 'fulfilled') {
        setStories(storiesRes.value.data?.data?.assets ?? storiesRes.value.data?.assets ?? []);
      }
      if (notesRes.status === 'fulfilled') {
        setNotes(notesRes.value.data?.data?.notes ?? []);
      }
    } catch { /* silent */ } finally { setLoading(false); setRefreshing(false); }
  }, [patientId]);

  useEffect(() => { void load(); }, [load]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to upload stories.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled) return;
    Alert.alert('Add a caption', '', [
      {
        text: 'Upload',
        onPress: async () => {
          try {
            await apiClient.post(`/familiarity/patient/${patientId}/assets`, {
              asset_type: 'PHOTO',
              label:      'Family photo',
              storage_path: result.assets[0]!.uri,
            });
            void load();
          } catch { Alert.alert('Upload failed', 'Could not upload photo.'); }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitNote = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      await createCareNote(noteText.trim());
      setNoteText(''); setShowNoteBox(false);
      void load();
    } catch (e: any) {
      Alert.alert('Failed', e?.response?.data?.error?.message ?? 'Could not save note.');
    } finally { setSubmitting(false); }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.title}>Stories & Notes</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {(['Stories', 'Notes'] as const).map(t => (
          <Pressable key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'Stories' ? '🖼️  Stories' : '📝  Care Notes'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={C.primary} />
        ) : tab === 'Stories' ? (
          <>
            <Pressable style={s.uploadBtn} onPress={pickPhoto}>
              <Text style={s.uploadBtnText}>📷  Upload Photo</Text>
            </Pressable>

            {stories.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🖼️</Text>
                <Text style={s.emptyTitle}>No stories yet</Text>
                <Text style={s.emptySub}>Upload photos to appear on the patient's familiarity feed.</Text>
              </View>
            ) : (
              <View style={s.grid}>
                {stories.map((a: any) => (
                  <View key={a.id} style={s.storyCard}>
                    {a.storage_path ? (
                      <Image source={{ uri: a.storage_path }} style={s.storyImg} />
                    ) : (
                      <View style={[s.storyImg, s.storyImgPlaceholder]}>
                        <Text style={{ fontSize: 32 }}>🖼️</Text>
                      </View>
                    )}
                    <Text style={s.storyLabel} numberOfLines={1}>{a.label ?? 'Family photo'}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Pressable style={s.uploadBtn} onPress={() => setShowNoteBox(true)}>
              <Text style={s.uploadBtnText}>📝  Add Care Note</Text>
            </Pressable>

            {showNoteBox && (
              <View style={s.noteBox}>
                <TextInput
                  style={s.noteInput}
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="e.g. Patient becomes anxious after sunset. Soft music helps."
                  placeholderTextColor={C.textMuted}
                  multiline
                  maxLength={800}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <Pressable style={[s.noteAction, { backgroundColor: C.primary }]} onPress={submitNote} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.noteActionText}>Save Note</Text>}
                  </Pressable>
                  <Pressable style={[s.noteAction, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }]} onPress={() => { setShowNoteBox(false); setNoteText(''); }}>
                    <Text style={[s.noteActionText, { color: C.textSecondary }]}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {notes.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
                <Text style={s.emptyTitle}>No care notes yet</Text>
                <Text style={s.emptySub}>Add context notes visible to the care team.</Text>
              </View>
            ) : notes.map(n => (
              <View key={n.id} style={s.noteCard}>
                <View style={s.noteCardHeader}>
                  <View style={s.noteAuthorDot} />
                  <Text style={s.noteAuthor}>{n.author_name}</Text>
                  <Text style={s.noteDate}>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                  {n.is_pinned && <Text style={s.pinBadge}>📌 Pinned</Text>}
                </View>
                <Text style={s.noteContent}>{n.content}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  screen:     { backgroundColor: C.bg },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:    { width: 60 },
  backText:   { fontFamily: F.bold, fontSize: 14, color: C.textSecondary },
  title:      { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  tabBar:     { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tabBtn:     { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  tabBtnActive:{ backgroundColor: C.primary, borderColor: C.primary },
  tabText:    { fontFamily: F.bold, fontSize: 13, color: C.textSecondary },
  tabTextActive:{ color: '#fff' },
  scroll:     { padding: 16, paddingBottom: 60 },
  uploadBtn:  { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginBottom: 20 },
  uploadBtnText:{ fontFamily: F.bold, fontSize: 15, color: '#fff' },
  emptyWrap:  { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontFamily: F.extraBold, fontSize: 20, color: C.textPrimary, marginBottom: 6 },
  emptySub:   { fontFamily: F.regular, fontSize: 13, color: C.textSecondary, textAlign: 'center' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  storyCard:  { width: '47%', backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  storyImg:   { width: '100%', height: 110 },
  storyImgPlaceholder: { backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  storyLabel: { fontFamily: F.medium, fontSize: 11, color: C.textSecondary, padding: 8 },
  noteBox:    { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  noteInput:  { fontFamily: F.regular, fontSize: 14, color: C.textPrimary, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, minHeight: 90, textAlignVertical: 'top' },
  noteAction: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  noteActionText:{ fontFamily: F.bold, fontSize: 14, color: '#fff' },
  noteCard:   { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  noteCardHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  noteAuthorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  noteAuthor: { fontFamily: F.bold, fontSize: 13, color: C.textPrimary },
  noteDate:   { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginLeft: 'auto' },
  pinBadge:   { fontFamily: F.bold, fontSize: 10, color: C.primary },
  noteContent:{ fontFamily: F.regular, fontSize: 14, color: C.textSecondary, lineHeight: 20 },
});
