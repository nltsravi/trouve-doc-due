export const Colors = {
  // Brand colors
  primary: '#0B65F5', // Electric Blue (Modern AI & interaction)
  primaryLight: '#3B82F6', // Blue 500
  primaryDark: '#0848B3', // Deep Blue
  primaryNavy: '#071B3A', // Primary Navy (Deep trust & security)
  primaryGhost: 'rgba(11, 101, 245, 0.12)',

  // Accent & Status
  tealAccent: '#17C3A3', // Teal Accent (Readiness & AI sparkles)
  success: '#17C3A3', // Teal Accent (Valid, approved, readiness)
  successLight: 'rgba(23, 195, 163, 0.15)',
  warning: '#F59E0B', // Amber 500 (Expiring soon, please verify)
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444', // Red 500 (Overdue, expired, critical)
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  info: '#06B6D4', // Cyan 500
  infoLight: 'rgba(6, 182, 212, 0.15)',

  // Dark Theme (Default premium look)
  dark: {
    background: '#071B3A', // Brand Primary Navy
    card: '#0D2245', // Rich slate navy card
    cardElevated: '#132C54', // Elevated slate card
    cardHover: '#1B3664',
    border: '#1B3664',
    borderSubtle: '#0F254B',
    borderActive: '#0B65F5',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    tint: '#0B65F5',
    tabIconDefault: '#64748B',
    tabIconSelected: '#0B65F5',
    surface: '#0D2245',
    inputBackground: '#091A36',
  },

  // Light Theme
  light: {
    background: '#F5F8FC', // Official Light Background
    card: '#FFFFFF',
    cardElevated: '#EDF2F9',
    cardHover: '#E2EAF4',
    border: '#E2EAF4',
    borderSubtle: '#EDF2F9',
    borderActive: '#0B65F5',
    text: '#10213D', // Primary Text
    textSecondary: '#64748B', // Secondary Text
    textMuted: '#94A3B8',
    tint: '#0B65F5',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#0B65F5',
    surface: '#FFFFFF',
    inputBackground: '#EDF2F9',
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
