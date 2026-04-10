import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { IconHome, IconFamily, IconActivity, IconSearch } from '../assets/icons/NavIcons';

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientFamily'>;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'More';

type Member = {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
};
const photoPalette = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80',
];

export const PatientFamilyScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<BottomTab>('Family');
  const [members, setMembers] = useState<Member[]>([
    { id: 'm1', name: 'Julian', role: 'Brother', photoUrl: photoPalette[0] },
    { id: 'm2', name: 'Elena', role: 'Partner', photoUrl: photoPalette[1] },
    { id: 'm3', name: 'Arthur', role: 'Father', photoUrl: photoPalette[2] },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('');

  const nextPhoto = useMemo(
    () => photoPalette[members.length % photoPalette.length] ?? photoPalette[0],
    [members.length]
  );

  const addMember = () => {
    const name = nameInput.trim();
    const role = roleInput.trim();
    if (!name || !role) return;
    setMembers((prev) => [...prev, { id: `m${Date.now()}`, name, role, photoUrl: nextPhoto }]);
    setNameInput('');
    setRoleInput('');
    setShowAddForm(false);
  };

  const onTabPress = (tab: BottomTab) => {
    setActiveTab(tab);
    if (tab === 'Home') navigation.navigate('PatientDashboard');
    if (tab === 'Activity') navigation.navigate('PatientActivities');
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>know your people?</Text>

        {showAddForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add Member</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Member name"
              placeholderTextColor={C.textMuted}
              style={styles.input}
            />
            <TextInput
              value={roleInput}
              onChangeText={setRoleInput}
              placeholder="Relationship"
              placeholderTextColor={C.textMuted}
              style={styles.input}
            />
            <View style={styles.formActions}>
              <Pressable style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]} onPress={() => setShowAddForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.addMemberBtn, pressed && styles.pressed]} onPress={addMember}>
                <Text style={styles.addMemberBtnText}>Add</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.grid}>
          {members.map((member) => (
            <Pressable
              key={member.id}
              style={({ pressed }) => [styles.memberCard, pressed && styles.pressed]}
              onPress={() =>
                navigation.navigate('PatientFamilyProfile', {
                  name: member.name,
                  role: member.role,
                  photoUrl: member.photoUrl,
                })
              }
            >
              <Image source={{ uri: member.photoUrl }} style={styles.avatar} />
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [styles.addTile, pressed && styles.pressed]}
            onPress={() => setShowAddForm(true)}
          >
            <View style={styles.addCircle}>
              <Text style={styles.addCircleText}>+</Text>
            </View>
            <Text style={styles.addTileText}>Add Member</Text>
          </Pressable>
        </View>
      </ScrollView>

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
          {(['Activity', 'More'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = tab === 'Activity' ? IconActivity : IconSearch;
            return (
              <Pressable key={tab} onPress={() => onTabPress(tab)} style={styles.bottomTab}>
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent size={22} color={isActive ? C.primary : C.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>
                  {tab}
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
  scrollContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 110 },
  pageTitle: { fontFamily: F.bold, fontSize: 18, color: C.textPrimary, marginBottom: 12, textTransform: 'lowercase' },
  formCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 14 },
  formTitle: { fontFamily: F.bold, fontSize: 14, color: C.textPrimary, marginBottom: 8 },
  input: {
    fontFamily: F.regular,
    height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.borderMid,
    backgroundColor: C.surfaceAlt, paddingHorizontal: 10, color: C.textPrimary, fontSize: 13, marginBottom: 8,
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid },
  cancelBtnText: { fontFamily: F.semiBold, fontSize: 12, color: C.textSecondary },
  addMemberBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: C.primary },
  addMemberBtnText: { fontFamily: F.bold, fontSize: 12, color: C.primaryText },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  memberCard: {
    width: '47.5%',
    minHeight: 180,
    borderRadius: 24,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  avatar: { width: 84, height: 84, borderRadius: 42, marginBottom: 12, borderWidth: 1, borderColor: C.borderMid },
  memberName: { fontFamily: F.bold, fontSize: 16, color: C.textPrimary, lineHeight: 20 },
  memberRole: { fontFamily: F.regular, fontSize: 14, color: C.textBody, marginTop: 2 },
  addTile: {
    width: '47.5%',
    minHeight: 180,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: C.borderMid,
    borderStyle: 'dashed',
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  addCircleText: { fontFamily: F.semiBold, fontSize: 34, color: C.primary, marginTop: -2 },
  addTileText: { fontFamily: F.bold, fontSize: 13, color: C.primaryDark },
  bottomBarBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 84,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  bottomBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 8, paddingTop: 8 },
  bottomTab: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', height: '100%' },
  familyActiveBg: { position: 'absolute', width: 74, height: 74, borderRadius: 37, backgroundColor: C.primary, bottom: -2 },
  bottomTabIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4, zIndex: 2 },
  bottomLabel: { fontFamily: F.medium, fontSize: 10, color: C.textMuted, zIndex: 2 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  bottomLabelFamilyActive: { color: C.primaryText },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 18,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  fabSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -34,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: C.surface,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
  fabSymbol: { fontFamily: F.extraBold, color: C.primaryText, fontSize: 22 },
  pressed: { opacity: 0.8 },
});
