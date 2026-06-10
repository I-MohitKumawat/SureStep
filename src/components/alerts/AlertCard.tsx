import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { F } from '../../theme/fonts';
import { StatusProgression, type AlertProgressStatus } from './StatusProgression';

export type AlertSeverity = 'URGENT' | 'WARNING' | 'INFO';

export interface AlertCardProps {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertProgressStatus;
  patientName?: string;
  responderName?: string | null;
  responderRole?: string | null;
  
  // Handlers for caregiver actions
  onAcknowledge?: (id: string) => void;
  onRespond?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  id,
  title,
  description,
  timestamp,
  severity,
  status,
  patientName = 'Patient',
  responderName,
  responderRole,
  onAcknowledge,
  onRespond,
  onResolve,
}) => {

  const isResolved = status === 'resolved';
  const isAcknowledged = status === 'acknowledged' || status === 'responding';

  // Define theme colors based on severity and status
  const getThemeColor = () => {
    if (isResolved) return '#0D9488'; // Teal
    if (severity === 'URGENT') return '#EF4444'; // Red
    if (severity === 'WARNING') return '#F59E0B'; // Orange/Amber
    return '#3B82F6'; // Blue
  };

  const themeColor = getThemeColor();

  // Helper to render severity badge
  const renderBadge = () => {
    if (isAcknowledged) {
      const isCaregiver = responderRole === 'CAREGIVER';
      const roleLabel = isCaregiver ? 'Caregiver' : 'Family';
      const responderText = responderName 
        ? `Responding — ${responderName} (${roleLabel})`
        : 'Acknowledged – Responding';
      return (
        <View style={[styles.badgeContainer, styles.badgeResponding]}>
          <Ionicons name="time-outline" size={12} color="#D97706" style={styles.badgeIcon} />
          <Text style={[styles.badgeText, { color: '#D97706' }]} numberOfLines={1}>
            {responderText}
          </Text>
        </View>
      );
    }


    let bg = '#EFF6FF';
    let text = '#3B82F6';
    let label = 'INFO';
    let iconName: any = 'information-circle-outline';

    if (severity === 'URGENT') {
      bg = '#FEE2E2';
      text = '#EF4444';
      label = 'URGENT';
      iconName = 'alert-circle-outline';
    } else if (severity === 'WARNING') {
      bg = '#FEF3C7';
      text = '#D97706';
      label = 'WARNING';
      iconName = 'warning-outline';
    }

    return (
      <View style={[styles.badgeContainer, { backgroundColor: bg }]}>
        <Ionicons name={iconName} size={12} color={text} style={styles.badgeIcon} />
        <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
      </View>
    );
  };

  // ─── RESOLVED COMPACT CARD LAYOUT ──────────────────────────────────────────
  if (isResolved) {
    return (
      <View style={styles.resolvedCard}>
        {/* Left Green Check Icon */}
        <View style={styles.checkIconWrap}>
          <Ionicons name="checkmark" size={16} color="#0D9488" />
        </View>

        {/* Right content panel */}
        <View style={styles.resolvedRight}>
          <View style={styles.resolvedRow}>
            {/* TODO: Add link reference to geofence event or alert history archive */}
            <Text style={styles.resolvedTitle}>{title}</Text>
            {/* TODO: Format using standardized localized timestamp helper */}
            <Text style={styles.resolvedTime}>{timestamp}</Text>
          </View>

          {/* Solid Progress Line */}
          <StatusProgression status="resolved" themeColor={themeColor} />
        </View>
      </View>
    );
  }

  // ─── ACTIVE / ACKNOWLEDGED FULL CARD LAYOUT ────────────────────────────────
  return (
    <View style={[styles.card, isAcknowledged && styles.cardAcknowledged]}>
      {/* Top Header Row */}
      <View style={styles.cardHeader}>
        {/* TODO: Integrate alert source taxonomy metadata */}
        {renderBadge()}
        {/* TODO: Link to backend alert occurrence timestamp */}
        <Text style={styles.timeLabel}>{timestamp}</Text>
      </View>

      {/* Title & Description */}
      {/* TODO: Bind to patient identity reference inside backend model */}
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{description}</Text>

      {/* Progress / Status Progression */}
      {/* TODO: Drive status states reactively from active tracking pipeline */}
      <StatusProgression status={status} themeColor={themeColor} />

      {/* Action Buttons Row */}
      {!isResolved && (
        <View style={styles.actionsRow}>
          {status === 'new' && (
            <>
              {/* Acknowledge Button */}
              {/* TODO: Call POST /api/v1/alerts/:id/acknowledge */}
              <Pressable
                style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
                onPress={() => onAcknowledge?.(id)}
              >
                <Ionicons name="checkmark" size={16} color="#3B82F6" style={styles.btnIcon} />
                <Text style={styles.btnSecondaryText}>Acknowledge</Text>
              </Pressable>

              {/* Respond Button */}
              {/* TODO: Call POST /api/v1/alerts/:id/respond */}
              <Pressable
                style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
                onPress={() => onRespond?.(id)}
              >
                <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.btnPrimaryText}>Respond</Text>
              </Pressable>
            </>
          )}

          {status !== 'new' && onResolve && (
            /* Resolve Button (for Responding state) */
            /* TODO: Call POST /api/v1/alerts/:id/resolve with incident reports */
            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                { backgroundColor: themeColor, width: '100%' },
                pressed && styles.btnPressed,
              ]}
              onPress={() => onResolve?.(id)}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={styles.btnIcon} />
              <Text style={styles.btnPrimaryText}>Resolve Alert</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardAcknowledged: {
    backgroundColor: '#FFFDF5', // Soft cream/yellow background
    borderColor: '#FEF3C7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeResponding: {
    backgroundColor: '#FEF3C7',
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  timeLabel: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#111827',
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnPrimaryText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnSecondaryText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#3B82F6',
  },
  btnIcon: {
    marginRight: 6,
  },
  btnPressed: {
    opacity: 0.8,
  },
  
  // Resolved minimalist styles
  resolvedCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  checkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resolvedRight: {
    flex: 1,
  },
  resolvedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resolvedTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  resolvedTime: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#9CA3AF',
  },
});
