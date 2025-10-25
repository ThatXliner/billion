/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import {
  Text as DefaultText,
  View as RNView,
  useColorScheme,
} from "react-native";

// import {
//   LiquidGlassView,
//   LiquidGlassContainerView,
//   isLiquidGlassSupported,
// } from "@callstack/liquid-glass";

import Colors from "~/constants/Colors";

interface ThemeProps {
  lightColor?: string;
  darkColor?: string;
}
const DefaultView = RNView;
// const DefaultView = isLiquidGlassSupported ? LiquidGlassView : RNView;
export type TextProps = ThemeProps & DefaultText["props"];
export type ViewProps = ThemeProps & React.ComponentProps<typeof DefaultView>;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light,
) {
  const colorScheme = useColorScheme();
  const theme = (colorScheme ?? "light");
  const colorFromProps = theme === "light" ? props.light : props.dark;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
  );

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
