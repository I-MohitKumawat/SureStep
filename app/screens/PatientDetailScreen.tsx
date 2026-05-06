import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../../packages/ui/theme/ThemeProvider';
import { buildPatientBentoModel } from './patientDetail/buildDashboardModel';
import { ConcentricRings } from './patientDetail/ConcentricRings';
import { Sparkline } from './patientDetail/Sparkline';

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientDetail'>;

export const PatientDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme();
  const { patientId, name } = route.params;
  const model = React.useMemo(() => buildPatientBentoModel(route.params), [route.params]);

  const [mapOpen, setMapOpen] = React.useState(false);

  const riskBg =
    model.risk.level === 'at_risk'
      ? '#fef2f2'
      : model.risk.level === 'elevated'
        ? '#fffbeb'
        : theme.colors.surface;
  const riskBorder =
    model.risk.level === 'at_risk'
      ? '#fecaca'
      : model.risk.level === 'elevated'
        ? '#fde68a'
        : theme.colors.borderSubtle;

  const trendDirLabel =
    model.trend.direction === 'rising' ? 'Rising' : model.trend.direction === 'falling' ? 'Falling' : 'Flat';

  return (
    <ScreenContainer style={styles.shell}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('RoutineManager', { patientId, patientName: name })}
          style={({ pressed }) => [
            styles.tile,
            styles.riskTile,
            styles.sectionGap,
            {
              backgroundColor: riskBg,
              borderColor: riskBorder,
              opacity: pressed ? 0.92 : 1
            }
          ]}
        >
          <Text style={[styles.riskEyebrow, { color: theme.colors.textSecondary }]}>Risk</Text>
          <Text style={[styles.riskHeadline, { color: theme.colors.textPrimary }]}>{model.risk.headline}</Text>
          {model.risk.drivers.map((d) => (
            <Text key={d} style={[styles.riskDriver, { color: theme.colors.textSecondary }]}>
              · {d}
            </Text>
          ))}
          <Text style={[styles.decision, { color: theme.colors.accent }]}>{model.risk.decision}</Text>
        </Pressable>

        <View style={[styles.row, styles.sectionGap]}>
          <View
            style={[
              styles.tile,
              styles.colLeft,
              { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.background }
            ]}
          >
            <Text style={[styles.tileEyebrow, { color: theme.colors.textSecondary }]}>Overview</Text>
            <View style={styles.ringsWrap}>
              <ConcentricRings
                size={152}
                outer={model.rings.adherence7d}
                middle={model.rings.criticalTasks}
                inner={model.rings.engagement}
                centerLabel={model.rings.centerLabel}
                accent={theme.colors.accent}
                track={theme.colors.borderSubtle}
                warning="#ca8a04"
              />
            </View>
            <Pressable onPress={() => navigation.navigate('RoutineManager', { patientId, patientName: name })}>
              <Text style={[styles.decision, { color: theme.colors.accent }]}>Adjust schedule</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => setMapOpen(true)}
            style={({ pressed }) => [
              styles.tile,
              styles.colRight,
              {
                borderColor: theme.colors.borderSubtle,
                backgroundColor: theme.colors.background,
                opacity: pressed ? 0.9 : 1
              }
            ]}
          >
            <Text style={[styles.tileEyebrow, { color: theme.colors.textSecondary }]}>Location</Text>
            <View style={[styles.mapPlaceholder, { borderColor: theme.colors.borderSubtle }]}>
              <Text style={[styles.mapGlyph, { color: theme.colors.textSecondary }]}>⌖</Text>
            </View>
            <Text style={[styles.mapLine, { color: theme.colors.textPrimary }]} numberOfLines={2}>
              {model.location.shortLabel}
            </Text>
            <Text style={[styles.mapTime, { color: theme.colors.textSecondary }]}>{model.location.updatedAt}</Text>
            <Text style={[styles.decision, { color: theme.colors.accent }]}>Expand</Text>
          </Pressable>
        </View>

        <View style={[styles.row, styles.sectionGap]}>
          <View
            style={[
              styles.tile,
              styles.colLeft,
              { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.background }
            ]}
          >
            <Text style={[styles.tileEyebrow, { color: theme.colors.textSecondary }]}>Alerts</Text>
            {model.alerts.map((a) => (
              <View key={a.id} style={styles.alertRow}>
                <View
                  style={[
                    styles.alertDot,
                    { backgroundColor: a.severity === 'high' ? '#dc2626' : '#ca8a04' }
                  ]}
                />
                <Text
                  style={[styles.alertText, { color: theme.colors.textPrimary, marginLeft: 8 }]}
                  numberOfLines={2}
                >
                  {a.title}
                </Text>
              </View>
            ))}
            <Pressable onPress={() => navigation.navigate('RoutineManager', { patientId, patientName: name })}>
              <Text style={[styles.decision, { color: theme.colors.accent }]}>Review history</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.tile,
              styles.colRight,
              { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.background }
            ]}
          >
            <Text style={[styles.tileEyebrow, { color: theme.colors.textSecondary }]}>Trend</Text>
            <Sparkline values={model.trend.values} />
            <Text style={[styles.trendMeta, { color: theme.colors.textSecondary }]}>
              7-day adherence · {trendDirLabel}
            </Text>
            <Pressable onPress={() => navigation.navigate('RoutineManager', { patientId, patientName: name })}>
              <Text style={[styles.decision, { color: theme.colors.accent }]}>{model.trend.decision}</Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.tile,
            styles.sectionGap,
            { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.background }
          ]}
        >
          <Text style={[styles.tileEyebrow, { color: theme.colors.textSecondary }]}>Engagement</Text>
          <Text style={[styles.engagementBody, { color: theme.colors.textPrimary }]}>{model.activity.summary}</Text>
          <Pressable onPress={() => navigation.navigate('RoutineManager', { patientId, patientName: name })}>
            <Text style={[styles.decision, { color: theme.colors.accent }]}>{model.activity.decision}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={mapOpen} animationType="fade" transparent onRequestClose={() => setMapOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMapOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.borderSubtle }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Last known location</Text>
            <Text style={[styles.modalBody, { color: theme.colors.textSecondary }]}>{model.location.detail}</Text>
            <Text style={[styles.modalBody, { color: theme.colors.textSecondary }]}>Updated {model.location.updatedAt}</Text>
            <Pressable style={[styles.modalClose, { backgroundColor: theme.colors.accent }]} onPress={() => setMapOpen(false)}>
              <Text style={styles.modalCloseLabel}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  sectionGap: {
    marginBottom: 24
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  colLeft: {
    flex: 1,
    marginRight: 6,
    minWidth: 0
  },
  colRight: {
    flex: 1,
    marginLeft: 6,
    minWidth: 0
  },
  tile: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16
  },
  riskTile: {
    borderWidth: 1
  },
  riskEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  riskHeadline: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 10
  },
  riskDriver: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4
  },
  tileEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10
  },
  ringsWrap: {
    alignItems: 'center',
    marginBottom: 8
  },
  mapPlaceholder: {
    height: 72,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  mapGlyph: {
    fontSize: 28
  },
  mapLine: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4
  },
  mapTime: {
    fontSize: 12,
    marginBottom: 8
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  trendMeta: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8
  },
  engagementBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10
  },
  decision: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  modalClose: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  modalCloseLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15
  }
});
