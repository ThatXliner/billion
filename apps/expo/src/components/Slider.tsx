import * as React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import Slider from "@react-native-community/slider";
import { darkTheme, lightTheme } from "@acme/ui/theme-tokens";

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
  style?: any;
}

export function SliderComponent({
  min = 0,
  max = 100,
  step = 1,
  value = 0,
  onValueChange,
  disabled = false,
  style,
}: SliderProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <View style={[styles.container, style]}>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.primary}
        style={styles.slider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  slider: {
    width: "100%",
    height: 40,
  },
});
