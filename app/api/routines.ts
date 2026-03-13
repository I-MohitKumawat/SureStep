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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function callBackend<T>(path: string, init?: any): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

/**
 * Typed client stub for `GET /routines` filtered by patient.
 * Now wired to `GET /routines` with a patient filter, but
 * falls back to the in-memory store if the backend is unavailable.
 */
export async function fetchRoutinesForPatient(patientId: string): Promise<RoutineSummary[]> {
  try {
    const data = await callBackend<RoutineSummary[]>(
      `/routines?patientId=${encodeURIComponent(patientId)}`
    );
    // Keep local cache roughly in sync for this patient.
    const others = routineStore.filter((r) => r.patientId !== patientId);
    routineStore = [...others, ...data];
    return data;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return routineStore.filter((routine) => routine.patientId === patientId);
  }
}

export type RoutineDraft = {
  patientId: string;
  name: string;
  isActive: boolean;
  scheduleLabel: string;
};

export async function createRoutine(draft: RoutineDraft): Promise<RoutineSummary> {
  try {
    const created = await callBackend<RoutineSummary>('/routines', {
      method: 'POST',
      body: JSON.stringify(draft)
    });
    routineStore = [created, ...routineStore];
    return created;
  } catch {
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
}

export async function updateRoutine(
  routineId: string,
  patch: Partial<Omit<RoutineSummary, 'id' | 'patientId'>> & { patientId?: string }
): Promise<RoutineSummary> {
  const idx = routineStore.findIndex((r) => r.id === routineId);
  if (idx === -1) {
    throw new Error('Routine not found');
  }
  const current = routineStore[idx];
  const merged: RoutineSummary = {
    ...current,
    ...patch,
    patientId: patch.patientId ?? current.patientId
  };

  try {
    const updated = await callBackend<RoutineSummary>(`/routines/${encodeURIComponent(routineId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: merged.name,
        isActive: merged.isActive,
        scheduleLabel: merged.scheduleLabel
      })
    });
    routineStore = routineStore.map((r) => (r.id === routineId ? updated : r));
    return updated;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 150));
    routineStore = routineStore.map((r) => (r.id === routineId ? merged : r));
    return merged;
  }
}

