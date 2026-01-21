/**
 * Shared theme tokens for both web and React Native
 * "Deep State Modern" - Futuristic Civic Tech Aesthetic
 */

export const colors = {
  // Deep Indigo - Primary brand color (from poster)
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#1a1a40", // Deep indigo base
    950: "#0f0f28", // Deepest indigo
  },

  // Purple - Gradient accent (from poster globe)
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7928ca", // Vibrant purple
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764",
  },

  // Cyan/Electric Blue - Neon accents (from poster)
  cyan: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
  },

  // Lavender - Secondary text
  lavender: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c4b5fd",
    500: "#b0b0d1", // Light lavender for secondary text
    600: "#9990c2",
    700: "#8b80b8",
    800: "#7a6fa8",
    900: "#5a4f80",
  },

  // Dark Navy - For cards and surfaces
  navy: {
    50: "#e0e7f1",
    100: "#b3c5db",
    200: "#7fa0c3",
    300: "#4b7aaa",
    400: "#3d5a80",
    500: "#2d2d6b", // Medium indigo for cards
    600: "#252560",
    700: "#1e1e4f", // Dark glass cards
    800: "#14143d",
    900: "#0f0f2a", // Near-black navy
  },

  // Neutrals with purple tint
  gray: {
    50: "#fafafb",
    100: "#f4f4f6",
    200: "#e4e4e7",
    300: "#d1d1d6",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
  },

  // Semantic colors (keeping functional colors)
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
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
  },

  // Base colors
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",

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
    900: "#112e51",
  }, // Deep navy
};

/**
 * Semantic color mappings for light mode
 * NOTE: App is designed primarily for dark mode
 */
export const lightTheme = {
  // Backgrounds - Light gradient base
  background: colors.indigo[50],
  foreground: colors.indigo[900],
  card: colors.white,
  cardForeground: colors.indigo[900],

  // Primary colors - Purple/Indigo gradient
  primary: colors.purple[600],
  primaryForeground: colors.white,

  // Secondary colors
  secondary: colors.indigo[100],
  secondaryForeground: colors.indigo[900],

  // Muted colors
  muted: colors.gray[100],
  mutedForeground: colors.lavender[700],

  // Accent colors - Electric cyan
  accent: colors.cyan[500],
  accentForeground: colors.white,

  // Destructive
  destructive: colors.red[500],
  destructiveForeground: colors.white,

  // Border and input - Glassmorphism
  border: colors.indigo[200],
  input: colors.white,
  ring: colors.purple[500],

  // Text
  text: colors.indigo[900],
  textSecondary: colors.lavender[700],

  // Semantic
  success: colors.green[600],
  warning: colors.orange[500],
  danger: colors.red[500],
};

/**
 * Semantic color mappings for dark mode
 * "Deep State Modern" - Primary theme
 */
export const darkTheme = {
  // Backgrounds - Deep indigo gradient
  background: colors.indigo[900], // #1a1a40 deep indigo
  foreground: colors.white,
  card: colors.navy[700], // Dark glass cards
  cardForeground: colors.white,

  // Primary colors - Purple/Indigo gradient
  primary: colors.purple[600],
  primaryForeground: colors.white,

  // Secondary colors - Dark glass surfaces
  secondary: colors.navy[600],
  secondaryForeground: colors.white,

  // Muted colors
  muted: colors.navy[800],
  mutedForeground: colors.lavender[500],

  // Accent colors - Electric cyan
  accent: colors.cyan[400],
  accentForeground: colors.indigo[900],

  // Destructive
  destructive: colors.red[500],
  destructiveForeground: colors.white,

  // Border and input - Thin cyan/white strokes
  border: colors.cyan[800],
  input: colors.navy[800],
  ring: colors.cyan[400],

  // Text - White primary, Lavender secondary
  text: colors.white,
  textSecondary: colors.lavender[500], // #b0b0d1

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
