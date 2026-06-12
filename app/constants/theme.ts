// ─── Num Wallet Design System ─────────────────────────────────────────────────
// Logo-synced: Deep Blue #1040D4 + Electric Blue #3A8AFF + Chrome #C4D4E8 on Black

export const Colors = {
  // ── Core brand (from logo)
  brand: {
    deep: '#1040D4',       // deep royal blue (left side of N)
    bright: '#3A8AFF',     // electric blue (right side of N)
    chrome: '#C4D4E8',     // silver/chrome ribbon
    chromeLight: '#E8EFF8',
    gradient: ['#1040D4', '#3A8AFF'] as [string, string],
    gradientV: ['#0A2899', '#1040D4', '#3A8AFF'] as [string, string, string],
  },

  // ── Backgrounds
  bg: {
    base: '#000000',
    surface: '#08080F',
    elevated: '#0F0F1E',
    overlay: '#14142A',
    input: '#0C0C1C',
    card: '#0A0A18',
    modal: '#080814',
    muted: '#0F0F1E',       // fallback for muted/faded backgrounds
  },

  // ── Generic color names for action fallbacks & compatibility
  primary: { DEFAULT: '#1040D4', subtle: '#1040D418', border: '#1040D440', dark: '#1040D4' },
  blue: { DEFAULT: '#3A8AFF', subtle: '#3A8AFF18', border: '#3A8AFF40' },
  purple: { DEFAULT: '#8B5CF6', subtle: '#8B5CF618', border: '#8B5CF640' },
  orange: { DEFAULT: '#F59E0B', subtle: '#F59E0B18', border: '#F59E0B40' },
  pink: { DEFAULT: '#EC4899', subtle: '#EC489918', border: '#EC489940' },
  teal: { DEFAULT: '#14B8A6', subtle: '#14B8A618', border: '#14B8A640' },

  // ── Text
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    muted: '#475569',
    disabled: '#2D3748',
    chrome: '#C4D4E8',     // metallic/chrome text
    brand: '#3A8AFF',
    inverse: '#000000',
  },

  // ── Borders & dividers
  border: {
    DEFAULT: '#1A1A30',
    subtle: '#0F0F20',
    strong: '#252545',
    brand: '#1040D440',
    brandBright: '#3A8AFF40',
  },

  // ── Status
  success: '#10B981',
  successBg: '#10B98118',
  warning: '#F59E0B',
  warningBg: '#F59E0B18',
  error: '#EF4444',
  errorBg: '#EF444418',
  info: '#3A8AFF',
  infoBg: '#3A8AFF18',

  // ── Action colours
  send: { fg: '#10B981', bg: '#10B98118', border: '#10B98140' },
  receive: { fg: '#3A8AFF', bg: '#3A8AFF18', border: '#3A8AFF40' },
  convert: { fg: '#8B5CF6', bg: '#8B5CF618', border: '#8B5CF640' },
  hub: { fg: '#F59E0B', bg: '#F59E0B18', border: '#F59E0B40' },
  nft: { fg: '#EC4899', bg: '#EC489918', border: '#EC489940' },
  stake: { fg: '#14B8A6', bg: '#14B8A618', border: '#14B8A640' },

  transparent: 'transparent',
} as const;

export const Typography = {
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 44,
    '5xl': 52,
  },
  weight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  tracking: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
} as const;

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  full: 9999,
} as const;

export const IconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
} as const;
