/**
 * SureStep — src/components/caregiver/dashboard/DashboardHomeTab.tsx
 * Extracted from CaregiverDashboardScreen.tsx lines 477–753 (Home tab content).
 * Owns: patient header, routine capsule list, geofence status card.
 */
import React, { useMemo } from "react";
import { Animated, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { styles, alertStyles, rSumStyles } from "./dashboardStyles";
import type { Task, TaskCategory } from "../../../context/TaskContext";
import { IconHome } from "../../../assets/icons/NavIcons";
import {
  checkBreach, haversineMeters,
  type Coords, type GeofenceZone,
} from "../../../utils/geofenceUtils";

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
};

const CAPSULE_HEIGHT = 84;
const CAPSULE_GAP = 12;
const CAPSULE_STEP = CAPSULE_HEIGHT + CAPSULE_GAP;

/**
 * Maps a structured TaskCategory to a Feather icon name.
 * Replaces the old emoji-string parsing approach — categories come directly
 * from the backend 'category' column on routine_templates / tasks.
 */
const getCategoryIcon = (category: TaskCategory): string => {
  switch (category) {
    case 'medication':   return 'activity';    // pill / health activity
    case 'meal':         return 'coffee';       // meal / food
    case 'exercise':     return 'zap';          // physical effort
    case 'walk':         return 'compass';      // outdoor navigation
    case 'appointment':  return 'calendar';     // scheduled visit
    case 'cognition':    return 'award';        // brain/game activity
    case 'therapy':      return 'heart';        // therapeutic care
    case 'hygiene':      return 'droplet';      // water / cleanliness
    case 'sleep':        return 'moon';         // rest / sleep
    case 'custom':       return 'clipboard';    // generic task
    default:             return 'clipboard';
  }
};

export const DashboardHomeTab: React.FC<Props> = ({
  patientName, patientPhone, batteryLevel, batteryColor,
  patientCoords, coordsTs, zones, unackedAlerts, hasRealLocation, hasRealZones,
  patientTasks, activeRoutineIndex, routineItems, routineCallouts, dismissedCallouts,
  reminderSentKeys, capsuleScrollY, showRoutineSummary,
  onShowPatientProfile, onShowRoutineSummary, onDismissCallout, onSendReminder,
  onNavigateManage, onNavigateGeofenceMap, onNavigateGeofenceEditor,
  patientAge, patientPhoto,
}) => {
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
            {/* 
              BACKEND FETCH REQUIREMENT: Patient age. 
              Calculated from patient's date of birth ('date_of_birth' in 'users' table). 
              Currently, if DOB is unavailable, it defaults to Age 78 for mockup demonstration.
            */}
            <Text style={styles.newHeaderAge}>
              {patientAge ? `Age ${patientAge}` : "Age 78"}
            </Text>
          </View>
        </View>
        {/* 
          BACKEND FETCH REQUIREMENT: Patient active/online state.
          Currently static 'Active'. In production, this status pill should be computed by 
          checking the patient's device connectivity state (e.g. websocket connections or last heartbeat timestamp).
        */}
        <View style={styles.newActiveBadge}>
          <View style={styles.newActiveDot} />
          <Text style={styles.newActiveText}>Active</Text>
        </View>
      </View>

      {/* ── Current Status Gradient Card ─────────────────────────── */}
      <Pressable onPress={onNavigateGeofenceMap} style={({ pressed }) => [styles.newStatusCardPress, pressed && { opacity: 0.95 }]}>
        <LinearGradient
          colors={['#1E73E6', '#0F59C8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.newStatusCard}
        >
          <View style={styles.statusCardTop}>
            <View style={styles.statusHomeIconCircle}>
              <IconHome size={22} color="#FFFFFF" strokeWidth={2} />
            </View>
          </View>

          <View style={styles.statusCardMiddle}>
            <Text style={styles.statusCardSub}>Current Status</Text>
            {/* 
              BACKEND FETCH REQUIREMENT: Live location tracking status.
              Calculated by checking if the latest location 'patientCoords' (from 'patient_locations' table) 
              violates any active 'geofences' defined for the patient.
            */}
            <Text style={styles.statusCardMain} numberOfLines={1}>
              {(() => {
                if (patientCoords && zones.length > 0) {
                  const breach = checkBreach(patientCoords, zones);
                  if (breach.status === 'breach') return "Outside safe zone";
                  if (breach.status === 'approaching') return "Approaching boundary";
                  if (breach.status === 'safe') return `Safe at ${breach.zone.label || 'Home'}`;
                }
                return "Safe at Home";
              })()}
            </Text>
          </View>

          <View style={styles.statusCardBottom}>
            <Feather name="clock" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            {/* 
              BACKEND FETCH REQUIREMENT: Last location timestamp.
              Derived from 'coordsTs' ('recorded_at' field in the 'patient_locations' table)
              to display time elapsed since the last location ping.
            */}
            <Text style={styles.statusCardTimeText}>
              {(() => {
                if (!coordsTs) return "Last updated 2 min ago";
                const diff = Math.round((Date.now() - coordsTs) / 60000);
                if (diff < 1) return "Last updated Just now";
                if (diff < 60) return `Last updated ${diff} min ago`;
                const diffHr = Math.floor(diff / 60);
                if (diffHr < 24) return `Last updated ${diffHr} hr ago`;
                return `Last updated ${Math.floor(diffHr / 24)} days ago`;
              })()}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* ── Side-by-Side Indicators ──────────────────────────────── */}
      <View style={styles.newIndicatorsRow}>
        {/* 
          BACKEND FETCH REQUIREMENT: Battery percentage.
          Currently parsed from 'batteryLevel' prop. In production, this should be real-time 
          telemetry data sent from the patient's mobile app and stored in the database.
        */}
        <View style={styles.newIndicatorChip}>
          <Ionicons name="battery-charging" size={18} color="#18181B" style={{ marginRight: 8 }} />
          <Text style={styles.newIndicatorText}>{batteryLevel}%</Text>
        </View>
        {/* 
          BACKEND FETCH REQUIREMENT: Signal/network strength indicator.
          Currently static 'Strong Signal'. In production, this should display network connectivity 
          quality (e.g. WiFi/Cellular strength values) sent via device telemetry.
        */}
        <View style={styles.newIndicatorChip}>
          <Ionicons name="cellular" size={18} color="#18181B" style={{ marginRight: 8 }} />
          <Text style={styles.newIndicatorText}>Strong Signal</Text>
        </View>
      </View>

      {/* ── Daily Routine ─────────────────────────────────────────── */}
      {/* 
        BACKEND FETCH REQUIREMENT: Routine tasks. 
        Fetched from database ('tasks' table) where 'patient_id' matches current patient.
      */}
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
          {/* Summary bar */}
          {/* 
            BACKEND FETCH REQUIREMENT: Routine statistics/counts. 
            Computed via query aggregation of 'tasks' status values ('done', 'missed', 'pending') 
            for the current active day.
          */}
          <Pressable style={({ pressed }) => [rSumStyles.bar, pressed && { opacity: 0.88 }]} onPress={onShowRoutineSummary}>
            {[
              { count: patientTasks.filter(t => t.status === "missed").length, label: "Missed", dot: "#DC2626" },
              { count: patientTasks.filter(t => t.status === "pending" || t.status === "unsure").length, label: "Pending", dot: "#F59E0B" },
              { count: patientTasks.filter(t => t.status === "done").length, label: "Completed", dot: "#10B981" },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={rSumStyles.statChip}>
                  <View style={[rSumStyles.statDot, { backgroundColor: s.dot }]} />
                  <Text style={rSumStyles.statNum}>{s.count}</Text>
                  <Text style={rSumStyles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={rSumStyles.divider} />}
              </React.Fragment>
            ))}
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </Pressable>

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
              {routineItems.map((item, idx) => {
                const cc = getCapsuleColors(idx, item.done, item.status);
                const scale = capsuleScrollY.interpolate({ inputRange: [(idx - 1) * CAPSULE_STEP, idx * CAPSULE_STEP, (idx + 1) * CAPSULE_STEP], outputRange: [0.92, 1, 0.92], extrapolate: "clamp" });
                return (
                  <Animated.View key={item.key} style={[styles.routineCapsule, { backgroundColor: cc.backgroundColor, borderColor: cc.borderColor, transform: [{ scale }] }]}>
                    <View style={styles.routineCapsuleTextCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name={getCategoryIcon(item.category) as any} size={18} color={cc.titleColor} style={{ marginRight: 8 }} />
                        <Text style={[styles.routineCapsuleTitle, { color: cc.titleColor }]} numberOfLines={1}>{item.title}</Text>
                      </View>
                      <Text style={[styles.routineCapsuleMeta, { color: cc.metaColor }]} numberOfLines={1}>{item.meta}</Text>
                    </View>
                    <View style={styles.capsuleRight}>
                      <Text style={[styles.routineCapsuleStatus, { color: cc.statusColor }]}>
                        {item.status === 'overdue' ? 'Overdue' : idx < activeRoutineIndex ? (item.done ? "Done" : "Missed") : idx === activeRoutineIndex ? "Now" : "Next"}
                      </Text>
                      <Pressable onPress={() => onSendReminder(item.key)} style={({ pressed }) => [styles.capsuleReminderBtn, pressed && { opacity: 0.72 }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name={reminderSentKeys.has(item.key) ? "check" : "bell"} size={16} color={cc.titleColor} />
                      </Pressable>
                    </View>
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
          </View>
        </View>
      )}
    </>
  );
};
