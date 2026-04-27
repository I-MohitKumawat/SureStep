/**
 * SureStep – shared design tokens
 * Single source of truth for colours used across all screens.
 */

export const C = {
  // ─── Brand / Primary ────────────────────────────────────────────────────────
  primary:        '#0E7A67',   // teal – buttons, active tab, accent
  primaryLight:   '#E4F4EE',   // teal tint – pill bg, icon bubble bg
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

  // ─── Auth / Onboarding accent (lavender – kept as-is) ───────────────────────
  lavender:       '#BFA2DB',
  lavenderLight:  '#E3D9F5',

  // ─── Misc ───────────────────────────────────────────────────────────────────
  done:           '#0E7A67',   // done circle
  pending:        '#FFFFFF',   // pending circle bg
  pendingBorder:  '#B7BDBD',   // pending circle border
  unsureBg:       '#F6F1DB',   // unsure/? button bg
  skipBg:         '#E8EDF3',   // skip button bg
} as const;

export type ColorKey = keyof typeof C;
