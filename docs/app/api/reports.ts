export type CaregiverPatientStatusGroup = 'next_due' | 'missed' | 'completed';

export type CaregiverSummaryTile = {
  id: string;
  name: string;
  relationship: string;
  adherencePercent: number;
  hasRecentAlerts: boolean;
  lastActivityLabel: string;
  /** Dashboard grouping: next due, missed, or completed / on track. */
  statusGroup: CaregiverPatientStatusGroup;
};

const MOCK_SUMMARY_TILES: CaregiverSummaryTile[] = [
  {
    id: 'p1',
    name: 'Alice Johnson',
    relationship: 'Mother',
    adherencePercent: 88,
    hasRecentAlerts: false,
    lastActivityLabel: 'Lunch check-in due · 1:00 PM',
    statusGroup: 'next_due'
  },
  {
    id: 'p2',
    name: 'Robert Singh',
    relationship: 'Father-in-law',
    adherencePercent: 62,
    hasRecentAlerts: true,
    lastActivityLabel: 'Missed medication reminder · 9:30 AM',
    statusGroup: 'missed'
  },
  {
    id: 'p3',
    name: 'Maria Lopez',
    relationship: 'Aunt',
    adherencePercent: 94,
    hasRecentAlerts: false,
    lastActivityLabel: 'All activities on track today',
    statusGroup: 'completed'
  }
];

/**
 * Typed client stub for a `GET /reports/summary`-like endpoint.
 * In future tasks this can be replaced with a real HTTP call.
 */
export async function fetchCaregiverSummaryTiles(): Promise<CaregiverSummaryTile[]> {
  // Simulate a short network delay to keep the UI behavior realistic.
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_SUMMARY_TILES;
}

