export const Colors = {
  // Brand colors
  primary: '#2563EB', // Blue 600
  primaryLight: '#3B82F6', // Blue 500
  primaryDark: '#1D4ED8', // Blue 700
  primaryGhost: 'rgba(37, 99, 235, 0.12)',

  // Accent & Status
  success: '#10B981', // Emerald 500 (Valid, approved)
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B', // Amber 500 (Expiring soon, please verify)
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444', // Red 500 (Overdue, expired, critical)
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  info: '#06B6D4', // Cyan 500
  infoLight: 'rgba(6, 182, 212, 0.15)',

  // Dark Theme (Default premium look)
  dark: {
    background: '#0B0F17', // Deep obsidian navy
    card: '#131A26', // Rich slate navy
    cardElevated: '#1E293B', // Slate 800
    cardHover: '#243044',
    border: '#1E293B',
    borderSubtle: '#172033',
    borderActive: '#3B82F6',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    tint: '#3B82F6',
    tabIconDefault: '#64748B',
    tabIconSelected: '#3B82F6',
    surface: '#151D2C',
    inputBackground: '#0F1622',
  },

  // Light Theme
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardElevated: '#F1F5F9',
    cardHover: '#E2E8F0',
    border: '#E2E8F0',
    borderSubtle: '#EDF2F7',
    borderActive: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    tint: '#2563EB',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#2563EB',
    surface: '#FFFFFF',
    inputBackground: '#F1F5F9',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.2 },
  button: { fontSize: 15, fontWeight: '600' as const },
  overline: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
};
