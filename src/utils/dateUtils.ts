/**
 * SureStep — src/utils/dateUtils.ts
 * Date formatting helpers used across all screens.
 */

/** Format ISO date to 'DD Mon YYYY' — e.g. '22 May 2026' */
export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Returns 'X MINS AGO', 'X HR AGO', or 'Just now' */
export const relativeTime = (isoOrMs: string | number): string => {
  const ms  = typeof isoOrMs === 'string' ? new Date(isoOrMs).getTime() : isoOrMs;
  const diff = Math.round((Date.now() - ms) / 60000);
  if (diff < 1)  return 'Just now';
  if (diff < 60) return `${diff} MIN AGO`;
  const hr = Math.floor(diff / 60);
  return `${hr} HR AGO`;
};

/** Returns HH:MM string from a Date or ISO string */
export const toHHMM = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/** Returns 'Today', 'Yesterday', or formatted date */
export const friendlyDate = (iso: string): string => {
  const d     = new Date(iso);
  const today = new Date();
  const diff  = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return formatDate(iso);
};
