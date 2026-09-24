/**
 * SureStep — src/types/care.types.ts
 *
 * Single Source of Truth for:
 *  - Working Shifts & Availability
 *  - Care Capabilities & Duties
 *  - Caregiver Decline Reasons
 *  - Requester Withdrawal Reasons
 *  - Care Request Lifecycle & Schedules
 *
 * Aligned 1:1 with backend PostgreSQL schema & API contracts.
 */

import type { Ionicons } from '@expo/vector-icons';

// ─── CANONICAL SHIFTS ────────────────────────────────────────────────────────

export const CANONICAL_SHIFTS = [
  'DAY_SHIFT',       // Day Shifts
  'EVENING_SHIFT',   // Evening Shifts
  'OVERNIGHT',       // Overnight Care
  'LIVE_IN',         // 24-Hour / Live-in
  'WEEKEND',         // Weekend Only
  'FULL_TIME',       // Full-time
  'PART_TIME',       // Part-time
  'RESPITE',         // Respite / Relief Care
  'ON_CALL',         // On-call Emergency
] as const;

export type CanonicalShift = (typeof CANONICAL_SHIFTS)[number];

export interface ShiftChipOption {
  id: CanonicalShift;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export const SHIFT_OPTIONS: ShiftChipOption[] = [
  {
    id: 'DAY_SHIFT',
    label: 'Day Shifts',
    icon: 'sunny-outline',
    description: 'Standard daytime care assistance',
  },
  {
    id: 'EVENING_SHIFT',
    label: 'Evening Shifts',
    icon: 'partly-sunny-outline',
    description: 'Dinner, sundowning support, bedtime routine',
  },
  {
    id: 'OVERNIGHT',
    label: 'Overnight Care',
    icon: 'moon-outline',
    description: 'Night monitoring, bathroom assistance, wandering safety',
  },
  {
    id: 'LIVE_IN',
    label: '24-Hour / Live-in',
    icon: 'home-outline',
    description: 'Continuous around-the-clock live-in care',
  },
  {
    id: 'WEEKEND',
    label: 'Weekend Only',
    icon: 'calendar-outline',
    description: 'Saturday and Sunday care coverage',
  },
  {
    id: 'FULL_TIME',
    label: 'Full-time',
    icon: 'time-outline',
    description: 'Full-time ongoing weekly support',
  },
  {
    id: 'PART_TIME',
    label: 'Part-time',
    icon: 'hourglass-outline',
    description: 'Scheduled recurring part-time hours',
  },
  {
    id: 'RESPITE',
    label: 'Respite / Relief Care',
    icon: 'heart-outline',
    description: 'Short-term relief coverage for primary family caregivers',
  },
  {
    id: 'ON_CALL',
    label: 'On-call Emergency',
    icon: 'call-outline',
    description: 'On-demand standby support for urgent needs',
  },
];

// ─── CANONICAL CAPABILITIES ──────────────────────────────────────────────────

export const CANONICAL_CAPABILITIES = [
  'hygiene_bathing',         // Bathing & Personal Hygiene
  'mobility_transfers',      // Mobility & Transfers
  'medication_prompts',      // Medication Reminders
  'meal_prep_feeding',       // Meal Prep & Feeding
  'wandering_prevention',    // Wandering Prevention & Safety
  'behavioral_reassurance',  // Sundowning & Agitation Support
  'cognitive_stimulation',   // Companionship & Memory Games
  'bedridden_care',          // Bedridden & Pressure Sore Care
  'incontinence_care',       // Incontinence & Toileting
  'vitals_monitoring',       // Vitals Monitoring (BP/SpO2)
] as const;

export type CanonicalCapability = (typeof CANONICAL_CAPABILITIES)[number];

export interface CapabilityChipOption {
  id: CanonicalCapability;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export const CAPABILITY_OPTIONS: CapabilityChipOption[] = [
  {
    id: 'hygiene_bathing',
    label: 'Bathing & Personal Hygiene',
    icon: 'water-outline',
    description: 'Assisting with bathing, oral care, grooming, and dressing',
  },
  {
    id: 'mobility_transfers',
    label: 'Mobility & Transfers',
    icon: 'walk-outline',
    description: 'Safe bed-to-chair transfers, walking assistance, and fall prevention',
  },
  {
    id: 'medication_prompts',
    label: 'Medication Reminders',
    icon: 'medkit-outline',
    description: 'Timely reminders and prompt tracking for prescribed dosages',
  },
  {
    id: 'meal_prep_feeding',
    label: 'Meal Prep & Feeding',
    icon: 'nutrition-outline',
    description: 'Nutritious meal preparation, hydration encouragement, and feeding aid',
  },
  {
    id: 'wandering_prevention',
    label: 'Wandering Prevention & Safety',
    icon: 'footsteps-outline',
    description: 'Active vigilance, exit monitoring, and disorientation prevention',
  },
  {
    id: 'behavioral_reassurance',
    label: 'Sundowning & Agitation Support',
    icon: 'heart-half-outline',
    description: 'De-escalation, soothing techniques, and emotional reassurance',
  },
  {
    id: 'cognitive_stimulation',
    label: 'Companionship & Memory Games',
    icon: 'sparkles-outline',
    description: 'Familiar conversation, memory exercises, puzzles, and music therapy',
  },
  {
    id: 'bedridden_care',
    label: 'Bedridden & Pressure Sore Care',
    icon: 'bed-outline',
    description: 'Repositioning, bed sponge, skin hygiene, and pressure relief',
  },
  {
    id: 'incontinence_care',
    label: 'Incontinence & Toileting',
    icon: 'fitness-outline',
    description: 'Prompt toileting assistance, brief changes, and skin care',
  },
  {
    id: 'vitals_monitoring',
    label: 'Vitals Monitoring (BP/SpO2)',
    icon: 'pulse-outline',
    description: 'Tracking blood pressure, pulse, oxygen saturation, and temperature',
  },
];

// ─── CAREGIVER DECLINE REASONS ───────────────────────────────────────────────

export const CAREGIVER_DECLINE_REASONS = [
  'SCHEDULE_CONFLICT',     // Unavailable during requested shift hours
  'OUTSIDE_SERVICE_AREA',  // Location is beyond travel radius
  'CARE_NEEDS_MISMATCH',   // Care requirements exceed capability/scope
  'CAPACITY_FULL',         // Currently at maximum patient capacity
  'RATE_DISAGREEMENT',     // Proposed rate is unacceptable
  'OTHER',                 // Other commitments or personal reasons
] as const;

export type CaregiverDeclineReason = (typeof CAREGIVER_DECLINE_REASONS)[number];

export interface DeclineReasonOption {
  id: CaregiverDeclineReason;
  label: string;
  description: string;
}

export const DECLINE_REASON_OPTIONS: DeclineReasonOption[] = [
  {
    id: 'SCHEDULE_CONFLICT',
    label: 'Schedule Conflict',
    description: 'Unavailable during the requested days or shift hours',
  },
  {
    id: 'OUTSIDE_SERVICE_AREA',
    label: 'Outside Service Area',
    description: 'Patient location is beyond travel radius or commute limit',
  },
  {
    id: 'CARE_NEEDS_MISMATCH',
    label: 'Care Needs Mismatch',
    description: 'Required care duties or condition severity exceed comfort level',
  },
  {
    id: 'CAPACITY_FULL',
    label: 'Capacity Full',
    description: 'Currently managing maximum number of active patients',
  },
  {
    id: 'RATE_DISAGREEMENT',
    label: 'Rate Disagreement',
    description: 'Proposed rate is below caregiver rate schedule',
  },
  {
    id: 'OTHER',
    label: 'Other Reasons',
    description: 'Personal commitments or other scheduling reasons',
  },
];

// ─── REQUESTER WITHDRAWAL REASONS ────────────────────────────────────────────

export const REQUESTER_WITHDRAW_REASONS = [
  'FOUND_ALTERNATIVE_CARE',// Secured care through another provider
  'ARRANGED_FAMILY_CARE',  // Family member will provide care
  'SCHEDULE_CHANGED',      // Care needs or timing changed
  'ACCIDENTAL_REQUEST',    // Submitted request by mistake
  'OTHER',                 // No longer required
] as const;

export type RequesterWithdrawReason = (typeof REQUESTER_WITHDRAW_REASONS)[number];

export interface WithdrawReasonOption {
  id: RequesterWithdrawReason;
  label: string;
  description: string;
}

export const WITHDRAW_REASON_OPTIONS: WithdrawReasonOption[] = [
  {
    id: 'FOUND_ALTERNATIVE_CARE',
    label: 'Found Alternative Care',
    description: 'Secured care coverage through another professional provider',
  },
  {
    id: 'ARRANGED_FAMILY_CARE',
    label: 'Arranged Family Care',
    description: 'Family circle member will provide personal care coverage',
  },
  {
    id: 'SCHEDULE_CHANGED',
    label: 'Schedule Changed',
    description: 'Care timing, dates, or frequency needs have changed',
  },
  {
    id: 'ACCIDENTAL_REQUEST',
    label: 'Accidental Request',
    description: 'Care request was submitted by mistake',
  },
  {
    id: 'OTHER',
    label: 'No Longer Needed',
    description: 'Care request is no longer required',
  },
];

// ─── CARE REQUEST LIFECYCLE, RATES & SCHEDULES ───────────────────────────────

export const CARE_REQUEST_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'WITHDRAWN',
  'EXPIRED',
] as const;

export type CareRequestStatus = (typeof CARE_REQUEST_STATUSES)[number];

export const CARE_REQUEST_RATE_TYPES = ['HOURLY', 'DAILY'] as const;
export type CareRequestRateType = (typeof CARE_REQUEST_RATE_TYPES)[number];

export const CARE_REQUEST_SCHEDULE_TYPES = [
  'RECURRING',
  'DATE_RANGE',
  'FLEXIBLE',
  'ONE_TIME',
] as const;

export type CareRequestScheduleType = (typeof CARE_REQUEST_SCHEDULE_TYPES)[number];

export const CARE_REQUEST_EXPIRY_HOURS = 72;

// ─── CLIENT DATA MODELS ──────────────────────────────────────────────────────

export interface CareRequestPatientSummary {
  id: string;
  firstName: string;
  fullName?: string; // Revealed strictly post-acceptance
  photoUrl: string | null;
  approximateAge: number | null;
  city: string | null;
  phone?: string | null; // Revealed strictly post-acceptance
}

export interface CareRequestRequesterSummary {
  id: string;
  name: string;
  relationshipType?: string | null;
}

export interface CareRequestCaregiverSummary {
  id: string;
  name: string;
  photoUrl: string | null;
  professionalRole: string | null;
  rating: number | null;
  ratingCount: number;
  city: string | null;
  phone?: string | null; // Revealed strictly post-acceptance
}

export interface CareRequest {
  id: string;
  patientId: string;
  requesterId: string;
  caregiverId: string;
  status: CareRequestStatus;
  scheduleType: CareRequestScheduleType;
  requestedShifts: CanonicalShift[] | null;
  daysOfWeek: number[] | null;
  startDate: string;
  endDate: string | null;
  requestedCapabilities: CanonicalCapability[];
  proposedRateType: CareRequestRateType;
  proposedRateInr: number;
  careContextNotes: string | null;
  declineReason: CaregiverDeclineReason | null;
  withdrawReason: RequesterWithdrawReason | null;
  responseNotes: string | null;
  resultingRelationshipId: string | null;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  expiresAt: string;
  isExpired: boolean;
  patient?: CareRequestPatientSummary;
  requester?: CareRequestRequesterSummary;
  caregiver?: CareRequestCaregiverSummary;
}

export interface CreateCareRequestPayload {
  patientId: string;
  caregiverId: string;
  scheduleType: CareRequestScheduleType;
  requestedShifts?: CanonicalShift[] | null;
  daysOfWeek?: number[] | null;
  startDate: string;
  endDate?: string | null;
  requestedCapabilities: CanonicalCapability[];
  proposedRateType: CareRequestRateType;
  proposedRateInr: number;
  careContextNotes?: string | null;
}

export interface DeclineCareRequestPayload {
  declineReason: CaregiverDeclineReason;
  responseNotes?: string | null;
}

export interface WithdrawCareRequestPayload {
  withdrawReason: RequesterWithdrawReason;
  responseNotes?: string | null;
}

// ─── VALIDATION & HELPER FUNCTIONS ───────────────────────────────────────────

export function isCanonicalShift(val: unknown): val is CanonicalShift {
  return typeof val === 'string' && (CANONICAL_SHIFTS as readonly string[]).includes(val);
}

export function isCanonicalCapability(val: unknown): val is CanonicalCapability {
  return typeof val === 'string' && (CANONICAL_CAPABILITIES as readonly string[]).includes(val);
}

export function isCaregiverDeclineReason(val: unknown): val is CaregiverDeclineReason {
  return typeof val === 'string' && (CAREGIVER_DECLINE_REASONS as readonly string[]).includes(val);
}

export function isRequesterWithdrawReason(val: unknown): val is RequesterWithdrawReason {
  return typeof val === 'string' && (REQUESTER_WITHDRAW_REASONS as readonly string[]).includes(val);
}

export function isCareRequestStatus(val: unknown): val is CareRequestStatus {
  return typeof val === 'string' && (CARE_REQUEST_STATUSES as readonly string[]).includes(val);
}

export function isCareRequestRateType(val: unknown): val is CareRequestRateType {
  return typeof val === 'string' && (CARE_REQUEST_RATE_TYPES as readonly string[]).includes(val);
}

export function isCareRequestScheduleType(val: unknown): val is CareRequestScheduleType {
  return typeof val === 'string' && (CARE_REQUEST_SCHEDULE_TYPES as readonly string[]).includes(val);
}

export function validateCareRequestInput(
  input: Partial<CreateCareRequestPayload>,
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.patientId) errors.patientId = 'Patient is required';
  if (!input.caregiverId) errors.caregiverId = 'Caregiver is required';
  if (!input.scheduleType || !isCareRequestScheduleType(input.scheduleType)) {
    errors.scheduleType = 'Valid schedule type is required';
  }
  if (!input.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    errors.startDate = 'Valid start date (YYYY-MM-DD) is required';
  }
  if (input.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) {
    errors.endDate = 'End date must be in YYYY-MM-DD format';
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    errors.endDate = 'End date cannot be earlier than start date';
  }
  if (!input.proposedRateType || !isCareRequestRateType(input.proposedRateType)) {
    errors.proposedRateType = 'Proposed rate type is required';
  }
  if (input.proposedRateInr === undefined || input.proposedRateInr === null || input.proposedRateInr <= 0) {
    errors.proposedRateInr = 'Rate must be greater than 0';
  }

  // Schedule type specifics
  if (input.scheduleType === 'RECURRING') {
    if (!input.requestedShifts || input.requestedShifts.length === 0) {
      errors.requestedShifts = 'Select at least one shift for recurring care';
    }
    if (!input.daysOfWeek || input.daysOfWeek.length === 0) {
      errors.daysOfWeek = 'Select at least one day of the week';
    }
  }

  if (input.scheduleType === 'DATE_RANGE') {
    if (!input.requestedShifts || input.requestedShifts.length === 0) {
      errors.requestedShifts = 'Select at least one shift';
    }
    if (!input.endDate) {
      errors.endDate = 'End date is required for a date range';
    }
  }

  if (input.scheduleType === 'ONE_TIME') {
    if (!input.requestedShifts || input.requestedShifts.length === 0) {
      errors.requestedShifts = 'Select at least one shift';
    }
  }

  if (input.careContextNotes && input.careContextNotes.length > 1000) {
    errors.careContextNotes = 'Care context notes cannot exceed 1000 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
