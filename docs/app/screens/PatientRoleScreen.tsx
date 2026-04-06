import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path, Rect } from 'react-native-svg';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientDashboard'>;
type ActionState = 'done' | 'missed' | 'unsure' | null;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type Task = {
  id: string;
  title: string;
  time: string;
  state: ActionState;
};

type HomeData = {
  userName: string;
  dayLabel: string;
  dateLabel: string;
};

const screenData: HomeData = {
  userName: 'Josh',
  dayLabel: 'Its Monday',
  dateLabel: '29-03-2026'
};

const statusColors: Record<Exclude<ActionState, null>, { bg: string; text: string }> = {
  done: { bg: '#A6F1C9', text: '#2d2d2d' },
  missed: { bg: '#F3B7B8', text: '#2d2d2d' },
  unsure: { bg: '#E7DF8A', text: '#696969' }
};

const actionSpecs: Array<{ key: Exclude<ActionState, null>; label: string }> = [
  { key: 'done', label: '👍' },
  { key: 'missed', label: '👎' },
  { key: 'unsure', label: '?' }
];

const ActionButton = ({
  label,
  selected,
  tone,
  onPress
}: {
  label: string;
  selected: boolean;
  tone: { bg: string; text: string };
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: selected ? tone.bg : '#D6D6D6' },
        pressed ? { transform: [{ scale: 0.96 }] } : null
      ]}
    >
      <Text style={[styles.actionLabel, { color: selected ? tone.text : '#666666' }]}>{label}</Text>
    </Pressable>
  );
};

function BreadIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="10" y="20" width="44" height="30" rx="10" fill="#F2C17A" />
      <Rect x="14" y="24" width="36" height="22" rx="9" fill="#F7D6A1" />
      <Path d="M16 30c6-8 26-10 34 0" stroke="#D69A4D" strokeWidth="3" fill="none" opacity="0.7" />
    </Svg>
  );
}

function PillIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="14" y="14" width="36" height="36" rx="18" fill="#EEF1F6" />
      <Path
        d="M22 41a10 10 0 0 1 0-14l5-5a10 10 0 0 1 14 0l1 1-19 19-1-1Z"
        fill="#E4636A"
      />
      <Path
        d="M42 23a10 10 0 0 1 0 14l-5 5a10 10 0 0 1-14 0l-1-1 19-19 1 1Z"
        fill="#7BCB8F"
      />
      <Path d="M27 37 37 27" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
    </Svg>
  );
}

function ShoeIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="14" y="14" width="36" height="36" rx="18" fill="#EEF1F6" />
      <Path
        d="M21 39c3 0 7-2 10-6 2-3 4-6 6-6 3 0 4 4 7 6 2 2 6 3 7 6 1 2-1 6-6 6H24c-3 0-4-3-3-6Z"
        fill="#4E86FF"
      />
      <Path d="M27 36h10" stroke="#EAF0FF" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <Path d="M25 40h22" stroke="#2D5AD6" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
    </Svg>
  );
}

const TaskItem = ({
  task,
  compact,
  onStateChange
}: {
  task: Task;
  compact?: boolean;
  onStateChange: (id: string, state: Exclude<ActionState, null>) => void;
}) => {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskLeft}>
        <View style={[styles.taskIconCircle, compact ? styles.taskIconCircleCompact : null]}>
          {task.id === 'breakfast' ? (
            <BreadIcon size={28} />
          ) : task.id === 'walk' ? (
            <ShoeIcon size={28} />
          ) : (
            <PillIcon size={28} />
          )}
        </View>
        <View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskTime}>{task.time}</Text>
        </View>
      </View>
      <View style={styles.actionsRow}>
        {actionSpecs.map((spec) => (
          <ActionButton
            key={spec.key}
            label={spec.label}
            selected={task.state === spec.key}
            tone={statusColors[spec.key]}
            onPress={() => onStateChange(task.id, spec.key)}
          />
        ))}
      </View>
    </View>
  );
};

const TaskDetailsModal = ({
  visible,
  task,
  onClose,
  onCallCaregiver
}: {
  visible: boolean;
  task: { taskId: string; taskTitle: string; phoneNumber: string } | null;
  onClose: () => void;
  onCallCaregiver: (phoneNumber: string) => void;
}) => {
  if (!visible || !task) return null;

  const getTaskDetails = () => {
    switch (task.taskId) {
      case 'breakfast':
        return {
          icon: <BreadIcon size={60} />,
          description: 'Start your day with a nutritious breakfast',
          details: [
            'Oatmeal with fruits and nuts',
            'Whole wheat toast with avocado',
            'Fresh orange juice',
            'Take your time and eat slowly'
          ]
        };
      case 'meds':
        return {
          icon: <PillIcon size={60} />,
          description: 'Take your prescribed medication',
          details: [
            'Blood pressure medication: 1 tablet',
            'Vitamin D supplement: 1 capsule',
            'Take with water after breakfast',
            'Wait 30 minutes before lying down'
          ]
        };
      case 'walk':
        return {
          icon: <ShoeIcon size={60} />,
          description: 'Daily exercise for better health',
          details: [
            'Walk in the garden for 20 minutes',
            'Maintain steady pace',
            'Stay hydrated',
            'Best time: morning or evening'
          ]
        };
      default:
        return {
          icon: <PillIcon size={60} />,
          description: 'Complete your routine',
          details: ['Follow your daily schedule']
        };
    }
  };

  const taskDetails = getTaskDetails();

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{task.taskTitle}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        </View>
        
        <View style={styles.modalBody}>
          <View style={styles.modalIcon}>
            {taskDetails.icon}
          </View>
          
          <Text style={styles.modalDescription}>{taskDetails.description}</Text>
          
          <View style={styles.modalDetailsList}>
            {taskDetails.details.map((detail, index) => (
              <Text key={index} style={styles.detailItem}>• {detail}</Text>
            ))}
          </View>
        </View>

        <View style={styles.modalActions}>
          <Pressable
            onPress={() => onCallCaregiver(task.phoneNumber)}
            style={styles.callButton}
          >
            <Text style={styles.callButtonText}>📞 Call Caregiver</Text>
          </Pressable>
          
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const HeaderCard = ({
  greetingName,
  dayLabel,
  dateLabel
}: {
  greetingName: string;
  dayLabel: string;
  dateLabel: string;
}) => {
  return (
    <View style={styles.headerCard}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerGreeting}>{`Morning ${greetingName}`}</Text>
          <Text style={styles.headerDay}>{dayLabel}</Text>
          <Text style={styles.headerDate}>{dateLabel}</Text>
        </View>
        <View style={styles.weatherCard}>
          <View style={styles.weatherSun} />
          <View style={styles.weatherCloudBig} />
          <View style={styles.weatherCloudSmall} />
        </View>
      </View>
    </View>
  );
};

const RoutineCard = ({
  task,
  onTaskStateChange,
  upNextTask
}: {
  task: Task;
  onTaskStateChange: (id: string, state: Exclude<ActionState, null>) => void;
  upNextTask: Task;
}) => {
  return (
    <>
      <View style={styles.routineCard}>
        <Text style={styles.routineTitle}>Routine</Text>
        <Text style={styles.pillsFloat}>💊  💊  💊</Text>
        <TaskItem task={task} onStateChange={onTaskStateChange} />
      </View>
      <Text style={styles.upNextTitle}>Up Next</Text>
      <TaskItem task={upNextTask} compact onStateChange={onTaskStateChange} />
    </>
  );
};

function BottomIcon({ tab, active }: { tab: BottomTab; active: boolean }) {
  const color = active ? '#4E4E4E' : '#5F5F5F';

  if (tab === 'Home') {
    return (
      <View style={styles.iconHomeWrap}>
        <View style={[styles.iconRoof, { backgroundColor: color }]} />
        <View style={[styles.iconHouseBody, { borderColor: color }]} />
      </View>
    );
  }

  if (tab === 'Family') {
    return (
      <View style={styles.iconFamilyWrap}>
        <View style={[styles.iconFamilyHeadLeft, { borderColor: color }]} />
        <View style={[styles.iconFamilyHeadRight, { borderColor: color }]} />
        <View style={[styles.iconFamilyBase, { borderColor: color }]} />
      </View>
    );
  }

  if (tab === 'Activity') {
    return (
      <View style={styles.iconActivityWrap}>
        <View style={[styles.iconActivityCircle, { borderColor: color }]} />
        <View style={[styles.iconActivityCheck, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.iconSearchWrap}>
      <View style={[styles.iconSearchCircle, { borderColor: color }]} />
      <View style={[styles.iconSearchHandle, { backgroundColor: color }]} />
    </View>
  );
}

export const PatientRoleScreen: React.FC<Props> = ({ navigation }) => {
  const [data] = useState<HomeData>(screenData);
  const [activeTab, setActiveTab] = useState<BottomTab>('Home');

  const [tasks, setTasks] = useState<Task[]>([
    { id: 'breakfast', title: 'Breakfast', time: '09:00 am', state: null },
    { id: 'meds', title: 'Meds', time: '10:00 am', state: null },
    { id: 'walk', title: 'Walk', time: '11:00 am', state: null }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [taskDetailsModal, setTaskDetailsModal] = useState<null | { taskId: string; taskTitle: string; phoneNumber: string }>(
    null
  );
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const findNextIndex = (fromIndex: number) => {
    if (tasks.length === 0) return 0;
    for (let step = 1; step <= tasks.length; step++) {
      const idx = (fromIndex + step) % tasks.length;
      if (tasks[idx]?.state !== 'done') return idx;
    }
    return fromIndex;
  };

  const routineTask = useMemo(() => tasks[currentIndex], [tasks, currentIndex]);
  const upNextTask = useMemo(() => tasks[findNextIndex(currentIndex)], [tasks, currentIndex]);

  useEffect(() => {
    // If current routine is completed, advance to next non-completed routine.
    if (tasks[currentIndex]?.state === 'done') {
      setCurrentIndex(findNextIndex(currentIndex));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, currentIndex]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const randomPhoneNumber = () => {
    // Deterministic format; random digits each time it’s requested.
    const digits = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
    return `555${digits}`;
  };

  const openDialPad = async (phoneNumber: string) => {
    await Linking.openURL(`tel:${phoneNumber}`);
  };

  const updateTask = (taskId: string, state: Exclude<ActionState, null>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, state } : t)));

    if (state === 'unsure') {
      const task = tasks.find((t) => t.id === taskId);
      setTaskDetailsModal({
        taskId,
        taskTitle: task?.title ?? 'Routine',
        phoneNumber: randomPhoneNumber()
      });
      return;
    }

    setTaskDetailsModal(null);

    // When the user confirms the current routine with 👍 or 👎, advance to the next routine.
    if (taskId === tasks[currentIndex]?.id && (state === 'done' || state === 'missed')) {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      // Small delay so the selected state (green/red) is visible before advancing.
      advanceTimerRef.current = setTimeout(() => {
        const next = findNextIndex(currentIndex);
        setCurrentIndex(next);
        setTaskDetailsModal(null);
      }, 250);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <View style={styles.statusBarMock}>
        <Pressable onPress={() => navigation?.navigate('RoleEntry')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.statusTime}>07:00</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HeaderCard greetingName={data.userName} dayLabel={data.dayLabel} dateLabel={data.dateLabel} />
        <RoutineCard task={routineTask} upNextTask={upNextTask} onTaskStateChange={updateTask} />
      </ScrollView>

      <TaskDetailsModal
        visible={!!taskDetailsModal}
        task={taskDetailsModal}
        onClose={() => setTaskDetailsModal(null)}
        onCallCaregiver={openDialPad}
      />

      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Family', 'Activity', 'Search'] as BottomTab[]).map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.bottomTab}>
              <BottomIcon tab={tab} active={activeTab === tab} />
              <Text style={[styles.bottomLabel, activeTab === tab ? styles.bottomLabelActive : null]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.fab, pressed ? styles.fabPressed : null]}>
        <Text style={styles.fabSymbol}>!</Text>
      </Pressable>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F5F6', paddingHorizontal: 0, paddingVertical: 0 },
  statusBarMock: { 
    paddingHorizontal: 18, 
    paddingTop: 10, 
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#D6D6D6'
  },
  backButtonText: {
    fontSize: 16,
    color: '#2A2A31',
    fontWeight: '500'
  },
  statusTime: { fontSize: 18, color: '#1F1F1F', fontWeight: '500' },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 140 },
  headerCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#C8B9E9',
    marginBottom: 10
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerGreeting: { color: '#202027', fontSize: 30, fontWeight: '500', letterSpacing: 0.2 },
  headerDay: { color: '#272737', fontSize: 22, fontWeight: '400', marginTop: -2 },
  headerDate: { color: '#4B4B57', fontSize: 16, marginTop: 0 },
  weatherCard: {
    width: 92,
    height: 78,
    borderRadius: 16,
    backgroundColor: '#F5F5F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  weatherSun: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#F2C94C',
    position: 'absolute',
    top: 12,
    right: 14
  },
  weatherCloudBig: {
    width: 46,
    height: 22,
    borderRadius: 14,
    backgroundColor: '#C7C9EB',
    position: 'absolute',
    bottom: 18,
    left: 26
  },
  weatherCloudSmall: {
    width: 28,
    height: 16,
    borderRadius: 10,
    backgroundColor: '#D8DAF2',
    position: 'absolute',
    bottom: 20,
    left: 14
  },
  routineCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#C8B9E9'
  },
  routineTitle: { color: '#222228', fontSize: 34, fontWeight: '500' },
  pillsFloat: { position: 'absolute', right: 16, top: 18, color: '#8E7EAB', fontSize: 28 },
  taskCard: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  taskLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  taskIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBEEF4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  taskIconCircleCompact: { backgroundColor: '#F1F2F7' },
  taskIconText: { fontSize: 24 },
  taskTitle: { color: '#2A2A31', fontSize: 24, fontWeight: '400' },
  taskTime: { color: '#797A83', marginTop: -2, fontSize: 16, fontWeight: '400' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginLeft: 8 },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionLabel: { fontSize: 22, fontWeight: '500' },
  upNextTitle: {
    color: '#242429',
    marginTop: 8,
    marginLeft: 12,
    marginBottom: 6,
    fontSize: 28,
    fontWeight: '400'
  },
  bottomBarBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 92,
    backgroundColor: '#C8B9E9'
  },
  bottomBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 8
  },
  bottomTab: { alignItems: 'center', minWidth: 62, gap: 2, marginTop: 2 },
  bottomLabel: { fontSize: 12, color: '#5A5A5F', fontWeight: '400' },
  bottomLabelActive: { textDecorationLine: 'underline', fontWeight: '600' },
  quickDialWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 104,
    alignItems: 'center'
  },
  quickDialButton: {
    minWidth: 180,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#6D39F4',
    shadowColor: '#6D39F4',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 8
  },
  quickDialText: { color: '#EFE6FF', fontSize: 16, fontWeight: '800' },
  quickDialSubText: { color: '#EFE6FF', fontSize: 12, fontWeight: '700', marginTop: 4, opacity: 0.95 },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2A2A31'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666'
  },
  modalBody: {
    alignItems: 'center',
    marginBottom: 20
  },
  modalIcon: {
    marginBottom: 15
  },
  modalDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#2A2A31',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22
  },
  modalDetailsList: {
    alignSelf: 'flex-start',
    width: '100%'
  },
  detailItem: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20
  },
  modalActions: {
    gap: 10
  },
  callButton: {
    backgroundColor: '#6D39F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center'
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600'
  },
  fab: {
    position: 'absolute',
    bottom: 34,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6D39F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D39F4',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 9
  },
  fabPressed: { transform: [{ scale: 0.96 }] },
  fabSymbol: { color: '#EFE6FF', fontSize: 28, fontWeight: '800', marginTop: -1 },
  // Bottom tab icons (drawn with View primitives)
  iconHomeWrap: { width: 22, height: 18, alignItems: 'center', justifyContent: 'center' },
  iconRoof: {
    width: 13,
    height: 8,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
    marginTop: 1
  },
  iconHouseBody: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 10,
    borderWidth: 2,
    borderRadius: 4
  },

  iconFamilyWrap: { width: 22, height: 18, alignItems: 'center', justifyContent: 'center' },
  iconFamilyHeadLeft: {
    width: 8,
    height: 8,
    borderWidth: 2,
    borderRadius: 999,
    position: 'absolute',
    left: 2,
    top: 1
  },
  iconFamilyHeadRight: {
    width: 8,
    height: 8,
    borderWidth: 2,
    borderRadius: 999,
    position: 'absolute',
    right: 2,
    top: 1
  },
  iconFamilyBase: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 8,
    borderWidth: 2,
    borderRadius: 6
  },

  iconActivityWrap: { width: 22, height: 18, alignItems: 'center', justifyContent: 'center' },
  iconActivityCircle: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 999
  },
  iconActivityCheck: {
    position: 'absolute',
    width: 9,
    height: 4,
    borderRadius: 10,
    top: 8,
    transform: [{ rotate: '-45deg' }]
  },

  iconSearchWrap: { width: 22, height: 18, alignItems: 'center', justifyContent: 'center' },
  iconSearchCircle: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderRadius: 999
  },
  iconSearchHandle: {
    position: 'absolute',
    width: 7,
    height: 2.5,
    borderRadius: 10,
    right: 0,
    bottom: 2,
    transform: [{ rotate: '45deg' }]
  }
});
