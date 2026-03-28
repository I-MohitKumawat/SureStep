import type { HomeStackParamList } from '../../navigation/RootNavigator';

export type RiskLevel = 'stable' | 'at_risk' | 'elevated';

export type PatientBentoModel = {
  risk: {
    level: RiskLevel;
    headline: string;
    drivers: string[];
    decision: string;
  };
  location: {
    shortLabel: string;
    detail: string;
    updatedAt: string;
  };
  rings: {
    adherence7d: number;
    criticalTasks: number;
    engagement: number;
    centerLabel: 'Stable' | 'At Risk';
  };
  alerts: Array<{ id: string; severity: 'high' | 'watch'; title: string }>;
  trend: {
    values: number[];
    direction: 'rising' | 'falling' | 'flat';
    decision: string;
  };
  activity: {
    summary: string;
    decision: string;
  };
};

type Params = HomeStackParamList['PatientDetail'];

/**
 * Derives bento dashboard data from navigation params + lightweight heuristics.
 * Replace with GET /patients/:id/dashboard when the API exists.
 */
export function buildPatientBentoModel(p: Params): PatientBentoModel {
  const { adherencePercent, hasRecentAlerts, lastActivityLabel, name } = p;

  const lowAdherence = adherencePercent < 75;
  const atRisk = hasRecentAlerts || lowAdherence;

  let riskLevel: RiskLevel = 'stable';
  if (atRisk) {
    if (hasRecentAlerts && lowAdherence) riskLevel = 'at_risk';
    else if (hasRecentAlerts) riskLevel = 'elevated';
    else riskLevel = 'at_risk';
  }

  const drivers: string[] = [];
  if (hasRecentAlerts) drivers.push('Recent safety or routine alerts');
  if (lowAdherence) drivers.push(`Adherence below target (${adherencePercent}%)`);
  if (lastActivityLabel.toLowerCase().includes('missed')) drivers.push('Missed time-sensitive tasks');
  if (drivers.length === 0) drivers.push('No acute drivers flagged');

  const headline =
    riskLevel === 'stable'
      ? `${name.split(' ')[0] ?? name} is stable this week`
      : riskLevel === 'elevated'
        ? 'Elevated attention — review drivers'
        : 'At risk — prioritize follow-up';

  const adherence7d = Math.min(1, Math.max(0, adherencePercent / 100));
  const criticalTasks = hasRecentAlerts ? 0.45 : 0.82;
  const engagement = lastActivityLabel.toLowerCase().includes('no') || lastActivityLabel.toLowerCase().includes('without')
    ? 0.38
    : 0.72;

  const centerLabel: 'Stable' | 'At Risk' = atRisk ? 'At Risk' : 'Stable';

  const alerts: PatientBentoModel['alerts'] = [];
  if (hasRecentAlerts) {
    alerts.push({ id: 'a1', severity: 'high', title: 'Routine or safety alert in last 48h' });
  }
  if (lowAdherence) {
    alerts.push({ id: 'a2', severity: 'watch', title: `Weekly adherence under 75% (${adherencePercent}%)` });
  }
  if (lastActivityLabel.toLowerCase().includes('missed')) {
    alerts.push({ id: 'a3', severity: 'high', title: 'Missed medication or check-in' });
  }
  if (alerts.length === 0) {
    alerts.push({ id: 'ok1', severity: 'watch', title: 'No critical items — pattern looks steady' });
  } else if (alerts.length === 1) {
    alerts.push({ id: 'ok2', severity: 'watch', title: 'Review full history if unsure' });
  }

  const base = adherencePercent;
  const trendValues = [base - 12, base - 6, base - 2, base + 1, base, base - 1, base].map((v) =>
    Math.min(100, Math.max(0, v))
  );
  const direction: 'rising' | 'falling' | 'flat' =
    trendValues[trendValues.length - 1] > trendValues[0] + 3
      ? 'rising'
      : trendValues[trendValues.length - 1] < trendValues[0] - 3
        ? 'falling'
        : 'flat';

  return {
    risk: {
      level: riskLevel,
      headline,
      drivers: drivers.slice(0, 3),
      decision: atRisk ? 'Review history and notify patient if needed' : 'Keep current plan; spot-check next week'
    },
    location: {
      shortLabel: 'Near home · approx. 0.3 mi',
      detail: 'Last known: 123 Oak St area (mock). Open Maps for full navigation.',
      updatedAt: '12 min ago'
    },
    rings: {
      adherence7d,
      criticalTasks,
      engagement,
      centerLabel
    },
    alerts: alerts.slice(0, 3),
    trend: {
      values: trendValues,
      direction,
      decision: direction === 'falling' ? 'Consider adjusting schedule or reminders' : 'Continue monitoring trend'
    },
    activity: {
      summary: lastActivityLabel.includes('Opened')
        ? 'Opened app recently — no activities completed'
        : lastActivityLabel,
      decision: 'Send a gentle nudge or simplify today’s tasks'
    }
  };
}
