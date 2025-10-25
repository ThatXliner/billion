/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import {
  Text as DefaultText,
  View as RNView,
  useColorScheme,
} from "react-native";

import { darkTheme, lightTheme } from "@acme/ui/theme-tokens";

interface ThemeProps {
  lightColor?: string;
  darkColor?: string;
}
const DefaultView = RNView;
export type TextProps = ThemeProps & DefaultText["props"];
export type ViewProps = ThemeProps & React.ComponentProps<typeof DefaultView>;

type ThemeColorKey = keyof typeof lightTheme;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorKey,
) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;
  const colorFromProps = colorScheme === "dark" ? props.dark : props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return theme[colorName];
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
