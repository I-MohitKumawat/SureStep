export type CaregiverSummaryTile = {
  id: string;
  name: string;
  relationship: string;
  adherencePercent: number;
  hasRecentAlerts: boolean;
  lastActivityLabel: string;
};

const MOCK_SUMMARY_TILES: CaregiverSummaryTile[] = [
  {
    id: 'p1',
    name: 'Alice Johnson',
    relationship: 'Mother',
    adherencePercent: 88,
    hasRecentAlerts: false,
    lastActivityLabel: 'Completed morning routine · 8:15 AM'
  },
  {
    id: 'p2',
    name: 'Robert Singh',
    relationship: 'Father-in-law',
    adherencePercent: 62,
    hasRecentAlerts: true,
    lastActivityLabel: 'Missed medication reminder · 9:30 AM'
  },
  {
    id: 'p3',
    name: 'Maria Lopez',
    relationship: 'Aunt',
    adherencePercent: 94,
    hasRecentAlerts: false,
    lastActivityLabel: 'All activities on track today'
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

