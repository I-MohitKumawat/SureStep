/**
 * SureStep — src/types/api.types.ts
 * TypeScript types mirroring backend PostgreSQL schema rows and API response shapes.
 * Mirrors: backend/db/schema/ tables.
 * Keep in sync with backend schema. If a column is added/removed, update here first.
 */
import type {
  UserRoleType, RelationshipType, RelationshipStatus,
  TaskStatus, TaskRecurrenceType,
  LocationState, SafetyState, RoutineState, EngagementState,
  ZoneType, BoundaryType,
  AlertType, AlertSeverity, AlertStatus,
  GameType, MetricType, CognitiveTrend,
  StoryMediaType, MoodContext,
  AvailabilityType, ShiftStatus, PaymentStatus,
  DeviceType, MessageMediaType,
} from './enums';

// ─── Core User ───────────────────────────────────────────────────────────────
export type User = {
  id:                 string;
  phone:              string;
  name:               string;
  date_of_birth?:     string;      // ISO date string
  gender?:            string;
  preferred_language: string;      // ISO 639-1, e.g. 'en'
  city?:              string;
  photo_url?:         string;
  role:               UserRoleType;
  is_active:          boolean;
  last_login_at?:     string;
  created_at:         string;
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export type TaskStep = { order: number; text: string };

export type Task = {
  id:               string;
  patient_id:       string;
  created_by:       string;       // caregiver user_id
  title:            string;
  patient_hint?:    string;       // simplified text shown to patient
  steps:            TaskStep[];
  emoji?:           string;
  voice_note_url?:  string;
  scheduled_time:   string;       // HH:MM
  scheduled_date:   string;       // ISO date
  duration_minutes: number;
  is_critical:      boolean;
  recurrence:       TaskRecurrenceType;
  status:           TaskStatus;
  completed_at?:    string;
};

// ─── Patient State (Awareness Engine) ────────────────────────────────────────
export type PatientState = {
  patient_id:          string;
  location_state:      LocationState;
  safety_state:        SafetyState;
  routine_state:       RoutineState;
  engagement_state:    EngagementState;
  last_known_lat?:     number;
  last_known_lng?:     number;
  last_ping_at?:       string;
  tasks_total_today:   number;
  tasks_done_today:    number;
  battery_pct?:        number;
  computed_at:         string;
};

// ─── Geofence ────────────────────────────────────────────────────────────────
export type GeofenceZone = {
  id:         string;
  patient_id: string;
  label:      string;
  zone_type:  ZoneType;
  center_lat: number;
  center_lng: number;
  radius_m:   number;
  boundary:   BoundaryType;
  is_active:  boolean;
};

// ─── Alert ───────────────────────────────────────────────────────────────────
export type Alert = {
  id:              string;
  patient_id:      string;
  alert_type:      AlertType;
  severity:        AlertSeverity;
  status:          AlertStatus;
  payload:         Record<string, unknown>;
  created_at:      string;
  acknowledged_at?: string;
  resolved_at?:    string;
};

// ─── Voice Message ────────────────────────────────────────────────────────────
export type VoiceMessage = {
  id:              string;
  patient_id:      string;
  caregiver_id:    string;
  audio_url:       string;
  transcript?:     string;
  trigger_type:    string;
  duration_s:      number;
  heard_at?:       string;
  created_at:      string;
};

// ─── Family Story ─────────────────────────────────────────────────────────────
export type FamilyStory = {
  id:           string;
  patient_id:   string;
  author_id:    string;
  author_name:  string;
  media_type:   StoryMediaType;
  content_url?: string;
  caption?:     string;
  reactions:    Record<string, number>;
  created_at:   string;
};

// ─── Cognition ────────────────────────────────────────────────────────────────
export type GameSession = {
  id:            string;
  patient_id:    string;
  game_type:     GameType;
  started_at:    string;
  ended_at?:     string;
  score?:        number;
  trend:         CognitiveTrend;
};

export type CognitionMetric = {
  id:           string;
  session_id:   string;
  metric_type:  MetricType;
  value:        number;
  recorded_at:  string;
};

export type MoodCheckin = {
  id:         string;
  patient_id: string;
  context:    MoodContext;
  mood_score: number;   // 1–5
  notes?:     string;
  created_at: string;
};

// ─── Appointment ──────────────────────────────────────────────────────────────
export type Appointment = {
  id:                       string;
  patient_id:               string;
  created_by:               string;
  title:                    string;
  scheduled_at:             string;
  location?:                string;
  reminder_offset_minutes:  number;
  notes?:                   string;
  completed_at?:            string;
};

// ─── Shift ────────────────────────────────────────────────────────────────────
export type Shift = {
  id:              string;
  patient_id:      string;
  caregiver_id:    string;
  status:          ShiftStatus;
  scheduled_start: string;
  scheduled_end:   string;
  checkin_at?:     string;
  checkout_at?:    string;
  checkin_lat?:    number;
  checkin_lng?:    number;
};

// ─── Message Thread ───────────────────────────────────────────────────────────
export type MessageThread = {
  id:           string;
  patient_id:   string;
  participants: string[];
  last_message: string;
  updated_at:   string;
};

export type Message = {
  id:           string;
  thread_id:    string;
  sender_id:    string;
  media_type:   MessageMediaType;
  content:      string;
  media_url?:   string;
  created_at:   string;
  read_at?:     string;
};

// ─── Patient Relationship ─────────────────────────────────────────────────────
export type PatientRelationship = {
  id:                string;
  patient_user_id:   string;
  related_user_id:   string;
  relationship_type: RelationshipType;
  status:            RelationshipStatus;
  confirmed_at?:     string;
  created_at:        string;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export type AuthSession = {
  id:            string;
  device_id:     string;
  device_name?:  string;
  device_type:   DeviceType;
  last_active_at:string;
  expires_at:    string;
};

// ─── API Response Wrappers ────────────────────────────────────────────────────
export type ApiResponse<T> = {
  data:    T;
  message?: string;
};

export type PaginatedResponse<T> = {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
};
