/**
 * SureStep — src/components/caregiver/dashboard/DashboardAlertsTab.tsx
 * Extracted from CaregiverDashboardScreen.tsx lines 338–387 (Alerts tab).
 */
import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { styles, alertStyles } from "./dashboardStyles";

type NonRoutineAlert = {
  id:       string;
  type:     string;
  emoji:    string;
  title:    string;
  message:  string;
  severity: "critical" | "high" | "medium" | "low";
};

type Props = {
  nonRoutineAlerts: NonRoutineAlert[];
  seenNonRoutineIds: Set<string>;
  onAcknowledge:   (id: string) => void;
};

export const DashboardAlertsTab: React.FC<Props> = ({
  nonRoutineAlerts, seenNonRoutineIds, onAcknowledge,
}) => (
  <View style={styles.alertsContainer}>
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
      <Text style={styles.alertsTitle}>Safety Alerts</Text>
      {nonRoutineAlerts.length > 0 && (
        <View style={alertStyles.countBadge}>
          <Text style={alertStyles.countBadgeText}>{nonRoutineAlerts.length}</Text>
        </View>
      )}
    </View>
    <Text style={alertStyles.sectionLabel}>NON-ROUTINE ALERTS</Text>
    {nonRoutineAlerts.length === 0 ? (
      <View style={alertStyles.emptyBox}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
        <Text style={alertStyles.emptyTitle}>All Clear</Text>
        <Text style={alertStyles.emptyMsg}>No safety alerts at this time.</Text>
      </View>
    ) : nonRoutineAlerts.map((alert) => {
      const isSeen = seenNonRoutineIds.has(alert.id);
      const sevColors = alert.severity === "critical"
        ? { bg: "#FEE2E2", border: "#FECACA", dot: "#DC2626" }
        : alert.severity === "high"
        ? { bg: "#FEF3C7", border: "#FDE68A", dot: "#F59E0B" }
        : { bg: "#E5E7EB", border: "#D1D5DB", dot: "#9CA3AF" };
      return (
        <View key={alert.id} style={[alertStyles.card, { backgroundColor: sevColors.bg, borderColor: sevColors.border }, isSeen && alertStyles.cardSeen]}>
          <View style={[alertStyles.dot, { backgroundColor: sevColors.dot }]} />
          <View style={{ flex: 1 }}>
            <Text style={[alertStyles.cardTitle, !isSeen && alertStyles.unseen]}>{alert.emoji}  {alert.title}</Text>
            <Text style={[alertStyles.cardMsg, isSeen && alertStyles.seenMsg]}>{alert.message}</Text>
            <Text style={alertStyles.cardTime}>{alert.severity.toUpperCase()} · {alert.type.replace(/_/g, " ")}</Text>
          </View>
          <View style={{ gap: 6 }}>
            <Pressable onPress={() => void Linking.openURL("tel:")} style={({ pressed }) => [alertStyles.callBtn, pressed && { opacity: 0.8 }]}>
              <Text style={alertStyles.callBtnText}>📞 Call</Text>
            </Pressable>
            <Pressable onPress={() => onAcknowledge(alert.id)} style={({ pressed }) => [alertStyles.ackBtn, pressed && { opacity: 0.8 }]}>
              <Text style={alertStyles.ackBtnText}>✓ Done</Text>
            </Pressable>
          </View>
        </View>
      );
    })}
  </View>
);
