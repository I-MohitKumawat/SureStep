export type RoutineSummary = {
  id: string;
  patientId: string;
  name: string;
  isActive: boolean;
  scheduleLabel: string;
};

const MOCK_ROUTINES: RoutineSummary[] = [
  {
    id: 'r1',
    patientId: 'p1',
    name: 'Morning routine',
    isActive: true,
    scheduleLabel: 'Every day · 7:30 AM'
  },
  {
    id: 'r2',
    patientId: 'p1',
    name: 'Evening wind-down',
    isActive: true,
    scheduleLabel: 'Weekdays · 8:30 PM'
  },
  {
    id: 'r3',
    patientId: 'p2',
    name: 'Medication check-in',
    isActive: false,
    scheduleLabel: 'Paused routine'
  }
];

/**
 * Typed client stub for `GET /routines` filtered by patient.
 * Future tasks can replace this with a real HTTP call.
 */
export async function fetchRoutinesForPatient(patientId: string): Promise<RoutineSummary[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_ROUTINES.filter((routine) => routine.patientId === patientId);
}

