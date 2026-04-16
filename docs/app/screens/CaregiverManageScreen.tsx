import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import {
  IconDashboard,
  IconBell,
  IconActivity,
  IconProfile,
} from '../assets/icons/NavIcons';

type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverManage'>;
type CaregiverTab = 'Home' | 'Alerts' | 'Manage' | 'Profile';

type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<CaregiverTab, React.FC<TabIconProps>> = {
  Home:     ({ active }) => <IconDashboard size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Alerts:   ({ active }) => <IconBell     size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Manage:   ({ active }) => <IconActivity size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Profile:  ({ active }) => <IconProfile  size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

const EditActionIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25Z"
      stroke="#0E7364"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.88 5.12l3.75 3.75"
      stroke="#0E7364"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DeleteActionIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x={7} y={9} width={10} height={10} rx={1.5} stroke="#DC2626" strokeWidth={2.2} />
    <Path d="M5 7h14" stroke="#DC2626" strokeWidth={2.2} strokeLinecap="round" />
    <Path d="M9 7V5.5h6V7" stroke="#DC2626" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke="#DC2626" strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export const CaregiverManageScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<CaregiverTab>('Manage');
  type RoutineItem = {
    id: string;
    icon: string;
    title: string;
    time: string;
    meta: string;
    status?: 'pending';
  };

  const [items, setItems] = useState<RoutineItem[]>([
    { id: 'breakfast', icon: '🍞', title: 'Breakfast', time: '07:00', meta: 'Oatmeal with fresh berries' },
    { id: 'walk', icon: '🚶', title: 'Walk', time: '07:00', meta: '15 mins around the garden' },
    { id: 'meds', icon: '💊', title: 'Meds', time: '08:00', meta: 'Blood pressure & Vitamins', status: 'pending' },
  ]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [metaInput, setMetaInput] = useState('');

  const clearForm = () => {
    setTitleInput('');
    setTimeInput('');
    setMetaInput('');
    setEditingId(null);
  };

  const startAdd = () => {
    clearForm();
    setTimeInput('09:00');
    setIsFormVisible(true);
  };

  const startEdit = (item: RoutineItem) => {
    setEditingId(item.id);
    setTitleInput(item.title);
    setTimeInput(item.time);
    setMetaInput(item.meta);
    setIsFormVisible(true);
  };

  const pickIconForTitle = (title: string) => {
    const key = title.toLowerCase();
    if (key.includes('walk')) return '🚶';
    if (key.includes('med')) return '💊';
    if (key.includes('break')) return '🍞';
    return '📝';
  };

  const saveRoutine = () => {
    const cleanTitle = titleInput.trim();
    const cleanTime = timeInput.trim();
    const cleanMeta = metaInput.trim();
    if (!cleanTitle || !cleanTime || !cleanMeta) return;

    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: cleanTitle,
                time: cleanTime,
                meta: cleanMeta,
                icon: pickIconForTitle(cleanTitle),
              }
            : item
        )
      );
    } else {
      const id = `${Date.now()}`;
      setItems((prev) => [
        ...prev,
        {
          id,
          title: cleanTitle,
          time: cleanTime,
          meta: cleanMeta,
          icon: pickIconForTitle(cleanTitle),
          status: 'pending',
        },
      ]);
    }

    setIsFormVisible(false);
    clearForm();
  };

  const deleteRoutine = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) {
      setIsFormVisible(false);
      clearForm();
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Daily Flow</Text>
          <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.pressed]} onPress={startAdd}>
            <Text style={styles.addPlus}>＋</Text>
            <Text style={styles.addText}>Add Routine</Text>
          </Pressable>
        </View>

        {isFormVisible ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? 'Edit Routine' : 'Add Routine'}</Text>
            <TextInput
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder="Title (e.g. Breakfast)"
              placeholderTextColor="#0209187f"
              style={styles.input}
            />
            <TextInput
              value={timeInput}
              onChangeText={setTimeInput}
              placeholder="Time (e.g. 09:00)"
              placeholderTextColor="#6B7280"
              style={styles.input}
            />
            <TextInput
              value={metaInput}
              onChangeText={setMetaInput}
              placeholder="Details"
              placeholderTextColor="#6B7280"
              style={styles.input}
            />
            <View style={styles.formActions}>
              <Pressable style={({ pressed }) => [styles.formBtnSecondary, pressed && styles.pressed]} onPress={() => { setIsFormVisible(false); clearForm(); }}>
                <Text style={styles.formBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.formBtnPrimary, pressed && styles.pressed]} onPress={saveRoutine}>
                <Text style={styles.formBtnPrimaryText}>{editingId ? 'Save' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconWrap}><Text style={styles.icon}>{item.icon}</Text></View>
            <View style={styles.content}>
              <View style={styles.pendingRow}>
                <Text style={styles.time}>{item.time}</Text>
                {item.status === 'pending' ? <Text style={styles.pendingPill}>PENDING</Text> : null}
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.meta}</Text>
            </View>
            <View style={styles.rightActions}>
              <Pressable style={({ pressed }) => [styles.iconButton, styles.editButton, pressed && styles.pressed]} onPress={() => startEdit(item)}>
                <EditActionIcon />
              </Pressable>
              <Pressable style={({ pressed }) => [styles.iconButton, styles.deleteButton, pressed && styles.pressed]} onPress={() => deleteRoutine(item.id)}>
                <DeleteActionIcon />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ── Bottom Nav ──────────────────────────────────────────────────── */}
      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Alerts', 'Manage', 'Profile'] as CaregiverTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = TAB_ICON_COMPONENTS[tab];
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  setActiveTab(tab);
                  if (tab === 'Home') navigation.navigate('CaregiverPatients');
                }}
                style={styles.bottomTab}
              >
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent active={isActive} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>
                  {tab === 'Manage' ? 'manage' : tab}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F1F4F4', paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 96 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  addButton: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, backgroundColor: '#0E7364', paddingHorizontal: 18, paddingVertical: 9 },
  addPlus: { color: '#FFFFFF', fontSize: 22, marginRight: 6, fontWeight: '700', lineHeight: 24 },
  addText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.85 },

  formCard: {
    backgroundColor: '#e0e6e6ff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  formTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  input: {
    backgroundColor: '#F8FAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 13,
    color: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 2 },
  formBtnPrimary: { backgroundColor: '#0E7364', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  formBtnSecondary: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  formBtnPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  formBtnSecondaryText: { color: '#334155', fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: '#E4F4EE',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F2F4F4', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  icon: { fontSize: 23 },
  content: { flex: 1, marginLeft: 12, paddingTop: 0 },
  time: { fontSize: 14, color: '#0E7364', fontWeight: '700', lineHeight: 16 },
  itemTitle: { fontSize: 33, color: '#111827', fontWeight: '700', lineHeight: 35, marginTop: 0 },
  itemMeta: { fontSize: 11, color: '#374151', fontWeight: '400', lineHeight: 14, marginTop: 1 },
  rightActions: { alignItems: 'center', paddingTop: 4, gap: 12 },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: { backgroundColor: '#D6F0EC' },
  deleteButton: { backgroundColor: '#FEE2E2' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendingPill: { fontSize: 9, fontWeight: '700', color: '#111827', backgroundColor: '#A7F37C', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },

  // ── Bottom nav ──────────────────────────────────────────────────────────────
  bottomBarBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 76,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
  },
  bottomBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8,
  },
  bottomTab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, position: 'relative',
  },
  bottomTabIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  bottomLabel: { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  activeIndicator: { position: 'absolute', bottom: 0, width: 18, height: 2.5, borderRadius: 2, backgroundColor: C.primary },
});
