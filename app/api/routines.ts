export type RoutineSummary = {
  id: string;
  patientId: string;
  name: string;
  isActive: boolean;
  scheduleLabel: string;
};

let routineStore: RoutineSummary[] = [
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
  return routineStore.filter((routine) => routine.patientId === patientId);
}

export type RoutineDraft = {
  patientId: string;
  name: string;
  isActive: boolean;
  scheduleLabel: string;
};

export async function createRoutine(draft: RoutineDraft): Promise<RoutineSummary> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const routine: RoutineSummary = {
    id: `r_${Date.now()}`,
    patientId: draft.patientId,
    name: draft.name,
    isActive: draft.isActive,
    scheduleLabel: draft.scheduleLabel
  };
  routineStore = [routine, ...routineStore];
  return routine;
}

export async function updateRoutine(
  routineId: string,
  patch: Partial<Omit<RoutineSummary, 'id' | 'patientId'>> & { patientId?: string }
): Promise<RoutineSummary> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const idx = routineStore.findIndex((r) => r.id === routineId);
  if (idx === -1) {
    throw new Error('Routine not found');
  }
  const current = routineStore[idx];
  const updated: RoutineSummary = {
    ...current,
    ...patch,
    patientId: patch.patientId ?? current.patientId
  };
  routineStore = routineStore.map((r) => (r.id === routineId ? updated : r));
  return updated;
}

