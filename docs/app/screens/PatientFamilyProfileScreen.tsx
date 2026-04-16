import React from 'react';
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { IconHome, IconActivity, IconFamily, IconSearch, IconProfile } from '../assets/icons/NavIcons';
import { useCaregiver } from '../context/caregiverContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientFamilyProfile'>;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type MemoryItem = {
  id: string;
  imageUrl: string;
  title: string;
  date: string;
  details: string;
};

export const PatientFamilyProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { name, role, photoUrl } = route.params;
  const [activeTab] = React.useState<BottomTab>('Family');
  const [statusText, setStatusText] = React.useState('');
  const [selectedMemory, setSelectedMemory] = React.useState<MemoryItem | null>(null);

  const memories: MemoryItem[] = [
    {
      id: 'mem-1',
      imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=700&q=80',
      title: 'Family Lake Walk',
      date: 'August 12, 2023',
      details: `${name}, you and family enjoyed an evening walk near the lake and took this photo together.`,
    },
    {
      id: 'mem-2',
      imageUrl: 'https://images.unsplash.com/photo-1484863137850-59afcfe05386?auto=format&fit=crop&w=700&q=80',
      title: 'Temple Courtyard',
      date: 'January 7, 2024',
      details: `This memory was captured during a morning temple visit with ${name} and close family members.`,
    },
    {
      id: 'mem-3',
      imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=700&q=80',
      title: 'Birthday Celebration',
      date: 'March 3, 2024',
      details: `Birthday celebration day with ${name}; family lunch, cake cutting, and group photos.`,
    },
  ];

  const { confirmedCaregiver } = useCaregiver();

  const onTabPress = (tab: BottomTab) => {
    if (tab === 'Home') navigation.navigate('PatientDashboard');
    if (tab === 'Family') navigation.navigate('PatientFamily');
    if (tab === 'Activity') navigation.navigate('PatientActivities');
    if (tab === 'Search') navigation.navigate('PatientDashboard');
  };

  const openDialPad = async () => {
    await Linking.openURL('tel:5555555555');
  };

  const openMap = async () => {
    await Linking.openURL('https://www.google.com/maps/search/?api=1&query=Bangalore%2CIndia');
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.iconTap, pressed && styles.pressed]}>
            <Text style={styles.navIcon}>←</Text>
          </Pressable>
          <Text style={styles.pageTitle}>Family Profile</Text>
          <Pressable style={({ pressed }) => [styles.iconTap, pressed && styles.pressed]}>
            <Text style={styles.navIcon}>⋮</Text>
          </Pressable>
        </View>

        <View style={styles.heroRow}>
          <View style={styles.memberCard}>
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>Your {role}</Text>
          </View>
          <View style={styles.sideActions}>
            <Pressable
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
              onPress={() => setStatusText(`Playing ${name}'s latest voice memo`)}
            >
              <Text style={styles.actionEmoji}>🎙</Text>
              <Text style={styles.actionTitle}>Hear me</Text>
              <Text style={styles.actionMeta}>Voice Memo</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
              onPress={() => setStatusText(`Quick memo added for ${name}`)}
            >
              <Text style={styles.actionEmoji}>✚</Text>
              <Text style={styles.actionTitle}>Add Memo</Text>
              <Text style={styles.actionMeta}>Quick Note</Text>
            </Pressable>
          </View>
        </View>

        {statusText ? (
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        ) : null}

        <View style={styles.quoteCard}>
          <View style={styles.quoteBubble}>
            <Text style={styles.quoteIcon}>💬</Text>
          </View>
          <View style={styles.quoteBody}>
            <View style={styles.quoteLineLong} />
            <View style={styles.quoteLineMid} />
            <View style={styles.quoteLineShort} />
            <Text style={styles.quoteTime}>Sent 2 hours ago</Text>
          </View>
          <Text style={styles.quoteMark}>❞</Text>
        </View>

        <Text style={styles.sectionTitle}>Contact Details</Text>
        <View style={styles.contactCard}>
          <Pressable style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]} onPress={() => void openDialPad()}>
            <View style={styles.contactIconCircle}>
              <Text style={styles.contactEmoji}>📞</Text>
            </View>
            <View style={styles.contactBody}>
              <Text style={styles.contactLabel}>Phone Number</Text>
              <Text style={styles.contactValue}>555-5555-555</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.contactDivider} />
          <Pressable style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]} onPress={() => void openMap()}>
            <View style={styles.contactIconCircle}>
              <Text style={styles.contactEmoji}>📍</Text>
            </View>
            <View style={styles.contactBody}>
              <Text style={styles.contactLabel}>Location</Text>
              <Text style={styles.contactValue}>Bangalore, India</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <View style={styles.memoriesHead}>
          <Text style={styles.sectionTitle}>Memories</Text>
          <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.memoryRow}>
          {memories.map((memory) => (
            <Pressable
              key={memory.id}
              style={({ pressed }) => [styles.memoryThumb, pressed && styles.pressed]}
              onPress={() => setSelectedMemory(memory)}
            >
              <Image source={{ uri: memory.imageUrl }} style={styles.memoryImage} />
            </Pressable>
          ))}
        </View>
      </View>

      <Modal
        visible={selectedMemory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMemory(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMemory(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {selectedMemory ? (
              <Image source={{ uri: selectedMemory.imageUrl }} style={styles.modalImage} />
            ) : null}
            <Text style={styles.modalTitle}>{selectedMemory?.title}</Text>
            <Text style={styles.modalDate}>{selectedMemory?.date}</Text>
            <Text style={styles.modalDetails}>{selectedMemory?.details}</Text>
            <Pressable style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]} onPress={() => setSelectedMemory(null)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Family'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = tab === 'Home' ? IconHome : IconFamily;
            return (
              <Pressable key={tab} onPress={() => onTabPress(tab)} style={styles.bottomTab}>
                {isActive && tab === 'Family' ? <View style={styles.familyActiveBg} /> : null}
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent size={22} color={isActive ? (tab === 'Family' ? C.primaryText : C.primary) : C.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive, isActive && tab === 'Family' && styles.bottomLabelFamilyActive]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fabSlot}>
          <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
            <Text style={styles.fabSymbol}>!</Text>
          </Pressable>
        </View>

        <View style={styles.bottomBar}>
          {(['Activity', 'Search'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent =
              tab === 'Search' && confirmedCaregiver ? IconProfile : tab === 'Activity' ? IconActivity : IconSearch;
            const label =
              tab === 'Search' && confirmedCaregiver
                ? confirmedCaregiver.name.split(' ')[0]
                : tab;
            return (
              <Pressable key={tab} onPress={() => onTabPress(tab)} style={styles.bottomTab}>
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent size={22} color={isActive ? C.primary : C.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
                </View>
                <Text
                  style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {label}
                </Text>
                {isActive ? <View style={styles.activeIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 84 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  iconTap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontFamily: F.bold, fontSize: 18, color: C.primaryDark },
  pageTitle: { fontFamily: F.bold, fontSize: 19, color: C.primaryDark },
  heroRow: { flexDirection: 'row', gap: 11, marginBottom: 11 },
  memberCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10,
  },
  avatar: { width: 92, height: 92, borderRadius: 14, marginBottom: 7, borderWidth: 1, borderColor: C.borderMid },
  name: { fontFamily: F.bold, fontSize: 15, color: C.textPrimary, textAlign: 'center' },
  role: { fontFamily: F.bold, fontSize: 12, color: C.primaryDark, marginTop: 1 },
  sideActions: { width: 98, gap: 9 },
  actionCard: {
    flex: 1, minHeight: 69, borderRadius: 12, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  actionEmoji: { fontSize: 15, color: C.primary },
  actionTitle: { fontFamily: F.bold, fontSize: 13, color: C.textPrimary, marginTop: 3 },
  actionMeta: { fontFamily: F.medium, fontSize: 10, color: C.textSecondary, marginTop: 1 },
  statusPill: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 8 },
  statusText: { fontFamily: F.medium, fontSize: 11, color: C.primaryDark },
  quoteCard: {
    marginBottom: 11, borderRadius: 16, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 11, paddingVertical: 11, flexDirection: 'row', alignItems: 'center',
  },
  quoteBubble: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  quoteIcon: { fontSize: 14 },
  quoteBody: { flex: 1, marginLeft: 8 },
  quoteLineLong: { height: 8, borderRadius: 4, backgroundColor: C.border, marginBottom: 6 },
  quoteLineMid: { height: 7, borderRadius: 4, backgroundColor: C.border, width: '74%', marginBottom: 6 },
  quoteLineShort: { height: 7, borderRadius: 4, backgroundColor: C.border, width: '42%', marginBottom: 6 },
  quoteTime: { fontFamily: F.medium, fontSize: 11, color: C.textSecondary },
  quoteMark: { fontFamily: F.bold, fontSize: 24, color: C.borderMid, marginLeft: 4, marginTop: -14 },
  sectionTitle: { fontFamily: F.bold, fontSize: 14, color: C.textPrimary, marginBottom: 7 },
  contactCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 11 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10 },
  contactIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  contactEmoji: { fontSize: 14 },
  contactBody: { flex: 1, marginLeft: 10 },
  contactLabel: { fontFamily: F.medium, fontSize: 11, color: C.textSecondary },
  contactValue: { fontFamily: F.bold, fontSize: 14, color: C.textPrimary, marginTop: 1 },
  chevron: { fontFamily: F.bold, fontSize: 18, color: C.textSecondary, marginTop: -1 },
  contactDivider: { height: 1, marginHorizontal: 10, backgroundColor: C.border },
  memoriesHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { fontFamily: F.bold, fontSize: 13, color: C.primaryDark },
  memoryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  memoryThumb: { flex: 1, height: 96, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  memoryImage: { width: '100%', height: '100%' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { width: '100%', borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14 },
  modalImage: { width: '100%', height: 140, borderRadius: 10, marginBottom: 10 },
  modalTitle: { fontFamily: F.bold, fontSize: 16, color: C.textPrimary },
  modalDate: { fontFamily: F.medium, fontSize: 12, color: C.textSecondary, marginTop: 2, marginBottom: 8 },
  modalDetails: { fontFamily: F.regular, fontSize: 13, color: C.textBody, lineHeight: 18 },
  modalCloseBtn: { marginTop: 12, alignSelf: 'flex-end', borderRadius: 999, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 7 },
  modalCloseText: { fontFamily: F.bold, fontSize: 12, color: C.primaryText },
  bottomBarBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 76,
    backgroundColor: C.surface,
    borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  bottomBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 8, paddingBottom: 8 },
  bottomTab: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', height: '100%' },
  familyActiveBg: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, bottom: -2 },
  bottomTabIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4, zIndex: 2 },
  bottomLabel: { fontFamily: F.medium, fontSize: 10, color: C.textMuted, zIndex: 2 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  bottomLabelFamilyActive: { color: C.primaryText },
  activeIndicator: { position: 'absolute', bottom: 0, width: 18, height: 2.5, borderRadius: 2, backgroundColor: C.primary },
  fabSlot: { width: 72, alignItems: 'center', justifyContent: 'flex-start', marginTop: -34 },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.38, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 10,
    borderWidth: 3, borderColor: C.surface,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
  fabSymbol: { fontFamily: F.extraBold, color: C.primaryText, fontSize: 22 },
  pressed: { opacity: 0.82 },
});
