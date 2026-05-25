/**
 * SureStep — src/theme/colors.ts
 * Single source of truth for ALL colours across all roles.
 * Migrated from: app/theme/colors.ts + packages/ui/theme/tokens.ts
 * Role-specific palettes added per TDD Section 7.3 and Section 2.3.
 */

export const C = {
  // ─── Brand / Primary ────────────────────────────────────────────────────────
  primary:        '#0E7A67',   // teal – buttons, active tab, accent
  primaryLight:   '#b1f3da',   // teal tint – pill bg, icon bubble bg
  primaryDark:    '#0A5D50',   // pressed / hover state
  primaryText:    '#FFFFFF',   // text on primary background

  // ─── Backgrounds ────────────────────────────────────────────────────────────
  bg:             '#F2F5F5',   // screen background
  headerBg:       '#EAF0EF',   // patient home header card
  surface:        '#FFFFFF',   // card surfaces
  surfaceAlt:     '#F8FAFA',   // lighter / secondary cards

  // ─── Borders ────────────────────────────────────────────────────────────────
  border:         '#E6EAEC',   // card borders
  borderMid:      '#D6DDDD',   // divider / stronger border

  // ─── Text ───────────────────────────────────────────────────────────────────
  textPrimary:    '#111827',   // headings, primary text
  textBody:       '#1F2937',   // body text
  textSecondary:  '#6B7280',   // meta / subtitle
  textLabel:      '#0E7A67',   // green overline / label text
  textMuted:      '#9CA3AF',   // muted / disabled text

  // ─── Status ─────────────────────────────────────────────────────────────────
  safe:           '#D1FAE5',   // safe badge background
  safeBorder:     '#6EE7B7',   // safe badge border
  safeText:       '#065F46',   // safe badge text
  error:          '#DC2626',   // validation error

  // ─── Auth / Onboarding accent (lavender) ────────────────────────────────────
  lavender:       '#BFA2DB',
  lavenderLight:  '#E3D9F5',

  // ─── Misc ───────────────────────────────────────────────────────────────────
  done:           '#0E7A67',   // done circle
  pending:        '#FFFFFF',   // pending circle bg
  pendingBorder:  '#B7BDBD',   // pending circle border
  unsureBg:       '#F6F1DB',   // unsure/? button bg
  skipBg:         '#E8EDF3',   // skip button bg
} as const;

// ─── Patient Role Palette (TDD Section 7.3) ─────────────────────────────────
// RULE: No red on patient screens (except SOS button). No orange warnings.
export const patientC = {
  primary:  '#4A90E2',   // Warm blue — primary CTA (Done button), active state
  soft:     '#EDE9FE',   // Soft lavender — TaskCard background, calm surfaces
  accent:   '#F59E0B',   // Warm amber — Unsure button, secondary actions
  text:     '#111827',   // Near-black — all patient text, high contrast
  bg:       '#FDFAF6',   // Off-white warm — screen background
} as const;

// ─── SOS Token (patient screens only — no other element uses this) ───────────
export const SOS_RED = '#DC2626';

// ─── Caregiver Role Palette ──────────────────────────────────────────────────
export const caregiverC = {
  primary:  '#0E7A67',   // Teal — same as brand primary
  alert:    '#DC2626',   // Red — allowed for caregiver alerts
  warning:  '#F59E0B',   // Amber — approaching / medium severity
  safe:     '#065F46',   // Dark green — safe state text
} as const;

// ─── Family Role Palette ─────────────────────────────────────────────────────
export const familyC = {
  primary:  '#7C3AED',   // Purple — family brand accent
  soft:     '#EDE9FE',   // Soft lavender — family card backgrounds
  text:     '#111827',
} as const;

export type ColorKey = keyof typeof C;
