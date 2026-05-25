/**
 * SureStep — src/components/caregiver/dashboard/DashboardHomeTab.tsx
 * Extracted from CaregiverDashboardScreen.tsx lines 477–753 (Home tab content).
 * Owns: patient header, routine capsule list, geofence status card.
 */
import React, { useMemo } from "react";
import { Animated, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { styles, alertStyles, rSumStyles } from "./dashboardStyles";
import type { Task } from "../../../context/TaskContext";
import {
  checkBreach, haversineMeters,
  type Coords, type GeofenceZone,
} from "../../../utils/geofenceUtils";

type Props = {
  patientName:        string;
  patientPhone:       string;
  batteryLevel:       number;
  batteryColor:       string;
  patientCoords:      Coords | null;
  coordsTs:           number;
  zones:              GeofenceZone[];
  unackedAlerts:      number;
  hasRealLocation:    boolean;
  hasRealZones:       boolean;
  patientTasks:       Task[];
  activeRoutineIndex: number;
  routineItems:       Array<{ key: string; emoji: string; title: string; meta: string; done: boolean; status: string }>;
  routineCallouts:    Array<{ id: string; emoji: string; title: string; message: string; severity: string }>;
  dismissedCallouts:  Set<string>;
  reminderSentKeys:   Set<string>;
  capsuleScrollY:     Animated.Value;
  showRoutineSummary: boolean;
  onShowPatientProfile: () => void;
  onShowRoutineSummary: () => void;
  onDismissCallout:     (id: string) => void;
  onSendReminder:       (key: string) => void;
  onNavigateManage:     () => void;
  onNavigateGeofenceMap:() => void;
  onNavigateGeofenceEditor: () => void;
};

const CAPSULE_HEIGHT = 84;
const CAPSULE_GAP    = 12;
const CAPSULE_STEP   = CAPSULE_HEIGHT + CAPSULE_GAP;

export const DashboardHomeTab: React.FC<Props> = ({
  patientName, patientPhone, batteryLevel, batteryColor,
  patientCoords, coordsTs, zones, unackedAlerts, hasRealLocation, hasRealZones,
  patientTasks, activeRoutineIndex, routineItems, routineCallouts, dismissedCallouts,
  reminderSentKeys, capsuleScrollY, showRoutineSummary,
  onShowPatientProfile, onShowRoutineSummary, onDismissCallout, onSendReminder,
  onNavigateManage, onNavigateGeofenceMap, onNavigateGeofenceEditor,
}) => {
  const lastActivityLabel = useMemo(() => {
    const times = patientTasks.filter(t => t.completedAt).map(t => new Date(t.completedAt!).getTime());
    if (!times.length) return "No activity yet";
    const diff = Math.round((Date.now() - Math.max(...times)) / 60000);
    if (diff < 1)  return "Just now";
    if (diff < 60) return `${diff} MINS AGO`;
    return `${Math.floor(diff / 60)} HR AGO`;
  }, [patientTasks]);

  const getCapsuleColors = (idx: number, done: boolean) => {
    if (idx < activeRoutineIndex) return done
      ? { backgroundColor: "#065F46", borderColor: "#065F46", titleColor: "#fff", metaColor: "#fff", statusColor: "#fff" }
      : { backgroundColor: "#DC2626", borderColor: "#DC2626", titleColor: "#fff", metaColor: "#fff", statusColor: "#fff" };
    if (idx === activeRoutineIndex) return { backgroundColor: "#0E7A67", borderColor: "#0E7A67", titleColor: "#fff", metaColor: "#fff", statusColor: "#fff" };
    return { backgroundColor: "#D6DDDD", borderColor: "#D6DDDD", titleColor: "#111827", metaColor: "#6B7280", statusColor: "#6B7280" };
  };

  return (
    <>
      {/* ── Patient Header ───────────────────────────────────────── */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={onShowPatientProfile} style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.75 }]}>
            <Text style={styles.avatarInitial}>{patientName[0]?.toUpperCase() ?? "S"}</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.overview}>PATIENT OVERVIEW</Text>
            <View style={styles.nameRow}><Text style={styles.name}>{patientName}</Text></View>
            <Text style={styles.lastActivity}>LAST ACTIVITY · {lastActivityLabel}</Text>
            <View style={styles.headerActions}>
              <Pressable style={({ pressed }) => [styles.headerActionBtn, styles.headerCallBtn, pressed && { opacity: 0.8 }]} onPress={() => void Linking.openURL("tel:")}>
                <Text style={styles.headerActionIcon}>📞</Text>
                <Text style={styles.headerCallLabel}>Call</Text>
              </Pressable>
              <View style={styles.headerBatteryChip}>
                <Text style={styles.headerActionIcon}>🔋</Text>
                <Text style={[styles.headerBatteryLabel, { color: batteryColor }]}>{batteryLevel}%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── Daily Routine ─────────────────────────────────────────── */}
      {routineItems.length === 0 ? (
        <View style={styles.routineOuterContainer}>
          <Pressable style={{ alignItems: "center", paddingVertical: 28 }} onPress={onNavigateManage}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>📋</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", textAlign: "center" }}>No routines yet</Text>
            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4, textAlign: "center" }}>Tap here to add routines for {patientName}.</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.routineOuterContainer}>
          {/* Summary bar */}
          <Pressable style={({ pressed }) => [rSumStyles.bar, pressed && { opacity: 0.88 }]} onPress={onShowRoutineSummary}>
            {[
              { count: patientTasks.filter(t => t.status === "missed").length, label: "Missed",    dot: "#DC2626" },
              { count: patientTasks.filter(t => t.status === "pending" || t.status === "unsure").length, label: "Pending",   dot: "#F59E0B" },
              { count: patientTasks.filter(t => t.status === "done").length,   label: "Completed", dot: "#10B981" },
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
            <Text style={rSumStyles.chevron}>›</Text>
          </Pressable>

          {/* Callout strip */}
          {routineCallouts.filter(c => !dismissedCallouts.has(c.id)).length > 0 && (
            <View style={alertStyles.calloutStrip}>
              <Text style={alertStyles.calloutHeader}>⚠️  Routine Alerts</Text>
              {routineCallouts.filter(c => !dismissedCallouts.has(c.id)).map(c => (
                <View key={c.id} style={[alertStyles.calloutChip, c.severity === "high" ? alertStyles.calloutHigh : alertStyles.calloutMed]}>
                  <Text style={alertStyles.calloutEmoji}>{c.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={alertStyles.calloutTitle}>{c.title}</Text>
                    <Text style={alertStyles.calloutMsg}>{c.message}</Text>
                  </View>
                  <Pressable hitSlop={10} onPress={() => onDismissCallout(c.id)} style={({ pressed }) => [alertStyles.dismissBtn, pressed && { opacity: 0.6 }]}>
                    <Text style={alertStyles.dismissText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Capsule scroll */}
          <View style={styles.routineListViewport}>
            <Animated.ScrollView
              nestedScrollEnabled bounces={false} showsVerticalScrollIndicator={false}
              snapToInterval={CAPSULE_STEP} decelerationRate="fast" disableIntervalMomentum
              contentContainerStyle={styles.routineListContent}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: capsuleScrollY } } }], { useNativeDriver: true })}
              scrollEventThrottle={16}
            >
              {routineItems.map((item, idx) => {
                const cc = getCapsuleColors(idx, item.done);
                const scale = capsuleScrollY.interpolate({ inputRange: [(idx - 1) * CAPSULE_STEP, idx * CAPSULE_STEP, (idx + 1) * CAPSULE_STEP], outputRange: [0.92, 1, 0.92], extrapolate: "clamp" });
                return (
                  <Animated.View key={item.key} style={[styles.routineCapsule, { backgroundColor: cc.backgroundColor, borderColor: cc.borderColor, transform: [{ scale }] }]}>
                    <View style={styles.routineCapsuleTextCol}>
                      <Text style={[styles.routineCapsuleTitle, { color: cc.titleColor }]}>{item.emoji}  {item.title}</Text>
                      <Text style={[styles.routineCapsuleMeta,  { color: cc.metaColor  }]}>{item.meta}</Text>
                    </View>
                    <View style={styles.capsuleRight}>
                      <Text style={[styles.routineCapsuleStatus, { color: cc.statusColor }]}>
                        {idx < activeRoutineIndex ? (item.done ? "Done" : "Missed") : idx === activeRoutineIndex ? "Now" : "Next"}
                      </Text>
                      <Pressable onPress={() => onSendReminder(item.key)} style={({ pressed }) => [styles.capsuleReminderBtn, pressed && { opacity: 0.72 }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.capsuleReminderIcon}>{reminderSentKeys.has(item.key) ? "✓" : "🔔"}</Text>
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
