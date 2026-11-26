/**
 * SureStep — src/constants/caregiverDashboard.ts
 * Static labels, styling constants, and tab definitions for the Caregiver Dashboard.
 */

import type { CaregiverDashboardTabItem } from '../types/caregiverDashboard.types';

export const ROLE_LABELS: Record<string, string> = {
  DEMENTIA_SPECIALIST: 'Dementia Care Specialist',
  GERIATRIC_CAREGIVER: 'Geriatric Caregiver',
  NURSE_CLINICAL: 'Nursing & Clinical Assistant',
  GENERAL_CAREGIVER: 'General Home Care Aide',
  PALLIATIVE_CARE: 'Palliative & End-of-Life Care',
  COMPANION: 'Companion Caregiver',
  OTHER: 'Other Care Professional',
};

export const CARD_SHADOW = {
  shadowColor: '#254D51',
  shadowOpacity: 0.05,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowRadius: 6,
  elevation: 1,
};

export const CARD_CLASS = 'rounded-[18px] border border-care-border bg-white';

export const TABS: CaregiverDashboardTabItem[] = [
  {
    id: 'Home',
    label: 'Dashboard',
    icon: 'grid-outline',
    activeIcon: 'grid',
  },
  {
    id: 'Alerts',
    label: 'Notifications',
    icon: 'notifications-outline',
    activeIcon: 'notifications',
  },
  {
    id: 'Settings',
    label: 'Settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
  },
];
