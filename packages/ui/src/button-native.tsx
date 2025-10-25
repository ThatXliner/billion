/**
 * React Native Button component with neumorphic styling
 * Shared component for Expo app
 */
import type { PressableProps, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";

import {
  colors,
  darkTheme,
  fontSize,
  fontWeight,
  lightTheme,
  radius,
  shadows,
  spacing,
} from "./theme-tokens";

export type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
export type ButtonSize = "sm" | "default" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  variant = "default",
  size = "default",
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;
  const shadowTheme = colorScheme === "dark" ? shadows.dark : shadows.light;

  const getVariantStyles = (pressed: boolean): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: radius.md * 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: {
        paddingHorizontal: spacing[3] * 16,
        paddingVertical: spacing[2] * 16,
      },
      default: {
        paddingHorizontal: spacing[4] * 16,
        paddingVertical: spacing[2] * 16 + 1,
      },
      lg: {
        paddingHorizontal: spacing[6] * 16,
        paddingVertical: spacing[2] * 16 + 2,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      default: {
        backgroundColor: theme.primary,
        ...(pressed
          ? {}
          : {
              ...shadowTheme.sm,
            }),
      },
      secondary: {
        backgroundColor: theme.secondary,
        ...(pressed
          ? {}
          : {
              ...shadowTheme.sm,
            }),
      },
      outline: {
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
        ...(pressed
          ? {}
          : {
              ...shadowTheme.sm,
            }),
      },
      ghost: {
        backgroundColor: pressed ? theme.accent + "20" : "transparent",
      },
      destructive: {
        backgroundColor: theme.destructive,
        ...(pressed
          ? {}
          : {
              ...shadowTheme.sm,
            }),
      },
    };

    const pressedStyle: ViewStyle = pressed
      ? {
          transform: [{ scale: 0.98 }],
          opacity: 0.9,
        }
      : {};

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...pressedStyle,
    };
  };

  const getTextColor = (): string => {
    switch (variant) {
      case "default":
        return theme.primaryForeground;
      case "destructive":
        return theme.destructiveForeground;
      case "secondary":
        return theme.secondaryForeground;
      case "outline":
        return theme.foreground;
      case "ghost":
        return theme.accent;
      default:
        return theme.foreground;
    }
  };

  const textSize = {
    sm: fontSize.sm,
    default: fontSize.sm,
    lg: fontSize.base,
  }[size];

  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        getVariantStyles(pressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      {({ pressed }) => (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: textSize,
            },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
