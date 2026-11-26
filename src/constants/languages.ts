/**
 * SureStep — src/constants/languages.ts
 * Canonical frontend language configuration for user `preferred_language`.
 *
 * NOTE: Storing `preferred_language` persists the user's account preference
 * across onboarding and settings. Full UI string localization is out of scope
 * and will plug into `DEFAULT_LANGUAGE_CODE` and `SUPPORTED_LANGUAGES`.
 */

export type SupportedLanguageCode =
  | 'en'
  | 'hi'
  | 'kn'
  | 'ta'
  | 'te'
  | 'ml'
  | 'mr'
  | 'bn';

export interface LanguageOption {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
}

export const DEFAULT_LANGUAGE_CODE: SupportedLanguageCode = 'en';

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
] as const;

/**
 * Core 6 languages offered across Patient and Family onboarding and settings.
 */
export const CORE_SUPPORTED_LANGUAGES: readonly LanguageOption[] =
  SUPPORTED_LANGUAGES.slice(0, 6);

const CODE_BY_KEY = new Map<string, SupportedLanguageCode>();
const OPTION_BY_CODE = new Map<SupportedLanguageCode, LanguageOption>();

for (const lang of SUPPORTED_LANGUAGES) {
  OPTION_BY_CODE.set(lang.code, lang);
  CODE_BY_KEY.set(lang.code.toLowerCase(), lang.code);
  CODE_BY_KEY.set(lang.name.toLowerCase(), lang.code);
  CODE_BY_KEY.set(lang.nativeName.toLowerCase(), lang.code);
}

/**
 * Normalizes an ISO code, English name, or native display name to a canonical
 * ISO 639-1 code. Returns null when empty or unrecognized.
 */
export function normalizeLanguageCode(
  value?: string | null,
): SupportedLanguageCode | null {
  if (!value || typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  return CODE_BY_KEY.get(key) ?? null;
}

/**
 * Resolves any stored language value to a canonical code, falling back to 'en'
 * only when no valid preference exists.
 */
export function resolveLanguageCode(
  value?: string | null,
): SupportedLanguageCode {
  return normalizeLanguageCode(value) ?? DEFAULT_LANGUAGE_CODE;
}

export function getLanguageOption(value?: string | null): LanguageOption {
  const code = resolveLanguageCode(value);
  return OPTION_BY_CODE.get(code) ?? SUPPORTED_LANGUAGES[0];
}

export function getLanguageDisplayName(value?: string | null): string {
  const code = normalizeLanguageCode(value);
  if (code) {
    return OPTION_BY_CODE.get(code)?.name ?? 'English';
  }
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || 'English';
}
