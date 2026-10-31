import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { CaregiverStackParams } from '../../types/navigation.types';
import {
  fetchRoutineDefinitions,
  deleteRoutineDefinition,
  routineTime,
  routineFrequency,
  routineDays,
  type RoutineDefinition,
} from '../../services/routineService';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverPatientRoutinesScreen'>;
type ScreenTab = 'daily_flow' | 'care_plan';

// SVG Icons
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke={C.textPrimary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EditIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={C.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke={C.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DeleteIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="#DC2626" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDownIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={C.textMuted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronUpIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 15l6-6 6 6" stroke={C.textMuted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PaperclipIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke={C.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const VolumeIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 5L6 9H2v6h4l5 4V5z" fill={C.primary} stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CaregiverPatientRoutinesScreen: React.FC<Props> = ({ navigation, route }) => {
  const patientId = route.params?.patientId;
  const patientName = route.params?.patientName ?? 'Patient';

  const { tasks: contextTasks, loadTasksForPatient, updateTaskStatus } = useTasks();
  const tasks = useMemo(() => contextTasks.filter(t => t.patientId === patientId), [contextTasks, patientId]);
  const { user } = useAuth();
  // Professional Caregivers are strictly denied routine-definition CRUD in V1.
  const canManageDefinitions = user?.role === 'PATIENT';

  const [activeTab, setActiveTab] = useState<ScreenTab>('daily_flow');
  const [templates, setTemplates] = useState<RoutineDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<Set<string>>(new Set());

  // Load all daily tasks and routine templates
  const loadData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [_, definitions] = await Promise.all([
        loadTasksForPatient(patientId, true),
        fetchRoutineDefinitions(patientId)
      ]);
      setTemplates(definitions);
    } catch (err) {
      console.error('[CaregiverPatientRoutines] Failed to fetch routines:', err);
      Alert.alert('Connection Error', 'Could not load patient routines. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [patientId, loadTasksForPatient]);

  // Reload data when screen is focused (handles returning from editor)
  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  // Toggle card expansion (shows instructions and caregiver notes)
  const toggleTaskExpanded = (id: string) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTemplateExpanded = (id: string) => {
    setExpandedTemplateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sign off a canonical routine occurrence (care participation only).
  const handleSignOff = async (occurrenceId: string) => {
    try {
      await updateTaskStatus(occurrenceId, 'done');
    } catch (err) {
      console.error('[CaregiverPatientRoutines] Sign-off failed:', err);
      Alert.alert('Error', 'Failed to sign off this routine. Please retry.');
    }
  };

  // Deactivate a canonical routine definition.
  const handleDeactivateTemplate = (templateId: string, templateTitle: string) => {
    Alert.alert(
      'Deactivate Routine',
      `Are you sure you want to deactivate "${templateTitle}"? This stops future occurrences.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setTemplates(prev => prev.filter(t => t.id !== templateId));
              await deleteRoutineDefinition(patientId!, templateId);
              Alert.alert('Success', 'Routine definition deactivated.');
            } catch (err) {
              console.error('[CaregiverPatientRoutines] Failed to deactivate routine:', err);
              Alert.alert('Error', 'Failed to deactivate routine.');
              void loadData();
            }
          }
        }
      ]
    );
  };

  // Format recurrence labels from the canonical schedule pattern.
  const formatRecurrence = (definition: RoutineDefinition) => {
    if (routineFrequency(definition) === 'WEEKLY') {
      const days = routineDays(definition);
      if (days.length === 7) return 'Every day';
      if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
      if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.length > 0
        ? `Weekly on ${days.map((d: number) => dayNames[d]).join(', ')}`
        : 'Weekly';
    }
    return 'Every day';
  };

  // Helper for status badge styling. Canonical states only.
  const getStatusBadge = (status: string) => {
    const clean = (status || 'pending').toLowerCase();
    switch (clean) {
      case 'done':      return { bg: '#D1FAE5', text: '#065F46', label: 'COMPLETED' };
      case 'overdue':   return { bg: '#FEF3C7', text: '#92400E', label: 'OVERDUE' };
      case 'cancelled': return { bg: '#F3F4F6', text: '#6B7280', label: 'CANCELLED' };
      default:          return { bg: '#E5E7EB', text: '#374151', label: 'SCHEDULED' };
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* Premium Header Row */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={15}>
          <BackIcon />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Care Plan & Routines</Text>
          <Text style={styles.headerSub}>For {patientName}</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Segmented Control / Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === 'daily_flow' && styles.tabButtonActive]}
          onPress={() => setActiveTab('daily_flow')}
        >
          <Text style={[styles.tabLabel, activeTab === 'daily_flow' && styles.tabLabelActive]}>
            Today's Flow
          </Text>
          {activeTab === 'daily_flow' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'care_plan' && styles.tabButtonActive]}
          onPress={() => setActiveTab('care_plan')}
        >
          <Text style={[styles.tabLabel, activeTab === 'care_plan' && styles.tabLabelActive]}>
            Care Plan Templates
          </Text>
          {activeTab === 'care_plan' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading care plan details...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'daily_flow' ? (
            /* --- TODAY'S DAILY FLOW TAB --- */
            <>
              {tasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>📋</Text>
                  <Text style={styles.emptyTitle}>No Tasks for Today</Text>
                  <Text style={styles.emptyDesc}>
                    There are no tasks scheduled for today. Tasks will generate automatically from recurring routine templates.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Status Bar */}
                  <View style={styles.statusBar}>
                    <Text style={styles.statusPercent}>
                      {tasks.filter(t => t.status?.toLowerCase() === 'done').length} of {tasks.length} tasks completed
                    </Text>
                    <View style={styles.progressBackground}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${(tasks.filter(t => t.status?.toLowerCase() === 'done').length / tasks.length) * 100}%`
                          }
                        ]}
                      />
                    </View>
                  </View>

                  {/* Tasks Timeline */}
                  {tasks
                    .slice()
                    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                    .map((task) => {
                      const stat = getStatusBadge(task.status);
                      const isExpanded = expandedTaskIds.has(task.id);

                      return (
                        <View key={task.id} style={styles.card}>
                          {/* Top Row: Time, Category Badge, Status Badge */}
                          <View style={styles.cardHeader}>
                            <View style={styles.headerLeft}>
                              <Text style={styles.timeLabel}>⏰ {task.time}</Text>
                              <View style={[styles.badge, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]}>
                                <Text style={[styles.badgeText, { color: '#1E40AF' }]}>
                                  {task.category?.toUpperCase() || 'ROUTINE'}
                                </Text>
                              </View>
                            </View>
                            <View style={[styles.badge, { backgroundColor: stat.bg, paddingHorizontal: 8 }]}>
                              <Text style={[styles.badgeText, { color: stat.text, fontWeight: '800' }]}>
                                {stat.label}
                              </Text>
                            </View>
                          </View>

                          {/* Title & Description */}
                          <Pressable onPress={() => toggleTaskExpanded(task.id)} style={styles.titleSection}>
                            <View style={styles.categoryCircle}>
                              <Text style={styles.categoryEmoji}>{task.icon || task.iconName || '📋'}</Text>
                            </View>
                            <View style={styles.titleTextWrap}>
                              <Text style={styles.cardTitle}>{task.title}</Text>
                              <Text numberOfLines={isExpanded ? undefined : 1} style={styles.cardDesc}>
                                {task.instructionsMd || 'No additional instructions.'}
                              </Text>
                            </View>
                            <View style={styles.chevron}>
                              {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            </View>
                          </Pressable>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <View style={styles.expandedContent}>
                              {task.instructionsMd ? (
                                <View style={styles.sectionBlock}>
                                  <Text style={styles.sectionLabel}>Patient Instructions</Text>
                                  <Text style={styles.markdownBody}>{task.instructionsMd}</Text>
                                </View>
                              ) : null}

                            </View>
                          )}

                          {/* Action Hub Footer — sign-off is the only V1 mutation */}
                          <View style={styles.cardActions}>
                            {task.status !== 'done' && task.status !== 'cancelled' && (
                              <Pressable
                                style={styles.actionBtnSuccess}
                                onPress={() => handleSignOff(task.id)}
                              >
                                <Text style={styles.actionBtnSuccessText}>Sign Off Complete</Text>
                              </Pressable>
                            )}
                          </View>
                        </View>
                      );
                    })}
                </>
              )}
            </>
          ) : (
            /* --- CARE PLAN ROUTINE TEMPLATES TAB --- */
            <>
              <View style={styles.templatesHeader}>
                <Text style={styles.templatesCount}>{templates.length} recurring routines configured</Text>
                {canManageDefinitions && (
                  <Pressable
                    style={styles.createBtn}
                    onPress={() =>
                      navigation.navigate('CaregiverRoutineEditorScreen', {
                        patientId,
                        patientName,
                        mode: 'create'
                      })
                    }
                  >
                    <Text style={styles.createBtnPlus}>＋</Text>
                    <Text style={styles.createBtnText}>New Template</Text>
                  </Pressable>
                )}
              </View>

              {templates.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>📅</Text>
                  <Text style={styles.emptyTitle}>Empty Care Plan</Text>
                  <Text style={styles.emptyDesc}>
                    {canManageDefinitions
                      ? 'Setup recurring routine templates (e.g. daily medicine, weekly physical therapy) to automatically generate task flows for the patient.'
                      : 'No care plan has been configured yet. Routine definitions are managed by the patient or an authorized family member.'}
                  </Text>
                </View>
              ) : (
                templates.map((template) => {
                  const isExpanded = expandedTemplateIds.has(template.id);
                  const time = routineTime(template);

                  return (
                    <View key={template.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                          <View style={[styles.badge, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]}>
                            <Text style={[styles.badgeText, { color: '#1E40AF' }]}>
                              {template.category}
                            </Text>
                          </View>
                          <Text style={styles.categoryPill}>
                            {template.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Text>
                        </View>
                        {canManageDefinitions && (
                          <View style={styles.cardHeaderActions}>
                            <Pressable
                              style={styles.headerActionCircle}
                              onPress={() =>
                                navigation.navigate('CaregiverRoutineEditorScreen', {
                                  patientId,
                                  patientName,
                                  mode: 'edit',
                                  routine: template
                                })
                              }
                              hitSlop={8}
                            >
                              <EditIcon />
                            </Pressable>
                            <Pressable
                              style={[styles.headerActionCircle, styles.deleteHeaderBtn]}
                              onPress={() => handleDeactivateTemplate(template.id, template.title)}
                              hitSlop={8}
                            >
                              <DeleteIcon />
                            </Pressable>
                          </View>
                        )}
                      </View>

                      {/* Main Clickable Title */}
                      <Pressable onPress={() => toggleTemplateExpanded(template.id)} style={styles.titleSection}>
                        <View style={styles.categoryCircle}>
                          <Text style={styles.categoryEmoji}>📅</Text>
                        </View>
                        <View style={styles.titleTextWrap}>
                          <Text style={styles.cardTitle}>{template.title}</Text>
                          <Text style={styles.scheduleText}>
                            🔁 {formatRecurrence(template)}
                          </Text>
                        </View>
                        <View style={styles.chevron}>
                          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        </View>
                      </Pressable>

                      {/* Scheduled Time Quick Info */}
                      <View style={styles.timesStrip}>
                        <Text style={styles.timesLabelText}>⏰ Scheduled Time:</Text>
                        <View style={styles.timesListRow}>
                          <View style={styles.timeTag}>
                            <Text style={styles.timeTagText}>{time}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <View style={styles.expandedContent}>
                          {template.description ? (
                            <View style={styles.sectionBlock}>
                              <Text style={styles.sectionLabel}>Instructions</Text>
                              <Text style={styles.markdownBody}>{template.description}</Text>
                            </View>
                          ) : null}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F4F7F6', paddingHorizontal: 0, paddingVertical: 0 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: F.semiBold, fontSize: 14, color: C.textSecondary },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 60 },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { padding: 4 },
  headerTitleWrap: { alignItems: 'center', flex: 1 },
  headerTitle: { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  headerSub: { fontFamily: F.bold, fontSize: 12, color: C.primary, marginTop: 1 },
  headerRightPlaceholder: { width: 32 },

  // Tabs Style
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative'
  },
  tabButtonActive: {},
  tabLabel: { fontFamily: F.bold, fontSize: 14, color: C.textMuted },
  tabLabelActive: { color: C.primary },
  tabIndicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 3, backgroundColor: C.primary, borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  // Timeline / Status Bar
  statusBar: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  statusPercent: { fontFamily: F.bold, fontSize: 13, color: C.textSecondary, marginBottom: 8 },
  progressBackground: { height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },

  // Templates Toolbar
  templatesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 },
  templatesCount: { fontFamily: F.bold, fontSize: 13, color: C.textSecondary },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  createBtnPlus: { fontFamily: F.bold, fontSize: 16, color: C.primaryText },
  createBtnText: { fontFamily: F.bold, fontSize: 12, color: C.primaryText },

  // Routine Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  unsureBorder: { borderColor: '#A855F7', borderWidth: 1.5, backgroundColor: '#FAF5FF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeLabel: { fontFamily: F.bold, fontSize: 13, color: '#0F766E' },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: F.bold, fontSize: 9 },
  categoryPill: { fontFamily: F.bold, fontSize: 9, color: C.textSecondary, backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, textTransform: 'uppercase' },
  cardHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerActionCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  deleteHeaderBtn: { backgroundColor: '#FEE2E2' },

  unsureBanner: { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF', borderWidth: 1, borderRadius: 10, padding: 8, marginBottom: 10 },
  unsureBannerText: { fontFamily: F.semiBold, fontSize: 11, color: '#6B21A8', lineHeight: 14 },

  titleSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  categoryCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  categoryEmoji: { fontSize: 20 },
  titleTextWrap: { flex: 1 },
  cardTitle: { fontFamily: F.extraBold, fontSize: 16, color: C.textPrimary },
  cardDesc: { fontFamily: F.regular, fontSize: 12, color: C.textSecondary, marginTop: 2, lineHeight: 16 },
  scheduleText: { fontFamily: F.bold, fontSize: 12, color: C.primary, marginTop: 2 },
  chevron: { marginLeft: 8 },

  timesStrip: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  timesLabelText: { fontFamily: F.bold, fontSize: 11, color: C.textSecondary, marginRight: 6 },
  timesListRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  timeTag: { backgroundColor: '#E0F2FE', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  timeTagText: { fontFamily: F.bold, fontSize: 10, color: '#0369A1' },
  noTimesText: { fontFamily: F.regular, fontSize: 11, color: C.textMuted },

  // Expanded Content
  expandedContent: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10, gap: 10 },
  sectionBlock: { gap: 4 },
  sectionLabel: { fontFamily: F.bold, fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  markdownBody: { fontFamily: F.regular, fontSize: 13, color: C.textPrimary, lineHeight: 18 },
  caregiverNoteBlock: { backgroundColor: '#F0FDFA', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#CCFBF1' },
  noteBody: { fontFamily: F.medium, fontSize: 12, color: '#0F766E', lineHeight: 16 },
  audioPlayerPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E6F4EA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  audioText: { fontFamily: F.bold, fontSize: 12, color: C.primary },

  // Attachments List
  attachmentLink: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginTop: 4 },
  attachmentName: { fontFamily: F.medium, fontSize: 11, color: C.textSecondary, flex: 1 },
  attachmentType: { fontFamily: F.bold, fontSize: 9, color: C.textMuted, backgroundColor: '#E2E8F0', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  noAttachments: { fontFamily: F.regular, fontSize: 11, color: C.textMuted, fontStyle: 'italic' },

  // Timeline / Card Actions
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  actionBtnSuccess: { flex: 1, backgroundColor: '#059669', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionBtnSuccessText: { fontFamily: F.bold, color: '#FFFFFF', fontSize: 12 },
  actionBtnOutline: { flex: 1, borderWidth: 1, borderColor: '#059669', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionBtnOutlineText: { fontFamily: F.bold, color: '#059669', fontSize: 12 },
  actionBtnDanger: { paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DC2626', justifyContent: 'center', alignItems: 'center' },
  actionBtnDangerText: { fontFamily: F.bold, color: '#DC2626', fontSize: 12 },

  // Empty State Styles
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1.5, borderColor: C.borderMid, padding: 32, alignItems: 'center', marginTop: 12 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontFamily: F.bold, fontSize: 16, color: C.textPrimary, marginBottom: 6 },
  emptyDesc: { fontFamily: F.regular, fontSize: 12, color: C.textSecondary, textAlign: 'center', lineHeight: 18 },
});
