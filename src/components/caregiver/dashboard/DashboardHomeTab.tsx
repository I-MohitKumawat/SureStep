/**
 * SureStep — src/components/caregiver/dashboard/DashboardHomeTab.tsx
 * Extracted from CaregiverDashboardScreen.tsx lines 477–753 (Home tab content).
 * Owns: patient header, routine capsule list, geofence status card.
 */
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Animated, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { styles, alertStyles, rSumStyles } from "./dashboardStyles";
import { C } from "../../../theme/colors";
import { F } from "../../../theme/fonts";
import { DashboardActionSection } from "./DashboardActionSection";
import type { Task, TaskCategory } from "../../../context/TaskContext";
import { IconHome } from "../../../assets/icons/NavIcons";
import { RoutineCapsule } from "../../shared/RoutineCapsule";
import type { ApiPatientState } from "../../../services/geofenceService";
import {
  checkBreach, haversineMeters,
  type Coords, type GeofenceZone,
} from "../../../utils/geofenceUtils";
import { relativeTime } from "../../../utils/dateUtils";

type Props = {
  patientName: string;
  patientPhone: string;
  batteryLevel: number;
  batteryColor: string;
  patientCoords: Coords | null;
  coordsTs: number;
  zones: GeofenceZone[];
  unackedAlerts: number;
  hasRealLocation: boolean;
  hasRealZones: boolean;
  patientTasks: Task[];
  activeRoutineIndex: number;
  routineItems: Array<{ key: string; category: TaskCategory; iconName?: string; emoji?: string; title: string; meta: string; done: boolean; status: string }>;
  routineCallouts: Array<{ id: string; emoji: string; title: string; message: string; severity: string }>;
  dismissedCallouts: Set<string>;
  reminderSentKeys: Set<string>;
  capsuleScrollY: Animated.Value;
  showRoutineSummary: boolean;
  onShowPatientProfile: () => void;
  onShowRoutineSummary: () => void;
  onDismissCallout: (id: string) => void;
  onSendReminder: (key: string) => void;
  onNavigateManage: () => void;
  onNavigateGeofenceMap: () => void;
  onNavigateGeofenceEditor: () => void;
  patientAge?: number | null;
  patientPhoto?: string | null;
  patientState?: ApiPatientState | null;
  onRefreshLocation?: () => Promise<void>;
  relationshipStatus?: string | null;
  carePlan?: any | null;
  onNavigateAssessment?: () => void;
  onNavigateAssessmentView?: () => void;
  onCompleteMeeting?: () => Promise<void>;
  onNavigateCareCircle?: () => void;
  familyCount?: number;
  assignedCaregiver?: string;
};

const CAPSULE_HEIGHT = 84;
const CAPSULE_GAP = 12;
const CAPSULE_STEP = CAPSULE_HEIGHT + CAPSULE_GAP;



export const DashboardHomeTab: React.FC<Props> = ({
  patientName, patientPhone, batteryLevel, batteryColor,
  patientCoords, coordsTs, zones, unackedAlerts, hasRealLocation, hasRealZones,
  patientTasks, activeRoutineIndex, routineItems, routineCallouts, dismissedCallouts,
  reminderSentKeys, capsuleScrollY, showRoutineSummary,
  onShowPatientProfile, onShowRoutineSummary, onDismissCallout, onSendReminder,
  onNavigateManage, onNavigateGeofenceMap, onNavigateGeofenceEditor,
  patientAge, patientPhoto,
  patientState, onRefreshLocation,
  relationshipStatus, carePlan, onNavigateAssessment, onNavigateAssessmentView, onCompleteMeeting, onNavigateCareCircle,
  familyCount = 0, assignedCaregiver = '—',
}) => {
  const [activeFilter, setActiveFilter] = useState<'missed' | 'pending' | 'completed' | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefreshLocation) return;
    setRefreshing(true);
    try {
      await onRefreshLocation();
    } finally {
      setRefreshing(false);
    }
  };

  const computedActiveZone = useMemo(() => {
    if (!patientCoords || !zones.length) return null;
    const insideZones = zones.filter((z) => {
      if (!z.isActive) return false;
      const d = haversineMeters(z.center.latitude, z.center.longitude, patientCoords.latitude, patientCoords.longitude);
      return d <= z.radiusM;
    });
    if (!insideZones.length) return null;
    insideZones.sort((a, b) => a.radiusM - b.radiusM);
    return insideZones[0];
  }, [patientCoords, zones]);

  const activeZoneLabel = patientState?.current_zone_name || computedActiveZone?.label || 'Home';

  const safetyText = patientState?.sos_active || patientState?.safety_state === 'CRITICAL'
    ? 'EMERGENCY: SOS Active'
    : patientState?.safety_state === 'BREACH'
    ? 'Outside safe zone'
    : patientState?.safety_state === 'APPROACHING'
    ? 'Approaching boundary'
    : patientState?.safety_state === 'SAFE'
    ? `Safe inside ${activeZoneLabel}`
    : patientCoords && zones.length > 0
    ? (() => {
        const breach = checkBreach(patientCoords, zones);
        if (breach.status === 'breach') return 'Outside safe zone';
        if (breach.status === 'approaching') return 'Approaching boundary';
        if (breach.status === 'safe') return `Safe at ${breach.zone?.label || 'Home'}`;
        return 'Safe inside Home';
      })()
    : 'Safe inside Home';

  const filteredRoutineItems = useMemo(() => {
    if (!activeFilter) return routineItems;
    return routineItems.filter(item => {
      if (activeFilter === 'completed') return item.status === 'completed';
      if (activeFilter === 'missed') return item.status === 'missed';
      if (activeFilter === 'pending') return item.status === 'upcoming' || item.status === 'active';
      return true;
    });
  }, [routineItems, activeFilter]);


  const lastActivityLabel = useMemo(() => {
    const times = patientTasks.filter(t => t.completedAt).map(t => new Date(t.completedAt!).getTime());
    if (!times.length) return "No activity yet";
    const diff = Math.round((Date.now() - Math.max(...times)) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} MINS AGO`;
    return `${Math.floor(diff / 60)} HR AGO`;
  }, [patientTasks]);

  const getCapsuleColors = (idx: number, done: boolean, status?: string) => {
    // Overdue: amber warning — task window has passed but not yet fully missed
    if (status === 'overdue') return {
      backgroundColor: '#78350F', borderColor: '#78350F',
      titleColor: '#fff', metaColor: '#FDE68A', statusColor: '#FDE68A',
    };
    if (idx < activeRoutineIndex) return done
      ? { backgroundColor: "#065F46", borderColor: "#065F46", titleColor: "#fff", metaColor: "#fff", statusColor: "#fff" }
      : { backgroundColor: "#DC2626", borderColor: "#DC2626", titleColor: "#fff", metaColor: "#fff", statusColor: "#fff" };
    if (idx === activeRoutineIndex) return { backgroundColor: "#0E7A67", borderColor: "#0E7A67", titleColor: "#fff", metaColor: "#fff", statusColor: "#fff" };
    return { backgroundColor: "#D6DDDD", borderColor: "#D6DDDD", titleColor: "#111827", metaColor: "#6B7280", statusColor: "#6B7280" };
  };

  return (
    <>
      {/* ── Patient Header ───────────────────────────────────────── */}
      <View style={styles.newHeaderCard}>
        <View style={styles.newHeaderLeft}>
          <Pressable onPress={onShowPatientProfile} style={({ pressed }) => [styles.newAvatarTouch, pressed && { opacity: 0.75 }]}>
            {patientPhoto ? (
              <Image source={{ uri: patientPhoto }} style={styles.newAvatarImage} />
            ) : (
              <View style={styles.newAvatarPlaceholder}>
                <Text style={styles.newAvatarText}>{patientName[0]?.toUpperCase() ?? "S"}</Text>
              </View>
            )}
          </Pressable>
          <View style={styles.newHeaderInfo}>
            <Text style={styles.newHeaderName} numberOfLines={1}>{patientName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text style={styles.newHeaderAge}>
                {patientAge ? `Age ${patientAge}` : "Age 78"}
              </Text>
              <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.textMuted, marginHorizontal: 6 }}>·</Text>
              <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.textSecondary }}>
                Active
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Feather name="users" size={12} color={C.textMuted} style={{ marginRight: 5 }} />
              <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.textSecondary }} numberOfLines={1}>
                Circle: {assignedCaregiver} · {familyCount} family
              </Text>
            </View>
          </View>
        </View>
        <Pressable 
          style={({ pressed }) => [{ backgroundColor: '#F1F5F9', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }, pressed && { opacity: 0.75 }]}
          onPress={onNavigateCareCircle}
        >
          <Feather name="user-plus" size={16} color={C.textPrimary} />
        </Pressable>
      </View>

      {/* ── Current Status Gradient Card ─────────────────────────── */}
      <Pressable onPress={onNavigateGeofenceMap} style={({ pressed }) => [styles.newStatusCardPress, pressed && { opacity: 0.95 }]}>
        <LinearGradient
          colors={
            patientState?.sos_active || ['CRITICAL', 'BREACH'].includes(patientState?.safety_state ?? '')
              ? ['#DC2626', '#B91C1C']
              : patientState?.safety_state === 'APPROACHING'
              ? ['#F59E0B', '#D97706']
              : ['#1E73E6', '#0F59C8']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.newStatusCard}
        >
          <View style={styles.statusCardTop}>
            <View style={styles.statusHomeIconCircle}>
              {patientState?.sos_active || ['CRITICAL', 'BREACH'].includes(patientState?.safety_state ?? '') ? (
                <Feather name="alert-triangle" size={22} color="#FFFFFF" />
              ) : patientState?.safety_state === 'APPROACHING' ? (
                <Feather name="alert-circle" size={22} color="#FFFFFF" />
              ) : (
                <IconHome size={22} color="#FFFFFF" strokeWidth={2} />
              )}
            </View>

            {onRefreshLocation && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation(); // prevent navigation
                  void handleRefresh();
                }}
                disabled={refreshing}
                style={({ pressed }) => [
                  {
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  pressed && { opacity: 0.72 },
                  refreshing && { opacity: 0.5 },
                ]}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="refresh-cw" size={18} color="#FFFFFF" />
                )}
              </Pressable>
            )}
          </View>

          <View style={styles.statusCardMiddle}>
            <Text style={styles.statusCardSub}>Current Status</Text>
            <Text style={styles.statusCardMain} numberOfLines={1}>
              {safetyText}
            </Text>
          </View>

          {/* Integrated Telemetry Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.25)', paddingTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="clock" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={{ fontFamily: F.medium, fontSize: 12, color: '#FFFFFF' }}>
                {(() => {
                  if (!coordsTs) return "2 min ago";
                  const diff = Math.round((Date.now() - coordsTs) / 60000);
                  if (diff < 1) return "just now";
                  if (diff < 60) return `${diff} min ago`;
                  const diffHr = Math.floor(diff / 60);
                  if (diffHr < 24) return `${diffHr} hr ago`;
                  return `${Math.floor(diffHr / 24)} d ago`;
                })()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="battery-charging" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={{ fontFamily: F.medium, fontSize: 12, color: '#FFFFFF' }}>
                {patientState?.battery_pct != null ? `${patientState.battery_pct}%` : `${batteryLevel}%`}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name={patientState?.network_status === 'Offline' ? 'cellular-outline' : 'cellular'} 
                 size={14} 
                 color="#FFFFFF" 
                 style={{ marginRight: 5 }} 
              />
              <Text style={{ fontFamily: F.medium, fontSize: 12, color: '#FFFFFF' }}>
                {patientState?.network_status || 'Offline'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      {/* ── Onboarding / Care Plan Card ───────────────────────────── */}
      {relationshipStatus && (
        <View style={localStyles.carePlanCard}>
          {relationshipStatus === 'ACCEPTED' && (
            <View style={localStyles.cardInner}>
              <View style={localStyles.badgeRow}>
                <View style={[localStyles.badge, { backgroundColor: '#DBEAFE', flexDirection: 'row', alignItems: 'center' }]}>
                  <Feather name="users" size={12} color="#1E40AF" style={{ marginRight: 6 }} />
                  <Text style={[localStyles.badgeText, { color: '#1E40AF' }]}>MEETING PENDING</Text>
                </View>
              </View>
              <Text style={localStyles.cardTitle}>Meet {patientName} In Person</Text>
              <Text style={localStyles.cardDesc}>
                Before completing the patient safety assessment, meet in person to establish familiarity and verify basic setup.
              </Text>
              <Pressable 
                style={({ pressed }) => [localStyles.primaryBtn, pressed && { opacity: 0.85 }]}
                onPress={onCompleteMeeting}
              >
                <Text style={localStyles.primaryBtnText}>Mark Meeting Completed</Text>
              </Pressable>
            </View>
          )}

          {(relationshipStatus === 'MEETING_COMPLETED' || relationshipStatus === 'ASSESSMENT_PENDING') && (
            <View style={localStyles.cardInner}>
              <View style={localStyles.badgeRow}>
                <View style={[localStyles.badge, { backgroundColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center' }]}>
                  <Feather name="clipboard" size={12} color="#991B1B" style={{ marginRight: 6 }} />
                  <Text style={[localStyles.badgeText, { color: '#991B1B' }]}>ASSESSMENT REQUIRED</Text>
                </View>
              </View>
              <Text style={localStyles.cardTitle}>Structured Patient Assessment</Text>
              <Text style={localStyles.cardDesc}>
                Complete the cognitive, safety, and mobility baseline assessment to configure geofences and routines.
              </Text>
              <Pressable 
                style={({ pressed }) => [localStyles.primaryBtn, pressed && { opacity: 0.85 }]}
                onPress={onNavigateAssessment}
              >
                <Text style={localStyles.primaryBtnText}>Start Assessment Wizard</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [localStyles.secondaryBtn, pressed && { opacity: 0.85 }]}
                onPress={onNavigateCareCircle}
              >
                <Text style={localStyles.secondaryBtnText}>Manage Care Circle & Invites</Text>
              </Pressable>
            </View>
          )}

          {relationshipStatus === 'ACTIVE_CARE' && carePlan && (
            <View style={localStyles.cardInner}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="check-circle" size={16} color="#065F46" style={{ marginRight: 6 }} />
                  <Text style={{ fontFamily: F.bold, fontSize: 13, color: '#065F46' }}>Assessment Complete</Text>
                </View>
                <Text style={{ fontFamily: F.bold, fontSize: 11, color: C.textMuted }}>
                  {carePlan.updated_at ? relativeTime(carePlan.updated_at) : 'Active'}
                </Text>
              </View>
              <Text style={localStyles.cardTitle}>Care Plan & Goals</Text>
              <Text style={localStyles.careGoalsText} numberOfLines={2}>
                {carePlan.care_goals || 'No specific goals set.'}
              </Text>

              <View style={localStyles.riskRow}>
                {carePlan.risk_profile?.fall_risk && (
                  <View style={[localStyles.riskBadge, carePlan.risk_profile.fall_risk === 'High' ? localStyles.riskHigh : carePlan.risk_profile.fall_risk === 'Medium' ? localStyles.riskMedium : localStyles.riskLow]}>
                    <Text style={[localStyles.riskBadgeText, carePlan.risk_profile.fall_risk === 'High' ? localStyles.riskHighText : carePlan.risk_profile.fall_risk === 'Medium' ? localStyles.riskMediumText : localStyles.riskLowText]}>Fall: {carePlan.risk_profile.fall_risk}</Text>
                  </View>
                )}
                {carePlan.risk_profile?.wandering_risk && (
                  <View style={[localStyles.riskBadge, carePlan.risk_profile.wandering_risk === 'High' ? localStyles.riskHigh : carePlan.risk_profile.wandering_risk === 'Medium' ? localStyles.riskMedium : localStyles.riskLow]}>
                    <Text style={[localStyles.riskBadgeText, carePlan.risk_profile.wandering_risk === 'High' ? localStyles.riskHighText : carePlan.risk_profile.wandering_risk === 'Medium' ? localStyles.riskMediumText : localStyles.riskLowText]}>Wandering: {carePlan.risk_profile.wandering_risk}</Text>
                  </View>
                )}
                {carePlan.risk_profile?.medication_adherence_risk && (
                  <View style={[localStyles.riskBadge, carePlan.risk_profile.medication_adherence_risk === 'High' ? localStyles.riskHigh : carePlan.risk_profile.medication_adherence_risk === 'Medium' ? localStyles.riskMedium : localStyles.riskLow]}>
                    <Text style={[localStyles.riskBadgeText, carePlan.risk_profile.medication_adherence_risk === 'High' ? localStyles.riskHighText : carePlan.risk_profile.medication_adherence_risk === 'Medium' ? localStyles.riskMediumText : localStyles.riskLowText]}>Med: {carePlan.risk_profile.medication_adherence_risk}</Text>
                  </View>
                )}
              </View>

              <Pressable 
                style={({ pressed }) => [localStyles.primaryBtn, pressed && { opacity: 0.85 }, { marginTop: 4 }]}
                onPress={onNavigateAssessmentView}
              >
                <Text style={localStyles.primaryBtnText}>View Detailed Care Plan</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* ── Daily Routine ─────────────────────────────────────────── */}
      {routineItems.length > 0 && (
        <>
          {/* Header Row */}
          <View style={styles.routineHeaderRow}>
            <Text style={styles.routineHeaderTitle}>Daily Routine</Text>
            <Pressable onPress={onShowRoutineSummary} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
              <Text style={styles.routineOverviewLink}>View Overview</Text>
            </Pressable>
          </View>

          {/* Filter Row */}
          <View style={styles.filterRow}>
            {[
              { key: 'missed', label: 'Missed', color: '#F97316', count: routineItems.filter(t => t.status === 'missed').length, activeStyle: styles.filterBtnActiveMissed, textActiveStyle: styles.filterTextActiveMissed, badgeActiveStyle: styles.filterCountBadgeActiveMissed, textBadgeActiveStyle: styles.filterCountTextActiveMissed },
              { key: 'pending', label: 'Pending', color: '#94A3B8', count: routineItems.filter(t => t.status === 'upcoming' || t.status === 'active').length, activeStyle: styles.filterBtnActivePending, textActiveStyle: styles.filterTextActivePending, badgeActiveStyle: styles.filterCountBadgeActivePending, textBadgeActiveStyle: styles.filterCountTextActivePending },
              { key: 'completed', label: 'Completed', color: '#22C55E', count: routineItems.filter(t => t.status === 'completed').length, activeStyle: styles.filterBtnActiveCompleted, textActiveStyle: styles.filterTextActiveCompleted, badgeActiveStyle: styles.filterCountBadgeActiveCompleted, textBadgeActiveStyle: styles.filterCountTextActiveCompleted },
            ].map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={[
                    styles.filterBtn,
                    isActive && f.activeStyle
                  ]}
                  onPress={() => setActiveFilter(activeFilter === f.key ? null : (f.key as any))}
                >
                  <View style={[styles.filterDot, { backgroundColor: f.color }]} />
                  <Text style={[styles.filterText, isActive && f.textActiveStyle]}>
                    {f.label}
                  </Text>
                  <View style={[styles.filterCountBadge, isActive && f.badgeActiveStyle]}>
                    <Text style={[styles.filterCountText, isActive && f.textBadgeActiveStyle]}>
                      {f.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

        </>
      )}

      {routineItems.length === 0 ? (
        <View style={styles.routineOuterContainer}>
          <Pressable style={{ alignItems: "center", paddingVertical: 28 }} onPress={onNavigateManage}>
            <Feather name="clipboard" size={36} color="#9CA3AF" style={{ marginBottom: 10 }} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", textAlign: "center" }}>No routines yet</Text>
            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4, textAlign: "center" }}>Tap here to add routines for {patientName}.</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.routineOuterContainer}>
          {/* Callout strip */}
          {/* 
            BACKEND FETCH REQUIREMENT: Live routine breach warnings.
            Fetched from geofence/routine alert logs or triage logs ('routine_alerts' or 'geofence_alerts' tables).
          */}
          {routineCallouts.filter(c => !dismissedCallouts.has(c.id)).length > 0 && (
            <View style={alertStyles.calloutStrip}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Feather name="alert-triangle" size={14} color="#92400E" style={{ marginRight: 6 }} />
                <Text style={alertStyles.calloutHeader}>Routine Alerts</Text>
              </View>
              {routineCallouts.filter(c => !dismissedCallouts.has(c.id)).map(c => (
                <View key={c.id} style={[alertStyles.calloutChip, c.severity === "high" ? alertStyles.calloutHigh : alertStyles.calloutMed]}>
                  <Feather 
                    name={c.severity === 'high' ? 'alert-octagon' : 'alert-circle'} 
                    size={20} 
                    color={c.severity === 'high' ? '#DC2626' : '#D97706'} 
                    style={{ marginRight: 6 }} 
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={alertStyles.calloutTitle}>{c.title}</Text>
                    <Text style={alertStyles.calloutMsg}>{c.message}</Text>
                  </View>
                  <Pressable hitSlop={10} onPress={() => onDismissCallout(c.id)} style={({ pressed }) => [alertStyles.dismissBtn, pressed && { opacity: 0.6 }]}>
                    <Feather name="x" size={12} color="#6B7280" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Capsule scroll */}
          {/* 
            BACKEND FETCH REQUIREMENT: Routine timeline listing and current task indicator.
            Requires daily routine items. The active index is calculated by checking the current time 
            against the task's scheduled 'time' values.
          */}
          <View style={styles.routineListViewport}>
            <Animated.ScrollView
              nestedScrollEnabled bounces={false} showsVerticalScrollIndicator={false}
              snapToInterval={CAPSULE_STEP} decelerationRate="fast" disableIntervalMomentum
              contentContainerStyle={styles.routineListContent}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: capsuleScrollY } } }], { useNativeDriver: true })}
              scrollEventThrottle={16}
            >
              {filteredRoutineItems.length === 0 ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
                  <Feather name="info" size={24} color="#9CA3AF" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#6B7280" }}>No matching routines today.</Text>
                </View>
              ) : (
                filteredRoutineItems.map((item, idx) => {
                  const scale = capsuleScrollY.interpolate({
                    inputRange: [(idx - 1) * CAPSULE_STEP, idx * CAPSULE_STEP, (idx + 1) * CAPSULE_STEP],
                    outputRange: [0.92, 1, 0.92],
                    extrapolate: "clamp"
                  });

                  return (
                    <Animated.View key={item.key} style={{ transform: [{ scale }] }}>
                      <RoutineCapsule
                        item={{
                          key: item.key,
                          title: item.title,
                          category: item.category,
                          status: item.status as any,
                          meta: item.meta,
                        }}
                        onSendReminder={onSendReminder}
                        reminderSent={reminderSentKeys.has(item.key)}
                      />
                    </Animated.View>
                  );
                })

              )}
            </Animated.ScrollView>
          </View>
        </View>
      )}

      <DashboardActionSection
        patientName={patientName}
        patientPhone={patientPhone}
        onNavigateGeofenceMap={onNavigateGeofenceMap}
      />
    </>
  );
};

const localStyles = StyleSheet.create({
  carePlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardInner: {
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  versionText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textMuted,
  },
  cardTitle: {
    fontFamily: F.extraBold,
    fontSize: 17,
    color: C.textPrimary,
  },
  cardDesc: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.primaryText,
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secondaryBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textPrimary,
  },
  careGoalsText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textPrimary,
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  monitoringText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 18,
  },
  riskRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
  },
  riskLow: {
    backgroundColor: '#E6F4EA',
  },
  riskMedium: {
    backgroundColor: '#FFF7ED',
  },
  riskHigh: {
    backgroundColor: '#FEE2E2',
  },
  riskLowText: {
    color: '#065F46',
  },
  riskMediumText: {
    color: '#C2410C',
  },
  riskHighText: {
    color: '#991B1B',
  },
});

