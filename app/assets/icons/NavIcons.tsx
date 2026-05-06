/**
 * SureStep – Navigation Bar SVG Icons
 * All icons are 28×28, stroke-based, consistent weight (1.8px stroke).
 * Usage: <HomeIcon size={24} color="#0E7A67" />
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, G } from 'react-native-svg';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

const D = 28; // default size

// ─── Patient Nav ─────────────────────────────────────────────────────────────

/** Home – classic house outline */
export const IconHome = ({ size = D, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M9 21V12h6v9"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

/** Family – two people side by side */
export const IconFamily = ({ size = D, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
    <Circle cx="18" cy="8" r="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M22 21v-1.5a3.5 3.5 0 0 0-2.5-3.35"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

/** Activity – trend line with upward pulse */
export const IconActivity = ({ size = D, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="2,12 6,12 8,5 11,19 14,9 17,14 19,12 22,12"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

/** Search – magnifying glass */
export const IconSearch = ({ size = D, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line
      x1="16.5" y1="16.5" x2="22" y2="22"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
    />
  </Svg>
);

// ─── Caregiver Nav ────────────────────────────────────────────────────────────

/** Dashboard / Grid – 4-square grid */
export const IconDashboard = ({ size = D, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="13" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="3" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="13" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** Bell – alert/notification */
export const IconBell = ({ size = D, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

/** Patients – person with plus (care indicator) */
export const IconPatients = ({ size = D, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
    <Line x1="19" y1="8" x2="19" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="16" y1="11" x2="22" y2="11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** Profile – person in circle */
export const IconProfile = ({ size = D, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M6.5 20.5a7 7 0 0 1 11 0"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

/** Settings – gear / cog */
export const IconSettings = ({ size = D, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

