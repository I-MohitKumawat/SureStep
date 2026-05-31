import React, { useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { useCaregiver } from '../../hooks/useCaregiver';
import { AiFab } from '../../components/shared/AiAssistantFab';
import { IconHome, IconFamily, IconActivity, IconSearch, IconProfile } from '../../assets/icons/NavIcons';
import { ACTIVITY_CATALOGUE, wasPlayedToday, type Activity, type ActivityCategory } from '../../activities/activityData';
import type { PatientStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientActivitiesScreen'>;
type Tab = 'Home' | 'Family' | 'Activity' | 'Search';

// â”€â”€â”€ Inline SVG icons (guaranteed to render) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ActivityIcon({ id, color, size = 40 }: { id: string; color: string; size?: number }) {
  const s = size;
  const sw = 1.6;
  switch (id) {
    case 'memory-match':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="4" width="9" height="13" rx="2" stroke={color} strokeWidth={sw}/>
        <Rect x="13" y="4" width="9" height="13" rx="2" stroke={color} strokeWidth={sw}/>
        <Line x1="5" y1="10" x2="9" y2="10" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <Line x1="15" y1="10" x2="19" y2="10" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
      </Svg>;
    case 'word-search':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={sw}/>
        <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth={sw}/>
        <Line x1="3" y1="15" x2="21" y2="15" stroke={color} strokeWidth={sw}/>
        <Line x1="9" y1="3" x2="9" y2="21" stroke={color} strokeWidth={sw}/>
        <Line x1="15" y1="3" x2="15" y2="21" stroke={color} strokeWidth={sw}/>
      </Svg>;
    case 'jigsaw-puzzle':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.5 2.5 0 0 1 0 5H2V20a2 2 0 0 0 2 2h3.8v-1.5a2.5 2.5 0 0 1 5 0V22H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>;
    case 'sit-and-step':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="5" r="2" stroke={color} strokeWidth={sw}/>
        <Path d="M9 10h6M10 10v5l-2 4M14 10v5l2 4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <Line x1="5" y1="16" x2="19" y2="16" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
      </Svg>;
    case 'spin-and-strengthen':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M21 2v6h-6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3 12a9 9 0 0 1 15-6.7L21 8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3 22v-6h6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M21 12a9 9 0 0 1-15 6.7L3 16" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>;
    case 'neck-relief':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="6" r="3" stroke={color} strokeWidth={sw}/>
        <Path d="M12 9v4" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <Path d="M8 20c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <Path d="M6 10c-1.5.5-2 1.5-2 2.5M18 10c1.5.5 2 1.5 2 2.5" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
      </Svg>;
    case 'music-listen':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>;
    case 'meditation':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="5" r="2.5" stroke={color} strokeWidth={sw}/>
        <Path d="M7 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <Path d="M4 16c0-1.1.9-2 2-2M20 16c0-1.1-.9-2-2-2" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <Line x1="7" y1="14" x2="17" y2="14" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
      </Svg>;
    case 'breathing-exercise':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={sw}/>
        <Circle cx="12" cy="12" r="7" stroke={color} strokeWidth={sw} strokeDasharray="3 2"/>
        <Line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <Line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <Line x1="2" y1="12" x2="5" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <Line x1="19" y1="12" x2="22" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
      </Svg>;
    default:
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={sw}/>
      </Svg>;
  }
}

function CategoryIcon({ id, color, size = 18 }: { id: string; color: string; size?: number }) {
  const sw = 1.8;
  switch (id) {
    case 'games':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.5 2.5 0 0 1 0 5H2V20a2 2 0 0 0 2 2h3.8v-1.5a2.5 2.5 0 0 1 5 0V22H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>;
    case 'workout':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="5.5" y="5" width="2" height="14" rx="1" stroke={color} strokeWidth={sw}/>
        <Rect x="16.5" y="5" width="2" height="14" rx="1" stroke={color} strokeWidth={sw}/>
        <Line x1="7.5" y1="12" x2="16.5" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <Rect x="3" y="8" width="2.5" height="8" rx="1" stroke={color} strokeWidth={sw}/>
        <Rect x="18.5" y="8" width="2.5" height="8" rx="1" stroke={color} strokeWidth={sw}/>
      </Svg>;
    case 'relaxing':
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M17 8C8 10 5.9 16.17 3.82 19.34a1 1 0 0 0 1.38 1.38C7.55 18.7 13.5 17 17 8z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M4 20l3-3" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
      </Svg>;
    default:
      return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={sw}/>
      </Svg>;
  }
}

// â”€â”€â”€ Activity Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ActivityCard({ activity, onPress }: { activity: Activity; onPress: () => void }) {
  const played = wasPlayedToday(activity.id);
  const scale  = React.useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 4 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={[crd.wrap, { transform: [{ scale }] }]}>
        <View style={[crd.thumb, { backgroundColor: activity.bgColor }]}>
          <View style={[crd.glow, { backgroundColor: activity.color + '30' }]} />
          <ActivityIcon id={activity.id} color={activity.color} size={40} />
          {played && (
            <View style={[crd.badge, { backgroundColor: activity.color }]}>
              <Text style={crd.badgeText}>Done</Text>
            </View>
          )}
        </View>
        <View style={crd.foot}>
          <Text style={crd.name} numberOfLines={2}>{activity.title}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const crd = StyleSheet.create({
  wrap: {
    width: 152, backgroundColor: '#fff', borderRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 5,
    overflow: 'hidden',
  },
  thumb:     { height: 116, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  glow:      { position: 'absolute', width: 70, height: 70, borderRadius: 35 },
  badge:     { position: 'absolute', top: 10, right: 10, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: F.bold, fontSize: 9, color: '#fff' },
  foot:      { padding: 12, backgroundColor: '#fff' },
  name:      { fontFamily: F.extraBold, fontSize: 13, color: '#1C1C2E', lineHeight: 18 },
});

// â”€â”€â”€ Category Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CategorySection({
  category, onPress, onSeeMore,
}: {
  category: ActivityCategory;
  onPress: (a: Activity) => void;
  onSeeMore: () => void;
}) {
  return (
    <View style={sec.wrap}>
      <View style={sec.hdr}>
        <View style={sec.hdrLeft}>
          <View style={[sec.iconBox, { backgroundColor: category.bgColor }]}>
            <CategoryIcon id={category.id} color={category.color} size={18} />
          </View>
          <Text style={sec.label}>{category.label}</Text>
        </View>
        <Pressable onPress={onSeeMore} hitSlop={12} style={sec.seeBtn}>
          <Text style={sec.seeTxt}>See all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sec.row} decelerationRate="fast">
        {category.activities.map((a: Activity) => (
          <ActivityCard key={a.id} activity={a} onPress={() => onPress(a)} />
        ))}
      </ScrollView>
    </View>
  );
}

const sec = StyleSheet.create({
  wrap:    { marginBottom: 32 },
  hdr:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  hdrLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:   { fontFamily: F.extraBold, fontSize: 17, color: '#1C1C2E' },
  seeBtn:  { backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  seeTxt:  { fontFamily: F.bold, fontSize: 12, color: '#6B7280' },
  row:     { paddingHorizontal: 20, gap: 12 },
});

// ─── See-All Sheet ─────────────────────────────────────────────────────────────

function SeeAllSheet({
  category, visible, onClose, onPress,
}: {
  category: ActivityCategory | null;
  visible: boolean;
  onClose: () => void;
  onPress: (a: Activity) => void;
}) {
  if (!visible || !category) return null;
  return (
    <View style={sh.overlay}>
      <View style={sh.panel}>
        <View style={sh.handle} />
        <View style={sh.hdr}>
          <View style={sh.hdrLeft}>
            <View style={[sh.catIcon, { backgroundColor: category.bgColor }]}>
              <CategoryIcon id={category.id} color={category.color} size={18} />
            </View>
            <Text style={sh.title}>{category.label}</Text>
          </View>
          <Pressable onPress={onClose} style={sh.doneBtn} hitSlop={10}>
            <Text style={sh.doneTxt}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={sh.list} showsVerticalScrollIndicator={false}>
          {category.activities.map((a: Activity) => {
            const played = wasPlayedToday(a.id);
            return (
              <Pressable key={a.id} onPress={() => { onClose(); onPress(a); }}
                style={({ pressed }) => [sh.row, pressed && { opacity: 0.82 }]}>
                <View style={[sh.rowIcon, { backgroundColor: a.bgColor }]}>
                  <View style={[sh.rowGlow, { backgroundColor: a.color + '28' }]} />
                  <ActivityIcon id={a.id} color={a.color} size={28} />
                </View>
                <View style={sh.info}>
                  <Text style={sh.rowTitle}>{a.title}</Text>
                  <Text style={sh.rowMeta}>{a.durationMin} min</Text>
                </View>
                <View style={[sh.pill, played ? { backgroundColor: a.color + '18' } : { backgroundColor: a.color }]}>
                  <Text style={[sh.pillTxt, { color: played ? a.color : '#fff' }]}>{played ? 'Done' : 'Play'}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const sh = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,15,30,0.48)', zIndex: 100, justifyContent: 'flex-end' },
  panel:   { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%', paddingBottom: 32 },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  hdr:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16 },
  hdrLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:   { fontFamily: F.extraBold, fontSize: 20, color: '#1C1C2E' },
  doneBtn: { backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  doneTxt: { fontFamily: F.bold, fontSize: 13, color: '#6B7280' },
  list:    { paddingHorizontal: 16, gap: 10, paddingBottom: 12 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FAFAFA', borderRadius: 20, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  rowIcon: { width: 62, height: 62, borderRadius: 16, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  rowGlow: { position: 'absolute', width: 42, height: 42, borderRadius: 21 },
  info:    { flex: 1 },
  rowTitle:{ fontFamily: F.extraBold, fontSize: 15, color: '#1C1C2E' },
  rowMeta: { fontFamily: F.medium, fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  pill:    { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  pillTxt: { fontFamily: F.bold, fontSize: 13 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────────

export const PatientActivitiesView: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [seeAll, setSeeAll] = useState<ActivityCategory | null>(null);

  const go = (a: Activity) => navigation.navigate('ActivityDetailScreen', { activityId: a.id });

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F8FC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.hdr}>
          <View>
            <Text style={s.title}>Activities</Text>
            <Text style={s.sub}>Choose something to do today</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('ActivityReportsScreen')} style={s.reportBtn}>
            <IconActivity size={20} color={C.primary} strokeWidth={2} />
          </Pressable>
        </View>

        {ACTIVITY_CATALOGUE.map((cat: ActivityCategory) => (
          <CategorySection key={cat.id} category={cat} onPress={go} onSeeMore={() => setSeeAll(cat)} />
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      <SeeAllSheet category={seeAll} visible={seeAll !== null} onClose={() => setSeeAll(null)} onPress={go} />
    </View>
  );
};

export const PatientActivitiesScreen: React.FC<Props> = ({ navigation }) => {
  const { confirmedCaregiver } = useCaregiver();

  const navTo = (tab: Tab) => {
    if (tab === 'Home')     navigation.navigate('PatientHomeScreen');
    if (tab === 'Family')   navigation.navigate('PatientHomeScreen', { initialTab: 'Family' });
    if (tab === 'Activity') navigation.navigate('PatientHomeScreen', { initialTab: 'Activity' });
    if (tab === 'Search')   navigation.navigate('PatientHomeScreen', { initialTab: 'Search' });
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>
      <PatientActivitiesView navigation={navigation} />

      {/* Bottom nav */}
      <View style={s.nav}>
        {(['Home', 'Family'] as Tab[]).map((tab) => {
          const Icon = tab === 'Home' ? IconHome : IconFamily;
          return (
            <Pressable key={tab} onPress={() => navTo(tab)} style={s.navTab}>
              <Icon size={22} color="#9CA3AF" strokeWidth={1.8} />
              <Text style={s.navLbl}>{tab}</Text>
            </Pressable>
          );
        })}
        <View style={s.fabSlot}><AiFab /></View>
        {(['Activity', 'Search'] as Tab[]).map((tab) => {
          const active = tab === 'Activity';
          const Icon   = tab === 'Activity' ? IconActivity : confirmedCaregiver ? IconProfile : IconSearch;
          const label  = tab === 'Search' && confirmedCaregiver ? confirmedCaregiver.name.split(' ')[0] : tab;
          return (
            <Pressable key={tab} onPress={() => navTo(tab)} style={s.navTab}>
              {active ? (
                <View style={s.actPill}><Icon size={20} color="#fff" strokeWidth={2.2} /></View>
              ) : (
                <Icon size={22} color="#9CA3AF" strokeWidth={1.8} />
              )}
              <Text style={[s.navLbl, active && { color: C.primary, fontFamily: F.bold }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  screen:    { backgroundColor: '#F7F8FC', paddingHorizontal: 0, paddingVertical: 0 },
  scroll:    { paddingTop: 14, paddingBottom: 100 },
  hdr:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 28 },
  title:     { fontFamily: F.extraBold, fontSize: 28, color: '#1C1C2E' },
  sub:       { fontFamily: F.medium, fontSize: 13, color: '#9CA3AF', marginTop: 3 },
  reportBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  nav:       { position: 'absolute', left: 0, right: 0, bottom: 0, height: 76, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: -3 }, shadowRadius: 12, elevation: 12, overflow: 'visible' },
  navTab:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 3 },
  navLbl:    { fontFamily: F.medium, fontSize: 10, color: '#9CA3AF' },
  fabSlot:   { width: 72, alignItems: 'center', justifyContent: 'flex-start', marginTop: -40 },
  actPill:   { width: 44, height: 34, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
});
