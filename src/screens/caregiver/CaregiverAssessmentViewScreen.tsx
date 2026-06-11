import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { CaregiverStackParams } from '../../types/navigation.types';
import { getLatestAssessment, getAssessmentHistory, type AssessmentData } from '../../services/assessmentService';
import { getCarePlan, type CarePlanData } from '../../services/carePlanService';
import { relativeTime } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverAssessmentViewScreen'>;

export const CaregiverAssessmentViewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, patientName } = route.params;

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [carePlan, setCarePlan] = useState<CarePlanData | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [latestAss, plan, hist] = await Promise.all([
          getLatestAssessment(patientId),
          getCarePlan(patientId),
          getAssessmentHistory(patientId),
        ]);
        setAssessment(latestAss);
        setCarePlan(plan);
        setHistory(hist);
      } catch (err) {
        console.warn('Failed to load assessment data:', err);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [patientId]);

  if (loading) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading details...</Text>
      </ScreenContainer>
    );
  }

  const riskLevels = {
    fall: assessment?.risk?.fall_risk || 'Low',
    wandering: assessment?.risk?.wandering_risk || 'Low',
    adherence: assessment?.risk?.medication_adherence_risk || 'Low',
    emergency: assessment?.risk?.emergency_risk || 'Low',
  };

  const getRiskStyle = (level: 'Low' | 'Medium' | 'High') => {
    switch (level) {
      case 'High':
        return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' };
      case 'Medium':
        return { bg: '#FFEDD5', border: '#FDBA74', text: '#C2410C' };
      default:
        return { bg: '#E6F4EA', border: '#A3E635', text: '#065F46' };
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={15}>
          <Feather name="arrow-left" size={24} color={C.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Care Plan & Assessment</Text>
          <Text style={styles.headerSub}>{patientName}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Risk Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Risk Assessment Profile</Text>
          <View style={styles.riskGrid}>
            {([
              { key: 'fall', label: 'Fall Risk', value: riskLevels.fall, icon: 'shield' as const },
              { key: 'wandering', label: 'Wandering Risk', value: riskLevels.wandering, icon: 'compass' as const },
              { key: 'adherence', label: 'Medication Risk', value: riskLevels.adherence, icon: 'activity' as const },
              { key: 'emergency', label: 'Emergency Risk', value: riskLevels.emergency, icon: 'heart' as const },
            ]).map(item => {
              const rStyle = getRiskStyle(item.value);
              return (
                <View key={item.key} style={[styles.riskItem, { backgroundColor: rStyle.bg, borderColor: rStyle.border }]}>
                  <View style={styles.riskHeaderRow}>
                    <Feather name={item.icon} size={15} color={rStyle.text} />
                    <Text style={[styles.riskLabel, { color: rStyle.text }]}>{item.label}</Text>
                  </View>
                  <Text style={[styles.riskVal, { color: rStyle.text }]}>{item.value}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Goals & Monitoring Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Care Goals</Text>
          <Text style={styles.cardText}>
            {carePlan?.care_goals || assessment?.notes?.meeting_summary || 'No care goals set yet.'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.cardSectionLabel}>Monitoring Requirements</Text>
          <View style={styles.needsList}>
            {assessment?.support_needs &&
              Object.entries(assessment.support_needs)
                .filter(([_, val]) => !!val)
                .map(([key]) => (
                  <View key={key} style={styles.needRow}>
                    <Feather name="check-circle" size={14} color={C.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.needText}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Text>
                  </View>
                ))}
            {(!assessment?.support_needs || Object.values(assessment.support_needs).every(v => !v)) && (
              <Text style={styles.emptySubText}>No active support requirements listed.</Text>
            )}
          </View>
        </View>

        {/* Cognitive & Mobility Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Cognitive Status</Text>
          <View style={styles.metaInfoRow}>
            <Text style={styles.metaLabel}>Memory concerns</Text>
            <Text style={styles.metaVal}>{assessment?.cognitive?.memory_concerns || 'None'}</Text>
          </View>
          <View style={styles.metaInfoRow}>
            <Text style={styles.metaLabel}>Orientation concerns</Text>
            <Text style={styles.metaVal}>{assessment?.cognitive?.orientation_concerns || 'Oriented'}</Text>
          </View>
          <View style={styles.metaInfoRow}>
            <Text style={styles.metaLabel}>Confusion frequency</Text>
            <Text style={styles.metaVal}>{assessment?.cognitive?.confusion_frequency || 'Never'}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardSectionLabel}>Mobility & Tech Comfort</Text>
          <View style={styles.metaInfoRow}>
            <Text style={styles.metaLabel}>Mobility support</Text>
            <Text style={styles.metaVal}>{assessment?.mobility || 'Independent'}</Text>
          </View>
          <View style={styles.metaInfoRow}>
            <Text style={styles.metaLabel}>Tech familiarity</Text>
            <Text style={styles.metaVal}>{assessment?.tech_comfort || 'Independent smartphone use'}</Text>
          </View>
        </View>

        {/* Recommendations Card */}
        {(assessment?.notes?.observations || assessment?.notes?.recommendations) && (
          <View style={styles.card}>
            {assessment.notes.observations && (
              <>
                <Text style={styles.cardSectionLabel}>Caregiver Observations</Text>
                <Text style={styles.cardText}>{assessment.notes.observations}</Text>
              </>
            )}
            {assessment.notes.observations && assessment.notes.recommendations && <View style={styles.divider} />}
            {assessment.notes.recommendations && (
              <>
                <Text style={styles.cardSectionLabel}>Recommendations</Text>
                <Text style={styles.cardText}>{assessment.notes.recommendations}</Text>
              </>
            )}
          </View>
        )}

        {/* Assessment History Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Assessment History</Text>
          {history.length === 0 ? (
            <Text style={styles.emptySubText}>No history logs found.</Text>
          ) : (
            history.map((h, i) => (
              <View key={h.id}>
                {i > 0 && <View style={styles.historyDivider} />}
                <View style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>Assessment completed</Text>
                    <Text style={styles.historyMeta}>
                      {h.created_at ? new Date(h.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </Text>
                  </View>
                  <View style={[styles.historyStatusBadge, { backgroundColor: h.status === 'COMPLETED' ? '#E6F4EA' : '#F1F5F9' }]}>
                    <Text style={[styles.historyStatusText, { color: h.status === 'COMPLETED' ? '#065F46' : '#475569' }]}>
                      {h.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Update Button CTA */}
        <Pressable
          style={({ pressed }) => [styles.updateBtn, pressed && { opacity: 0.88 }]}
          onPress={() => navigation.navigate('CaregiverAssessmentScreen', { patientId, patientName })}
        >
          <Feather name="edit" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.updateBtnText}>Update Assessment Wizard</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F4F7F6', flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7F6' },
  loadingText: { fontFamily: F.medium, color: C.textSecondary, marginTop: 12, fontSize: 15 },
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
  headerTitle: { fontFamily: F.extraBold, fontSize: 17, color: C.textPrimary },
  headerSub: { fontFamily: F.bold, fontSize: 12, color: C.primary, marginTop: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  cardSectionLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  cardText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textPrimary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  riskItem: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  riskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  riskLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    marginLeft: 6,
  },
  riskVal: {
    fontFamily: F.extraBold,
    fontSize: 18,
  },
  needsList: {
    gap: 6,
  },
  needRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  needText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textPrimary,
  },
  emptySubText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textMuted,
    fontStyle: 'italic',
  },
  metaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
  },
  metaVal: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textPrimary,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textPrimary,
  },
  historyMeta: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyStatusText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  updateBtn: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: C.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    marginTop: 10,
  },
  updateBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
