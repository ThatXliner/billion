/**
 * UpdateReadyMark — hand-crafted SVG for the OTA update banner.
 * Civic-blue download spark: tray + arrow + spark accents (not a Feather tile).
 */
import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "~/styles";

export type UpdateReadyMarkProps = {
  size?: number;
  /** Accent stroke/fill — defaults to civic blue (bill). */
  color?: string;
};

export function UpdateReadyMark({
  size = 22,
  color = colors.bill,
}: UpdateReadyMarkProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Soft civic disc — grounds the mark without a generic icon tile */}
      <Circle cx="12" cy="12" r="10.25" stroke={color} strokeWidth={1.25} opacity={0.35} />

      {/* Download tray */}
      <Path
        d="M7.25 15.75h9.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M8.4 17.35h7.2"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.55}
      />

      {/* Arrow shaft + head */}
      <Path
        d="M12 6.4v8.1"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path
        d="M8.85 11.55 12 14.85l3.15-3.3"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Freshness sparks — Billion “new” cue */}
      <Path
        d="M17.6 5.2v2.4M16.4 6.4h2.4"
        stroke={color}
        strokeWidth={1.35}
        strokeLinecap="round"
        opacity={0.9}
      />
      <Circle cx="6.35" cy="7.1" r="0.95" fill={color} opacity={0.75} />
    </Svg>
  );
}
