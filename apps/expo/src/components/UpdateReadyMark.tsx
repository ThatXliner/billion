/**
 * UpdateReadyMark — civic architecture monogram for the OTA gazette banner.
 * Column / pillar geometry with a refined “B” — stroke-only, theme-aware.
 * Not a download tray or sparkle glyph.
 */
import Svg, { Path, Rect } from "react-native-svg";

import { colors } from "~/styles";

export type UpdateReadyMarkProps = {
  size?: number;
  /** Accent stroke — defaults to civic blue (bill). Use sparingly as stroke only. */
  color?: string;
  /** Secondary stroke for softer structural lines (theme-aware). */
  mutedColor?: string;
};

export function UpdateReadyMark({
  size = 22,
  color = colors.bill,
  mutedColor,
}: UpdateReadyMarkProps) {
  const structure = mutedColor ?? color;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Pediment — library / civic roof line */}
      <Path
        d="M5.75 5.35L12 2.9L18.25 5.35"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.5 5.85H19.5"
        stroke={structure}
        strokeWidth={1.1}
        strokeLinecap="square"
        opacity={0.5}
      />

      {/* Twin columns */}
      <Rect
        x="6.4"
        y="6.4"
        width="1.5"
        height="12.2"
        stroke={structure}
        strokeWidth={1.1}
        opacity={0.72}
      />
      <Rect
        x="16.1"
        y="6.4"
        width="1.5"
        height="12.2"
        stroke={structure}
        strokeWidth={1.1}
        opacity={0.72}
      />

      {/* Column bases */}
      <Path
        d="M5.5 18.95H8.8M15.2 18.95H18.5"
        stroke={structure}
        strokeWidth={1.15}
        strokeLinecap="square"
        opacity={0.55}
      />

      {/* Geometric “B” monogram between pillars */}
      <Path
        d="M9.9 7.5V16.7H12.35C14.35 16.7 15.55 15.65 15.55 14.2C15.55 13.15 14.95 12.35 13.95 12C14.8 11.6 15.3 10.85 15.3 9.8C15.3 8.3 14.1 7.5 12.2 7.5H9.9Z"
        stroke={color}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Path
        d="M11.25 9.55H12.55C13.3 9.55 13.75 9.95 13.75 10.55C13.75 11.15 13.3 11.55 12.55 11.55H11.25"
        stroke={color}
        strokeWidth={1.05}
        strokeLinecap="round"
        opacity={0.85}
      />
      <Path
        d="M11.25 12.95H12.8C13.65 12.95 14.15 13.4 14.15 14.1C14.15 14.8 13.65 15.25 12.8 15.25H11.25"
        stroke={color}
        strokeWidth={1.05}
        strokeLinecap="round"
        opacity={0.85}
      />

      {/* Plinth rule */}
      <Path
        d="M4.5 20.55H19.5"
        stroke={structure}
        strokeWidth={1.1}
        strokeLinecap="square"
        opacity={0.4}
      />
    </Svg>
  );
}
