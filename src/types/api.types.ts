/**
 * SureStep — src/types/api.types.ts
 * TypeScript types mirroring backend PostgreSQL schema rows and API response shapes.
 * Mirrors: backend/db/schema/ tables.
 * Keep in sync with backend schema. If a column is added/removed, update here first.
 */
import type {
  UserRoleType, RelationshipType, RelationshipStatus,
  TaskStatus, TaskRecurrenceType, TaskCategory, TaskPriority,
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

export type CareContext = {
  relationships: Array<{
    id: string;
    patient_user_id: string;
    related_user_id: string;
    relationship_type: RelationshipType;
    status: RelationshipStatus;
    patient_name?: string;
    related_name?: string;
  }>;
  profiles: {
    hasPatientProfile: boolean;
    hasCaregiverProfile: boolean;
    hasFamilyProfile: boolean;
  };
};

export type UserMeData = {
  user: User;
  activeRole: UserRoleType | 'NEW_USER';
  careContext: CareContext;
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export type TaskStep = { order: number; text: string };

/**
 * Mirrors the `tasks` table — a single date-specific execution instance
 * generated from a `routine_templates` row.
 */
export type Task = {
  id:                  string;
  patient_id:          string;
  created_by:          string;         // caregiver user_id
  template_id?:        string;         // FK → routine_templates.id
  execution_time_id?:  string;         // FK → routine_execution_times.id
  title:               string;
  instructions_md?:    string;         // Markdown instructions shown to patient
  caregiver_notes?:    string;         // Caregiver-only clinical notes (never shown to patient)
  category:            TaskCategory;   // Structured category replaces raw emoji
  priority:            TaskPriority;   // Drives alert escalation thresholds
  icon_name?:          string;         // Feather/vector icon name or uploaded image URI
  emoji?:              string;         // Legacy field — kept for backward compat during migration
  voice_note_url?:     string;
  scheduled_timestamp: string;         // ISO datetime: date + scheduled execution time combined
  duration_minutes?:   number;
  recurrence:          TaskRecurrenceType;
  status:              TaskStatus;
  client_action_id?:   string;         // Idempotency key for offline sync (UUID v4)
  completed_at?:       string;
  completed_by?:       string;         // user_id of whoever marked it done
  updated_by?:         string;         // user_id of whoever last modified
};

/**
 * Mirrors the `routine_templates` table — the recurring care plan definition.
 * Generates daily `tasks` rows via a background cron job.
 */
export type RoutineTemplate = {
  id:                 string;
  patient_id:         string;
  created_by:         string;
  title:              string;
  instructions_md?:   string;          // Markdown care instructions
  caregiver_notes?:   string;          // Caregiver-only clinical notes
  category:           TaskCategory;
  priority:           TaskPriority;
  icon_name?:         string;
  start_date:         string;          // ISO date
  end_date?:          string;          // ISO date — null for indefinite routines
  recurrence_pattern: RoutineRecurrencePattern;
  completion_window:  string;          // e.g. '01:00:00' — grace period before overdue
  is_active:          boolean;
  created_at:         string;
  updated_at:         string;
  execution_times?:   RoutineExecutionTime[];   // Eager-loaded when requested
  attachments?:       RoutineAttachment[];      // Eager-loaded when requested
};

/** JSONB recurrence_pattern shape stored inside routine_templates. */
export type RoutineRecurrencePattern = {
  type:         TaskRecurrenceType;
  days?:        number[];  // 0=Sun … 6=Sat (for SPECIFIC_WEEKDAYS)
  interval?:    number;    // For EVERY_X_DAYS
  day_of_month?: number;   // For MONTHLY
};

/**
 * Mirrors the `routine_execution_times` table.
 * One template → many execution times (e.g. 08:00, 14:00, 20:00 for medication).
 */
export type RoutineExecutionTime = {
  id:             string;
  template_id:    string;
  scheduled_time: string;  // HH:MM:SS
  created_at:     string;
};

/**
 * Mirrors the `routine_attachments` table.
 * Holds image, PDF, video, or audio resources attached to a routine.
 */
export type RoutineAttachment = {
  id:           string;
  template_id:  string;
  file_url:     string;
  file_type:    string;    // MIME type e.g. 'image/jpeg', 'application/pdf', 'video/mp4'
  display_name?: string;
  created_at:   string;
};

/**
 * Mirrors the `daily_adherence_snapshots` table.
 * Precomputed nightly summary for fast dashboard rendering.
 */
export type DailyAdherenceSnapshot = {
  patient_id:       string;
  target_date:      string;   // ISO date
  total_scheduled:  number;
  total_completed:  number;
  total_missed:     number;
  score_percentage: number;   // 0.00 – 100.00
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

// ─── Patient Profile & Onboarding ─────────────────────────────────────────────
export type PatientMedicationItem = {
  id: string;
  name: string;
  dosage: string;
  times_of_day: string[];
  instructions?: string;
};

export type PatientProfile = {
  user_id: string;
  diagnosis?: string | null;
  diagnosis_date?: string | null;
  severity_level?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  emergency_contact_user_id?: string | null;
  emergency_contact_status?: 'LINKED' | 'PENDING' | 'UNLINKED';
  living_arrangement?: string | null;
  care_needs?: string[];
  safety_concerns?: string[];
  communication_preferences?: string[];
  other_conditions?: string[];
  onboarding_source?: 'SELF' | 'FAMILY';
  medications?: PatientMedicationItem[];
  known_triggers?: string[];
  comfort_items?: string[];
  favourite_songs?: any[];
  home_address?: string | null;
  home_lat?: number | null;
  home_lng?: number | null;
  can_use_phone_independently?: boolean;
  voice_command_enabled?: boolean;
  tts_enabled?: boolean;
  tts_speed?: number;
  cognitive_baseline_date?: string | null;
  updated_at?: string;
};

export type PatientOnboardingPayload = {
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  diagnosis?: string | null;
  diagnosis_date?: string | null;
  severity_level?: string | null;
  living_arrangement?: string | null;
  care_needs?: string[];
  safety_concerns?: string[];
  communication_preferences?: string[];
  other_conditions?: string[];
  onboarding_source?: 'SELF' | 'FAMILY';
  medications?: PatientMedicationItem[];
  known_triggers?: string[];
  comfort_items?: string[];
  favourite_songs?: any[];
  cognitive_baseline_date?: string | null;
  nimhans_patient_id?: string | null;
};

export type CaregiverQualificationItem = {
  id: string;
  name: string;
  issuer: string;
  year?: string | number;
  description?: string;
};

export type CaregiverProfile = {
  user_id: string;
  professional_role?: string | null;
  years_of_experience: number;
  dementia_experience_years: number;
  has_dementia_training: boolean;
  care_capabilities: string[];
  specializations: string[];
  qualifications: CaregiverQualificationItem[];
  languages_spoken: string[];
  availability_types: string[];
  service_city?: string | null;
  service_radius_km: number;
  max_patients: number;
  hourly_rate?: number | null;
  daily_rate?: number | null;
  bio?: string | null;
  is_discoverable: boolean;
  is_verified: boolean;
  verification_status?: string;
  updated_at?: string;
};

export type CaregiverOnboardingPayload = {
  professional_role?: string | null;
  years_of_experience?: number;
  dementia_experience_years?: number;
  has_dementia_training?: boolean;
  care_capabilities?: string[];
  specializations?: string[];
  qualifications?: CaregiverQualificationItem[];
  languages_spoken?: string[];
  availability_types?: string[];
  service_city?: string | null;
  service_radius_km?: number | null;
  max_patients?: number | null;
  hourly_rate?: number | null;
  daily_rate?: number | null;
  bio?: string | null;
  is_discoverable?: boolean;
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
