import * as React from "react";
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from "react-native";
import { SliderComponent } from "./Slider";
import { darkTheme, lightTheme, spacing, fontSize, fontWeight, radius } from "@acme/ui/theme-tokens";

export interface ArticleDepthControlProps {
  value: 1 | 2 | 3 | 4 | 5;
  onValueChange: (value: 1 | 2 | 3 | 4 | 5) => void;
  isGenerating?: boolean;
  isCached?: boolean;
  style?: any;
}

const DEPTH_LABELS = {
  1: "Brief",
  2: "Summary",
  3: "Standard",
  4: "Detailed",
  5: "Expert",
} as const;

const DEPTH_DESCRIPTIONS = {
  1: "Quick overview (100-200 words)",
  2: "Essential facts (300-400 words)",
  3: "Balanced coverage (500-700 words)",
  4: "Comprehensive (800-1000 words)",
  5: "In-depth analysis (1200+ words)",
} as const;

export function ArticleDepthControl({
  value,
  onValueChange,
  isGenerating = false,
  isCached = false,
  style,
}: ArticleDepthControlProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }, style]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.foreground }]}>
            Article Depth: {DEPTH_LABELS[value]}
          </Text>
          <Text style={[styles.description, { color: theme.secondaryForeground }]}>
            {DEPTH_DESCRIPTIONS[value]}
          </Text>
        </View>
        {isGenerating && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.statusText, { color: theme.primary }]}>
              Generating...
            </Text>
          </View>
        )}
        {isCached && !isGenerating && (
          <Text style={[styles.statusText, { color: "#10b981" }]}>
            ✓ Cached
          </Text>
        )}
      </View>

      <View style={styles.sliderContainer}>
        <SliderComponent
          min={1}
          max={5}
          step={1}
          value={value}
          onValueChange={(val) => onValueChange(Math.round(val) as 1 | 2 | 3 | 4 | 5)}
          disabled={isGenerating}
          style={styles.slider}
        />
        <View style={styles.labels}>
          <Text style={[styles.label, { color: theme.secondaryForeground }]}>Brief</Text>
          <Text style={[styles.label, { color: theme.secondaryForeground }]}>Summary</Text>
          <Text style={[styles.label, { color: theme.secondaryForeground }]}>Standard</Text>
          <Text style={[styles.label, { color: theme.secondaryForeground }]}>Detailed</Text>
          <Text style={[styles.label, { color: theme.secondaryForeground }]}>Expert</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4] * 16,
    borderRadius: radius.lg * 16,
    borderWidth: 1,
    gap: spacing[4] * 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  description: {
    fontSize: fontSize.sm,
    marginTop: spacing[1] * 16,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2] * 16,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  sliderContainer: {
    gap: spacing[2] * 16,
  },
  slider: {
    width: "100%",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[1] * 16,
  },
  label: {
    fontSize: fontSize.xs,
  },
});
