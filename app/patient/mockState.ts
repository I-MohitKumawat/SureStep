export type RoutineStatus = 'pending' | 'completed' | 'missed';

export type PatientRoutine = {
  id: string;
  name: string;
  scheduledAtIso: string;
  completedAtIso: string | null;
};

export type PatientActivity = {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
};

export type PatientProfile = {
  id: string;
  name: string;
  caregiverName: string;
  emergencyContact: string;
  photoUrl: string | null;
};

export type PatientEvent =
  | {
      type: 'routine_completed';
      routineId: string;
      atIso: string;
    }
  | {
      type: 'activity_toggled';
      activityId: string;
      completed: boolean;
      atIso: string;
    };

type Store = {
  profile: PatientProfile;
  routines: PatientRoutine[];
  activities: PatientActivity[];
  events: PatientEvent[];
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function timeLabelFor(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad2(m)} ${ampm}`;
}

function isoAtLocalToday(hours: number, minutes: number) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function buildInitialStore(): Store {
  const profile: PatientProfile = {
    id: 'patient-dev-1',
    name: 'Dev Patient',
    caregiverName: 'Dev Caregiver',
    emergencyContact: 'Emergency Contact',
    photoUrl: null
  };

  // Generated from code (mock API state), not embedded in UI.
  const routines: PatientRoutine[] = [
    { id: 'rt_1', name: 'Morning routine', scheduledAtIso: isoAtLocalToday(8, 0), completedAtIso: null },
    { id: 'rt_2', name: 'Lunch check-in', scheduledAtIso: isoAtLocalToday(13, 0), completedAtIso: null },
    { id: 'rt_3', name: 'Evening wind-down', scheduledAtIso: isoAtLocalToday(19, 30), completedAtIso: null }
  ];

  const activities: PatientActivity[] = [
    { id: 'ac_1', name: 'Take a short walk', description: '10 minutes at a comfortable pace', completed: false },
    { id: 'ac_2', name: 'Play mind game', description: 'Try a simple memory or matching game', completed: false }
  ];

  return { profile, routines, activities, events: [] };
}

let store: Store = buildInitialStore();

export async function fetchPatientProfile(): Promise<PatientProfile> {
  await new Promise((r) => setTimeout(r, 200));
  return store.profile;
}

export async function fetchTodayRoutines(): Promise<PatientRoutine[]> {
  await new Promise((r) => setTimeout(r, 250));
  return store.routines;
}

export async function fetchTodayActivities(): Promise<PatientActivity[]> {
  await new Promise((r) => setTimeout(r, 250));
  return store.activities;
}

export function getRoutineStatus(r: PatientRoutine, now = new Date()): RoutineStatus {
  if (r.completedAtIso) return 'completed';
  const scheduled = new Date(r.scheduledAtIso);
  return now.getTime() > scheduled.getTime() ? 'missed' : 'pending';
}

export function getRoutineTimeLabel(r: PatientRoutine) {
  return timeLabelFor(new Date(r.scheduledAtIso));
}

export function logEvent(event: PatientEvent) {
  store = { ...store, events: [event, ...store.events] };
}

export async function markRoutineDone(routineId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 150));
  const nowIso = new Date().toISOString();
  store = {
    ...store,
    routines: store.routines.map((rt) =>
      rt.id === routineId ? { ...rt, completedAtIso: rt.completedAtIso ?? nowIso } : rt
    )
  };
  logEvent({ type: 'routine_completed', routineId, atIso: nowIso });
}

export async function toggleActivity(activityId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 150));
  const nowIso = new Date().toISOString();
  let nextCompleted = false;
  store = {
    ...store,
    activities: store.activities.map((a) => {
      if (a.id !== activityId) return a;
      nextCompleted = !a.completed;
      return { ...a, completed: !a.completed };
    })
  };
  logEvent({ type: 'activity_toggled', activityId, completed: nextCompleted, atIso: nowIso });
}

export async function fetchRecentEvents(limit = 10): Promise<PatientEvent[]> {
  await new Promise((r) => setTimeout(r, 100));
  return store.events.slice(0, limit);
}

