/**
 * UpdateReadyMark — Billion B monogram that morphs into a download glyph.
 *
 * Custom stroke SVG of the real brand mark (twin-column stem, upper crescent,
 * four-point waist spark, diagonal lower hatches, diagonal baseline). Path `d`
 * pairs share command structure so reanimated can lerp coordinates via
 * prepareMorph / mixPath (same technique as 4734929). Decorative bits (spark,
 * mid hatch) opacity-fade mid-morph. No PNG / Animated.Image.
 *
 * Timing: hold B ~400ms → morph ~2.0s inOut cubic → hold download; gentle
 * loop every ~5s. useReducedMotion → static final download.
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
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { colors } from "~/styles";

export type UpdateReadyMarkProps = {
  size?: number;
  /** Accent stroke — defaults to civic blue (bill). */
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
      `UpdateReadyMark path morph mismatch: ${from.length} vs ${to.length} (${fromD} → ${toD})`,
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

// —— Billion B (logo) → download glyph path pairs ————————————————————————————
// Twin-column stem → arrow shaft (both converge on center).
const MORPH_STEM_L = prepareMorph("M6.72 3.45L6.72 18.25", "M12 4.5L12 14");
const MORPH_STEM_R = prepareMorph("M8.88 2.95L8.88 17.05", "M12 4.5L12 14");

// Upper crescent bowl (5-pt medial) → download chevron (5-pt).
const MORPH_CRESCENT = prepareMorph(
  "M10.55 3.05L14.10 3.50L16.95 5.70L16.75 8.35L13.15 10.15",
  "M8.20 11.00L10.10 13.00L12.00 15.75L13.90 13.00L15.80 11.00",
);

// Outer hatches → tray side walls; baseline → tray floor.
const MORPH_HATCH_T = prepareMorph(
  "M10.25 17.85L15.55 14.15",
  "M6.50 17.25L6.50 20.60",
);
const MORPH_HATCH_B = prepareMorph(
  "M12.70 19.25L18.05 15.55",
  "M17.50 17.25L17.50 20.60",
);
const MORPH_BASE = prepareMorph("M5.30 21.55L14.60 18.20", "M6.50 20.60L17.50 20.60");

/** Mid hatch — fades (no download counterpart with matching structure). */
const HATCH_MID = "M11.40 18.55L16.75 14.85";

/** Four-point waist spark — shrinks/fades early. */
const SPARK =
  "M12.35 9.15L12.82 10.48L14.15 10.95L12.82 11.42L12.35 12.75L11.88 11.42L10.55 10.95L11.88 10.48Z";

const HOLD_MS = 400;
const MORPH_MS = 2000;
const LOOP_PERIOD_MS = 5000;

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
        d="M8.20 11.00L10.10 13.00L12.00 15.75L13.90 13.00L15.80 11.00"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 4.5L12 14"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Path
        d="M6.50 17.25L6.50 20.60"
        stroke={structure}
        strokeWidth={1.65}
        strokeLinecap="square"
      />
      <Path
        d="M17.50 17.25L17.50 20.60"
        stroke={structure}
        strokeWidth={1.65}
        strokeLinecap="square"
      />
      <Path
        d="M6.50 20.60L17.50 20.60"
        stroke={structure}
        strokeWidth={1.65}
        strokeLinecap="square"
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
    const holdAfter = Math.max(0, LOOP_PERIOD_MS - HOLD_MS - MORPH_MS);
    progress.value = withRepeat(
      withSequence(
        withDelay(
          HOLD_MS,
          withTiming(1, {
            duration: MORPH_MS,
            easing: Easing.inOut(Easing.cubic),
          }),
        ),
        withDelay(holdAfter, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [reduceMotion, progress]);

  const crescentProps = useMorphPathProps(MORPH_CRESCENT, progress);
  const hatchTProps = useMorphPathProps(MORPH_HATCH_T, progress);
  const hatchBProps = useMorphPathProps(MORPH_HATCH_B, progress);
  const baseProps = useMorphPathProps(MORPH_BASE, progress);

  // Spark exits early so the waist clears for the chevron.
  const sparkProps = useAnimatedProps(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.12, 0.32],
      [1, 0.55, 0],
      Extrapolation.CLAMP,
    ),
  }));

  // Mid hatch dissolves as outer hatches become tray walls.
  const hatchMidProps = useAnimatedProps(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.2, 0.48],
      [1, 0.4, 0],
      Extrapolation.CLAMP,
    ),
  }));

  // Stem weight eases from twin columns toward a single bold shaft.
  const stemLWidthProps = useAnimatedProps(() => ({
    d: mixPath(MORPH_STEM_L, progress.value),
    strokeWidth: interpolate(
      progress.value,
      [0, 1],
      [1.7, 1.9],
      Extrapolation.CLAMP,
    ),
  }));
  const stemRWidthProps = useAnimatedProps(() => ({
    d: mixPath(MORPH_STEM_R, progress.value),
    strokeWidth: interpolate(
      progress.value,
      [0, 0.45, 1],
      [1.1, 1.5, 1.9],
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
      {/* Upper crescent → chevron */}
      <AnimatedPath
        d={MORPH_CRESCENT.fromD}
        animatedProps={crescentProps}
        stroke={color}
        strokeWidth={1.55}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Twin stem → shaft */}
      <AnimatedPath
        d={MORPH_STEM_L.fromD}
        animatedProps={stemLWidthProps}
        stroke={color}
        strokeLinecap="round"
      />
      <AnimatedPath
        d={MORPH_STEM_R.fromD}
        animatedProps={stemRWidthProps}
        stroke={color}
        strokeLinecap="round"
      />

      {/* Four-point spark — fades early */}
      <AnimatedPath
        d={SPARK}
        animatedProps={sparkProps}
        stroke={color}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />

      {/* Outer hatches → tray walls */}
      <AnimatedPath
        d={MORPH_HATCH_T.fromD}
        animatedProps={hatchTProps}
        stroke={structure}
        strokeWidth={1.5}
        strokeLinecap="square"
      />
      <AnimatedPath
        d={MORPH_HATCH_B.fromD}
        animatedProps={hatchBProps}
        stroke={structure}
        strokeWidth={1.5}
        strokeLinecap="square"
      />

      {/* Mid hatch — fades */}
      <AnimatedPath
        d={HATCH_MID}
        animatedProps={hatchMidProps}
        stroke={structure}
        strokeWidth={1.45}
        strokeLinecap="butt"
      />

      {/* Baseline → tray floor */}
      <AnimatedPath
        d={MORPH_BASE.fromD}
        animatedProps={baseProps}
        stroke={structure}
        strokeWidth={1.5}
        strokeLinecap="square"
      />
    </Svg>
  );
}
