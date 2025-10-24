const tintColorLight = "#3b82f6";
const tintColorDark = "#60a5fa";

// Full color palette based on your current design
const colors = {
  // Blues
  blue300: "#93c5fd",
  blue500: "#3b82f6",
  blue600: "#2563eb",
  blue700: "#007AFF",

  // Grays
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray600: "#4b5563",
  gray800: "#1f2937",

  // Greens
  green600: "#16a34a",

  // Oranges
  orange500: "#f97316",

  // Pinks
  pink200: "#fbcfe8",
  pink500: "#ec4899",

  // Reds
  red500: "#ef4444",
  red600: "#dc2626",

  // Whites and blacks
  white: "#ffffff",
  black: "#000000",
};

export default {
  light: {
    text: colors.black,
    background: colors.white,
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,

    // Semantic colors
    primary: colors.blue500,
    secondary: colors.gray600,
    success: colors.green600,
    warning: colors.orange500,
    danger: colors.red500,

    // UI colors
    cardBackground: colors.white,
    border: colors.gray200,
    muted: colors.gray100,
    textPrimary: colors.gray800,
    textSecondary: colors.gray600,
  },
  dark: {
    text: colors.white,
    background: colors.black,
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,

    // Semantic colors
    primary: tintColorDark,
    secondary: colors.gray200,
    success: colors.green600,
    warning: colors.orange500,
    danger: colors.red500,

    // UI colors
    cardBackground: "#1f2937",
    border: "#374151",
    muted: "#111827",
    textPrimary: colors.white,
    textSecondary: colors.gray200,
  },
};

// Export raw colors for direct use
export { colors };
