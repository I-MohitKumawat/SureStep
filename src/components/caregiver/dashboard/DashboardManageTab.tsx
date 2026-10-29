/**
 * SureStep — src/components/caregiver/dashboard/DashboardManageTab.tsx
 * Redesigned to act as the primary, unified screen for both Daily Flow and Care Plan Templates.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

// Enable layout animation for smooth card expansion on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Icons
const ClockIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke={C.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke={C.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

type Props = {
  patientName: string;
  patientId: string;
  tasks: any[];
  templates: any[];
  loading: boolean;
  onRefresh: () => void;
};

type TabType = 'daily_flow' | 'care_plan';

export const DashboardManageTab: React.FC<Props> = ({
  patientName,
  patientId,
  tasks,
  templates,
  loading,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('daily_flow');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<Set<string>>(new Set());

  const toggleTaskExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTemplateExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTemplateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getRecurrenceText = (pattern: any) => {
    if (!pattern) return 'Daily';
    if (pattern.type === 'DAILY') return 'Daily';
    if (pattern.type === 'WEEKLY' && pattern.days) {
      const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `Weekly on ${pattern.days.map((d: number) => daysMap[d]).join(', ')}`;
    }
    return 'Daily';
  };

  const renderSteps = (instructionsMd: string | null) => {
    if (!instructionsMd) {
      return <Text style={styles.noStepsText}>No visual steps configured for this routine.</Text>;
    }
    let steps: Array<{ text: string; photo_url?: string }> = [];
    try {
      if (instructionsMd.trim().startsWith('[')) {
        steps = JSON.parse(instructionsMd);
      } else {
        steps = [{ text: instructionsMd }];
      }
    } catch {
      steps = [{ text: instructionsMd }];
    }

    if (steps.length === 0 || (steps.length === 1 && !steps[0].text && !steps[0].photo_url)) {
      return <Text style={styles.noStepsText}>No visual steps configured for this routine.</Text>;
    }

    return (
      <View style={styles.stepsContainer}>
        {steps.map((step, idx) => (
          <View key={idx} style={styles.stepRow}>
            <View style={styles.stepNumberCircle}>
              <Text style={styles.stepNumberText}>{idx + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              {!!step.text && <Text style={styles.stepText}>{step.text}</Text>}
              {!!step.photo_url && (
                <Image
                  source={{ uri: step.photo_url }}
                  style={styles.stepPhoto}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Sort daily tasks chronologically by scheduled time.
  // Tasks from TaskContext expose `time` (formatted 12h) and optionally `scheduled_time`.
  const sortedTasks = tasks
    .slice()
    .sort((a, b) => (a.scheduled_time || a.time || '').localeCompare(b.scheduled_time || b.time || ''));

  // Compute adherence counts
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const adherenceRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Segmented Control Header */}
      <View style={styles.tabHeaderRow}>
        <View style={styles.segmentedControl}>
          <Pressable
            style={[styles.segmentBtn, activeTab === 'daily_flow' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('daily_flow')}
          >
            <Text style={[styles.segmentText, activeTab === 'daily_flow' && styles.segmentTextActive]}>
              Today's Flow
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, activeTab === 'care_plan' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('care_plan')}
          >
            <Text style={[styles.segmentText, activeTab === 'care_plan' && styles.segmentTextActive]}>
              Care Plan
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Syncing routines...</Text>
        </View>
      ) : activeTab === 'daily_flow' ? (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Adherence Card */}
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryTitle}>Daily Progress</Text>
              <Text style={styles.summarySub}>
                {completedCount} of {totalTasks} routines completed
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{adherenceRate}%</Text>
            </View>
          </View>

          {sortedTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🌸</Text>
              <Text style={styles.emptyText}>No routines today</Text>
              <Text style={styles.emptyDesc}>
                Add a care plan template above to start scheduling routines for {patientName}.
              </Text>
            </View>
          ) : (
            sortedTasks.map(task => {
              const isExpanded = expandedTaskIds.has(task.id);
              const isDone = task.status === 'done';
              const isUnsure = task.status === 'unsure';
              const isMissed = task.status === 'missed';
              const isOverdue = task.status === 'overdue';

              return (
                <View key={task.id} style={[styles.card, isDone && styles.cardDone]}>
                  {/* Card Header Row */}
                  <Pressable
                    style={styles.cardHeader}
                    onPress={() => toggleTaskExpand(task.id)}
                  >
                    <View style={styles.emojiCircle}>
                      <Text style={styles.emojiText}>{task.icon ?? '📋'}</Text>
                    </View>

                    <View style={styles.cardTitleBlock}>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{task.time || (task.scheduled_time ? task.scheduled_time.slice(0, 5) : '')}</Text>
                        {isDone && <View style={[styles.badge, styles.badgeDone]}><Text style={styles.badgeTextDone}>DONE</Text></View>}
                        {isUnsure && <View style={[styles.badge, styles.badgeUnsure]}><Text style={styles.badgeTextUnsure}>UNSURE</Text></View>}
                        {isMissed && <View style={[styles.badge, styles.badgeMissed]}><Text style={styles.badgeTextMissed}>MISSED</Text></View>}
                        {isOverdue && <View style={[styles.badge, styles.badgeOverdue]}><Text style={styles.badgeTextOverdue}>OVERDUE</Text></View>}
                      </View>
                      <Text style={[styles.taskTitle, isDone && styles.textCrossed]}>{task.title}</Text>
                    </View>

                    <View style={styles.expandChevron}>
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </View>
                  </Pressable>



                  {/* Expanded Custom Ordered Step Instructions */}
                  {isExpanded && (
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsHeader}>VISUAL INSTRUCTION STEPS</Text>
                      {renderSteps(task.instructions_md)}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {templates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No care plan templates</Text>
              <Text style={styles.emptyDesc}>
                Configure routines like medications, meals, or walks to build {patientName}'s daily plan.
              </Text>
            </View>
          ) : (
            templates.map(template => {
              const isExpanded = expandedTemplateIds.has(template.id);
              return (
                <View key={template.id} style={styles.card}>
                  {/* Template Card Header */}
                  <Pressable
                    style={styles.cardHeader}
                    onPress={() => toggleTemplateExpand(template.id)}
                  >
                    <View style={[styles.emojiCircle, { backgroundColor: '#F1F5F9' }]}>
                      <Text style={styles.emojiText}>{template.icon_name ?? '📋'}</Text>
                    </View>

                    <View style={styles.cardTitleBlock}>
                      <Text style={styles.templateTitle}>{template.title}</Text>
                      <View style={styles.templateMetaRow}>
                        <View style={styles.metaTag}>
                          <ClockIcon />
                          <Text style={styles.metaTagText}>
                            {template.execution_times?.map((et: any) => et.scheduled_time.slice(0, 5)).join(', ') || 'No times'}
                          </Text>
                        </View>
                        <View style={styles.metaTag}>
                          <CalendarIcon />
                          <Text style={styles.metaTagText}>
                            {getRecurrenceText(template.recurrence_pattern)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.expandChevron}>
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </View>
                  </Pressable>

                  {/* Expanded Custom Ordered Steps */}
                  {isExpanded && (
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsHeader}>CARE PLAN INSTRUCTIONS</Text>
                      {renderSteps(template.instructions_md)}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textMuted,
    marginTop: 12,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  segmentedControl: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textMuted,
  },
  segmentTextActive: {
    color: C.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: C.primary,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  addBtnPlus: {
    color: C.primaryText,
    fontFamily: F.bold,
    fontSize: 14,
    marginRight: 4,
  },
  addBtnText: {
    color: C.primaryText,
    fontFamily: F.bold,
    fontSize: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E6F4EA',
    borderWidth: 1.5,
    borderColor: '#A3E635',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontFamily: F.extraBold,
    fontSize: 16,
    color: '#14532D',
  },
  summarySub: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontFamily: F.extraBold,
    fontSize: 13,
    color: C.primaryText,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: F.extraBold,
    fontSize: 16,
    color: C.textPrimary,
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardDone: {
    borderColor: '#DCFCE7',
    backgroundColor: '#F9FBF9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 20,
  },
  cardTitleBlock: {
    flex: 1,
    marginLeft: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  timeText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textSecondary,
  },
  taskTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  textCrossed: {
    textDecorationLine: 'line-through',
    color: C.textMuted,
  },
  expandChevron: {
    padding: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeDone: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  badgeTextDone: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#166534',
  },
  badgeUnsure: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FDBA74',
  },
  badgeTextUnsure: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#9A3412',
  },
  badgeMissed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  badgeTextMissed: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#991B1B',
  },
  badgeOverdue: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  badgeTextOverdue: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#92400E',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  actionCheckbox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionCheckboxChecked: {
    backgroundColor: '#E6F4EA',
    borderColor: '#86EFAC',
  },
  checkboxText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textSecondary,
  },
  checkboxTextChecked: {
    color: C.primary,
  },
  actionUnsureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionUnsureActive: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FDBA74',
  },
  unsureText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textSecondary,
  },
  unsureTextActive: {
    color: '#EA580C',
  },
  instructionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  instructionsHeader: {
    fontFamily: F.extraBold,
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  noStepsText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    fontStyle: 'italic',
  },
  stepsContainer: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNumberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontFamily: F.extraBold,
    fontSize: 10,
    color: C.textSecondary,
  },
  stepContent: {
    flex: 1,
    gap: 8,
  },
  stepText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 18,
  },
  stepPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  templateTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  templateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTagText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.textMuted,
  },
  templateActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FCFCFC',
  },
  templateControlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
  },
  templateControlText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.primary,
  },
});
