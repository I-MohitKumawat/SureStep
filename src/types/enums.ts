/**
 * SureStep — src/types/enums.ts
 * Frontend mirror of ALL backend PostgreSQL ENUM types.
 * Defined in Backend schema: backend/db/schema/01_enums.sql
 * Keep in sync: if a backend ENUM value changes, update here first, then fix TypeScript errors.
 */

export type UserRoleType = 'PATIENT' | 'CAREGIVER' | 'FAMILY' | 'DOCTOR';

export type RelationshipType =
  | 'CAREGIVER'
  | 'GUARDIAN'
  | 'FAMILY_CLOSE'
  | 'FAMILY_EXTENDED'
  | 'DOCTOR';

export type RelationshipStatus = 'PENDING' | 'CONFIRMED' | 'SUSPENDED' | 'ENDED';

export type TaskStatus = 'PENDING' | 'DONE' | 'MISSED' | 'OVERDUE' | 'UNSURE' | 'SKIPPED';

export type TaskRecurrenceType =
  | 'NONE'
  | 'DAILY'
  | 'ALTERNATE_DAYS'
  | 'SPECIFIC_WEEKDAYS'
  | 'EVERY_X_DAYS'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'CUSTOM';

/** Structured category for a routine task — replaces emoji-only categorisation. */
export type TaskCategory =
  | 'medication'
  | 'meal'
  | 'exercise'
  | 'walk'
  | 'appointment'
  | 'cognition'
  | 'therapy'
  | 'hygiene'
  | 'sleep'
  | 'custom';

/** Escalation priority for a routine task — drives alert severity. */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type LocationSource = 'PHONE' | 'WEARABLE' | 'GLASS' | 'MANUAL';

export type LocationState =
  | 'MOVING'
  | 'STATIONARY_KNOWN'
  | 'STATIONARY_UNKNOWN'
  | 'NO_SIGNAL';

export type SafetyState = 'SAFE' | 'APPROACHING' | 'BREACH' | 'CRITICAL';

export type RoutineState = 'ON_TRACK' | 'BEHIND' | 'MISSED_CRITICAL' | 'ALL_DONE';

export type EngagementState = 'ACTIVE' | 'IDLE' | 'NO_INTERACTION';

export type ZoneType =
  | 'HOME'
  | 'CLINIC'
  | 'PARK'
  | 'PHARMACY'
  | 'TEMPLE'
  | 'MARKET'
  | 'CUSTOM';

export type BoundaryType = 'SOFT' | 'HARD';

export type AlertType =
  | 'ZONE_EXIT'
  | 'ZONE_ENTER'
  | 'APPROACHING_BOUNDARY'
  | 'STATIONARY_UNKNOWN'
  | 'ERRATIC_MOVEMENT'
  | 'WANDERING'
  | 'NO_SIGNAL'
  | 'TASK_MISSED_CRITICAL'
  | 'TASK_UNSURE'
  | 'MEDICATION_MISSED'
  | 'MEDICATION_REFILL_DUE'
  | 'FALL_DETECTED'
  | 'SOS_TRIGGERED'
  | 'INACTIVITY';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type VoiceTriggerType =
  | 'MANUAL'
  | 'AUTO_STATIONARY'
  | 'AUTO_DISORIENTED'
  | 'AUTO_ROUTINE_REMINDER'
  | 'AUTO_MORNING_ORIENTATION'
  | 'AUTO_MISSED_CRITICAL'
  | 'SCHEDULED';

export type CloneStatus = 'RAW' | 'PROCESSING' | 'READY' | 'FAILED';

export type DeviceType =
  | 'PHONE_IOS'
  | 'PHONE_ANDROID'
  | 'WEARABLE'
  | 'GLASS'
  | 'HOME_HUB';

export type GameType =
  | 'MEMORY_MATCH'
  | 'WORD_FINDER'
  | 'COLOR_SORT'
  | 'SOUND_RECALL'
  | 'FACE_RECOGNITION'
  | 'ORIENTATION_CHECK'
  | 'PICTURE_PUZZLE';

export type MetricType =
  | 'REACTION_TIME_MS'
  | 'RECALL_ACCURACY'
  | 'SEQUENCE_ERROR'
  | 'TOUCH_HESITATION_MS'
  | 'ORIENTATION_CORRECT'
  | 'FACE_RECOGNISED'
  | 'MOOD_SCORE';

export type CognitiveTrend = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';

export type StoryMediaType = 'PHOTO' | 'VOICE_NOTE' | 'TEXT' | 'VIDEO_MEMO';

export type DocumentType =
  | 'PRESCRIPTION'
  | 'DIAGNOSTIC_REPORT'
  | 'DISCHARGE_SUMMARY'
  | 'INSURANCE'
  | 'OTHER';

export type OtpPurpose = 'LOGIN' | 'PHONE_CHANGE' | 'ACCOUNT_DELETION';

/**
 * @deprecated Legacy 4-value availability type from early schema.
 * Use `CanonicalShift` from `./care.types` for the authoritative 9-shift domain model:
 * ('DAY_SHIFT' | 'EVENING_SHIFT' | 'OVERNIGHT' | 'LIVE_IN' | 'WEEKEND' | 'FULL_TIME' | 'PART_TIME' | 'RESPITE' | 'ON_CALL')
 */
export type AvailabilityType = 'LIVE_IN' | 'VISITING' | 'NIGHT' | 'ON_CALL';

// Authoritative Care Domain Exports
export * from './care.types';

export type ShiftStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'MISSED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export type FamiliarityAssetType = 'PHOTO' | 'SONG' | 'MEMORY_TEXT' | 'PLACE';

export type MoodContext = 'MORNING' | 'POST_GAME' | 'EVENING';

export type MedicationForm =
  | 'TABLET'
  | 'CAPSULE'
  | 'SYRUP'
  | 'INJECTION'
  | 'DROPS'
  | 'PATCH'
  | 'OTHER';

export type MedicationLogStatus = 'TAKEN' | 'MISSED' | 'SKIPPED';

export type MessageMediaType = 'TEXT' | 'VOICE_NOTE' | 'PHOTO';
