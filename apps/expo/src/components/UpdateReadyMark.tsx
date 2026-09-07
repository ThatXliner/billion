/**
 * UpdateReadyMark — civic architecture monogram that morphs into a download glyph.
 *
 * Starts as column / pediment “B” architecture, then (~1.5s after a short beat)
 * interpolates SVG path `d` into an arrow-into-tray. Each path pair shares the
 * same command structure so reanimated can lerp coordinates (no flubber / Lottie).
 * Morphs once and holds download — editorial, not looping.
 * Respects useReducedMotion: shows the final download mark with no motion.
 */
import { useEffect } from "react";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { colors } from "~/styles";

export type UpdateReadyMarkProps = {
  size?: number;
  /** Accent stroke — defaults to civic blue (bill). Use sparingly as stroke only. */
  color?: string;
  /** Secondary stroke for softer structural lines (theme-aware). */
  mutedColor?: string;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

type PathMorph = {
  parts: string[];
  from: number[];
  to: number[];
  fromD: string;
};

function prepareMorph(fromD: string, toD: string): PathMorph {
  const from = (fromD.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const to = (toD.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  if (from.length !== to.length) {
    throw new Error(
      `UpdateReadyMark path morph mismatch: ${from.length} vs ${to.length}`,
    );
  }
  return {
    parts: fromD.split(/-?\d*\.?\d+/g),
    from,
    to,
    fromD,
  };
}

function mixPath(morph: PathMorph, t: number): string {
  "worklet";
  const { parts, from, to } = morph;
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  let out = parts[0] ?? "";
  for (let i = 0; i < from.length; i++) {
    const a = from[i]!;
    const b = to[i]!;
    const v = a + (b - a) * clamped;
    out += (Math.round(v * 100) / 100).toFixed(2);
    out += parts[i + 1] ?? "";
  }
  return out;
}

/** Pediment roof → download chevron (arrow head). */
const MORPH_PEDIMENT = prepareMorph(
  "M5.75 5.35L12 2.9L18.25 5.35",
  "M8.2 11L12 15.75L15.8 11",
);

/** Twin columns converge into the arrow shaft. */
const MORPH_COL_L = prepareMorph("M7.15 6.5L7.15 18.35", "M12 4.5L12 14");
const MORPH_COL_R = prepareMorph("M16.85 6.5L16.85 18.35", "M12 4.5L12 14");

/** Column bases + plinth → download tray (U). */
const MORPH_BASE_L = prepareMorph(
  "M5.5 18.95L8.8 18.95",
  "M6.5 17.25L6.5 20.6",
);
const MORPH_BASE_R = prepareMorph(
  "M15.2 18.95L18.5 18.95",
  "M17.5 17.25L17.5 20.6",
);
const MORPH_PLINTH = prepareMorph(
  "M4.5 20.55L19.5 20.55",
  "M6.5 20.6L17.5 20.6",
);

const B_OUTER =
  "M9.9 7.5V16.7H12.35C14.35 16.7 15.55 15.65 15.55 14.2C15.55 13.15 14.95 12.35 13.95 12C14.8 11.6 15.3 10.85 15.3 9.8C15.3 8.3 14.1 7.5 12.2 7.5H9.9Z";
const B_TOP =
  "M11.25 9.55H12.55C13.3 9.55 13.75 9.95 13.75 10.55C13.75 11.15 13.3 11.55 12.55 11.55H11.25";
const B_BOT =
  "M11.25 12.95H12.8C13.65 12.95 14.15 13.4 14.15 14.1C14.15 14.8 13.65 15.25 12.8 15.25H11.25";
const ENTABLATURE = "M4.5 5.85L19.5 5.85";

/** Brief hold on architecture, then a single editorial morph. */
const MORPH_DELAY_MS = 380;
const MORPH_DURATION_MS = 1500;

function useMorphPathProps(morph: PathMorph, progress: SharedValue<number>) {
  return useAnimatedProps(() => ({
    d: mixPath(morph, progress.value),
  }));
}

function StaticDownloadMark({
  size,
  color,
  structure,
}: {
  size: number;
  color: string;
  structure: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M8.2 11L12 15.75L15.8 11"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 4.5L12 14"
        stroke={color}
        strokeWidth={1.35}
        strokeLinecap="round"
      />
      <Path
        d="M6.5 17.25L6.5 20.6L17.5 20.6L17.5 17.25"
        stroke={structure}
        strokeWidth={1.15}
        strokeLinecap="square"
        strokeLinejoin="miter"
        opacity={0.85}
      />
    </Svg>
  );
}

export function UpdateReadyMark({
  size = 22,
  color = colors.bill,
  mutedColor,
}: UpdateReadyMarkProps) {
  const structure = mutedColor ?? color;
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      MORPH_DELAY_MS,
      withTiming(1, {
        duration: MORPH_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
      }),
    );
  }, [reduceMotion, progress]);

  const pedimentProps = useMorphPathProps(MORPH_PEDIMENT, progress);
  const colLProps = useMorphPathProps(MORPH_COL_L, progress);
  const colRProps = useMorphPathProps(MORPH_COL_R, progress);
  const baseLProps = useMorphPathProps(MORPH_BASE_L, progress);
  const baseRProps = useMorphPathProps(MORPH_BASE_R, progress);
  const plinthProps = useMorphPathProps(MORPH_PLINTH, progress);

  const fadeCivicProps = useAnimatedProps(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.28, 0.52],
      [1, 0.45, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const fadeCivicSoftProps = useAnimatedProps(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.22, 0.48],
      [0.85, 0.35, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const fadeEntablatureProps = useAnimatedProps(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.18, 0.4],
      [0.5, 0.2, 0],
      Extrapolation.CLAMP,
    ),
  }));

  if (reduceMotion) {
    return (
      <StaticDownloadMark size={size} color={color} structure={structure} />
    );
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Pediment → arrow head (civic blue) */}
      <AnimatedPath
        d={MORPH_PEDIMENT.fromD}
        animatedProps={pedimentProps}
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Entablature — dissolves as the roof becomes the chevron */}
      <AnimatedPath
        d={ENTABLATURE}
        animatedProps={fadeEntablatureProps}
        stroke={structure}
        strokeWidth={1.1}
        strokeLinecap="square"
      />

      {/* Twin columns → stacked shaft (reads as one bold stem) */}
      <AnimatedPath
        d={MORPH_COL_L.fromD}
        animatedProps={colLProps}
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
      <AnimatedPath
        d={MORPH_COL_R.fromD}
        animatedProps={colRProps}
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
      />

      {/* Bases + plinth → tray (muted structure) */}
      <AnimatedPath
        d={MORPH_BASE_L.fromD}
        animatedProps={baseLProps}
        stroke={structure}
        strokeWidth={1.15}
        strokeLinecap="square"
      />
      <AnimatedPath
        d={MORPH_BASE_R.fromD}
        animatedProps={baseRProps}
        stroke={structure}
        strokeWidth={1.15}
        strokeLinecap="square"
      />
      <AnimatedPath
        d={MORPH_PLINTH.fromD}
        animatedProps={plinthProps}
        stroke={structure}
        strokeWidth={1.15}
        strokeLinecap="square"
      />

      {/* Geometric “B” — holds, then yields to the download glyph */}
      <AnimatedPath
        d={B_OUTER}
        animatedProps={fadeCivicProps}
        stroke={color}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <AnimatedPath
        d={B_TOP}
        animatedProps={fadeCivicSoftProps}
        stroke={color}
        strokeWidth={1.05}
        strokeLinecap="round"
      />
      <AnimatedPath
        d={B_BOT}
        animatedProps={fadeCivicSoftProps}
        stroke={color}
        strokeWidth={1.05}
        strokeLinecap="round"
      />
    </Svg>
  );
}
