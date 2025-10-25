/**
 * Shared theme tokens for both web and React Native
 * Based on USA.gov professional blue color scheme
 */

export const colors = {
  // Professional Blues (USA.gov inspired)
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#0071bc", // Primary bright blue
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#112e51", // Deep navy
  },

  // Neutrals with blue tint
  gray: {
    50: "#fafbfc", // Card background
    100: "#f1f4f8", // Page background
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // Dark mode colors
  navy: {
    50: "#e0e7f1",
    100: "#b3c5db",
    200: "#7fa0c3",
    300: "#4b7aaa",
    400: "#235e98",
    500: "#0a4285",
    600: "#083c7d",
    700: "#062e5f", // Card dark
    800: "#04244a",
    900: "#0a192f", // Background dark
  },

  // Semantic colors
  green: {
    500: "#10b981",
    600: "#16a34a",
    700: "#15803d",
  },
  orange: {
    500: "#f97316",
    600: "#ea580c",
  },
  red: {
    500: "#ef4444",
    600: "#dc2626",
  },

  // Base colors
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
};

/**
 * Semantic color mappings for light mode
 */
export const lightTheme = {
  // Backgrounds
  background: colors.gray[100],
  foreground: colors.blue[900],
  card: colors.gray[50],
  cardForeground: colors.blue[900],

  // Primary colors
  primary: colors.blue[500],
  primaryForeground: colors.white,

  // Secondary colors
  secondary: colors.gray[200],
  secondaryForeground: colors.blue[900],

  // Muted colors
  muted: colors.gray[100],
  mutedForeground: colors.gray[600],

  // Accent colors
  accent: colors.blue[600],
  accentForeground: colors.white,

  // Destructive
  destructive: colors.red[500],
  destructiveForeground: colors.white,

  // Border and input
  border: colors.gray[300],
  input: colors.gray[50],
  ring: colors.blue[500],

  // Text
  text: colors.blue[900],
  textSecondary: colors.gray[600],

  // Semantic
  success: colors.green[600],
  warning: colors.orange[500],
  danger: colors.red[500],
};

/**
 * Semantic color mappings for dark mode
 */
export const darkTheme = {
  // Backgrounds
  background: colors.navy[900],
  foreground: colors.gray[50],
  card: colors.navy[700],
  cardForeground: colors.gray[50],

  // Primary colors
  primary: colors.blue[400],
  primaryForeground: colors.navy[900],

  // Secondary colors
  secondary: colors.navy[700],
  secondaryForeground: colors.gray[100],

  // Muted colors
  muted: colors.navy[800],
  mutedForeground: colors.gray[400],

  // Accent colors
  accent: colors.blue[500],
  accentForeground: colors.white,

  // Destructive
  destructive: colors.red[600],
  destructiveForeground: colors.white,

  // Border and input
  border: colors.navy[600],
  input: colors.navy[800],
  ring: colors.blue[400],

  // Text
  text: colors.gray[50],
  textSecondary: colors.gray[300],

  // Semantic
  success: colors.green[500],
  warning: colors.orange[500],
  danger: colors.red[500],
};

/**
 * Spacing scale (in rem for web, multiply by 4 for RN)
 */
export const spacing = {
  0: 0,
  1: 0.25, // 4px / 1rem
  2: 0.5, // 8px / 2rem
  3: 0.75, // 12px / 3rem
  4: 1, // 16px / 4rem
  5: 1.25, // 20px / 5rem
  6: 1.5, // 24px / 6rem
  8: 2, // 32px / 8rem
  10: 2.5, // 40px / 10rem
  12: 3, // 48px / 12rem
  16: 4, // 64px / 16rem
  20: 5, // 80px / 20rem
  24: 6, // 96px / 24rem
};

/**
 * Border radius values
 */
export const radius = {
  none: 0,
  sm: 0.375, // 6px
  md: 0.5, // 8px
  lg: 0.75, // 12px
  xl: 1, // 16px
  "2xl": 1.5, // 24px
  full: 9999,
};

/**
 * Typography scale
 */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
};

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

/**
 * Shadow presets for neumorphic design
 */
export const shadows = {
  // Light mode shadows
  light: {
    sm: {
      shadowColor: "#a3b1c6",
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: "#a3b1c6",
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.55,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#a3b1c6",
      shadowOffset: { width: 8, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 6,
    },
  },
  // Dark mode shadows
  dark: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.7,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.75,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 8, height: 8 },
      shadowOpacity: 0.8,
      shadowRadius: 16,
      elevation: 6,
    },
  },
};
