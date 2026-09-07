/**
 * UpdateReadyMark — Billion brand mark morphs into a download glyph.
 *
 * One continuous metamorphosis driven by a single master `progress` 0→1
 * (~3.0s, inOut cubic). No discrete stage cuts: logo and download share a
 * long overlapping crossfade so the mid-morph reads as dissolving into the
 * glyph. Stroke-draw is synced to the same curve (slight stagger). Soft hold
 * near 0 and settle at 1 come from the inOut cubic itself.
 *
 * LOOP_PERIOD_MS (~5s start→start): morph → hold finished glyph → reset.
 * useReducedMotion → static final download, no loop.
 */
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { colors } from "~/styles";

export type UpdateReadyMarkProps = {
  size?: number;
  /** Accent stroke — defaults to civic blue (bill). Used for download stroke. */
  color?: string;
  /** Secondary stroke for softer structural lines (theme-aware). */
  mutedColor?: string;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const LOGO = require("../../assets/billion-logo.png");

// —— Static geometry (download) ——————————————————————————————————————————————
const DL_SHAFT = "M12 4.5L12 14";
const DL_CHEVRON = "M8.2 11L12 15.75L15.8 11";
const DL_TRAY = "M6.5 17.25L6.5 20.6L17.5 20.6L17.5 17.25";

/** Approximate path lengths for stroke-draw (viewBox units). */
const LEN_SHAFT = 9.5;
const LEN_CHEVRON = 12.2;
const LEN_TRAY = 17.7;

/** Morph length (ms). Master clock is linear; progress is eased inOut cubic. */
const TOTAL_MS = 3000;
/** Restart the mark animation this often (ms from start→start). */
const LOOP_PERIOD_MS = 5000;

/**
 * Smoothstep (Hermite) — worklet-safe, no external easing defaults.
 * Used for wide opacity / draw windows on the continuous progress curve.
 */
function smoothstep01(t: number): number {
  "worklet";
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}

/** Map progress → 0..1 inside [start, end] via smoothstep. */
function window01(progress: number, start: number, end: number): number {
  "worklet";
  if (end <= start) {
    return progress >= end ? 1 : 0;
  }
  return smoothstep01((progress - start) / (end - start));
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
        d={DL_CHEVRON}
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={DL_SHAFT}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path
        d={DL_TRAY}
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="square"
        strokeLinejoin="miter"
        opacity={1}
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
  // Linear master clock 0→1; all motion derives from one continuous curve.
  const clock = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      clock.value = 1;
      return;
    }
    clock.value = 0;
    const holdMs = Math.max(0, LOOP_PERIOD_MS - TOTAL_MS);
    clock.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: TOTAL_MS,
          // Single continuous inOut cubic — soft hold at start, settle at end.
          easing: Easing.inOut(Easing.cubic),
        }),
        // Hold the finished download glyph, then snap back for the next loop.
        withDelay(holdMs, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [reduceMotion, clock]);

  // —— Shared wrapper: one continuous scale track (no handoff discontinuity) ——
  const markStyle = useAnimatedStyle(() => {
    const p = clock.value;
    // Gentle breath early → soft mid dip → settle overshoot → rest at 1.
    const scale = interpolate(
      p,
      [0, 0.12, 0.42, 0.78, 1],
      [1, 1.06, 0.97, 1.08, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale }],
    };
  });

  // —— Logo: wide smoothstep fade + yield (scale down + slight rotate) ——
  // Opacity out: progress 0.18 → 0.62 (long dissolve)
  const logoStyle = useAnimatedStyle(() => {
    const p = clock.value;
    const fadeOut = window01(p, 0.18, 0.62);
    const morph = window01(p, 0.15, 0.7);
    const scale = interpolate(morph, [0, 1], [1, 0.78]);
    const rotate = interpolate(morph, [0, 1], [0, -10]);
    return {
      opacity: 1 - fadeOut,
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  // —— Download layer: overlapping fade-in + complementary scale/rotate ——
  // Opacity in: progress 0.28 → 0.72 (overlaps logo; mid ~0.45 both visible)
  const downloadStyle = useAnimatedStyle(() => {
    const p = clock.value;
    const fadeIn = window01(p, 0.28, 0.72);
    const morph = window01(p, 0.2, 0.78);
    const scale = interpolate(morph, [0, 1], [0.78, 1]);
    const rotate = interpolate(morph, [0, 1], [10, 0]);
    return {
      opacity: fadeIn,
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  // —— Stroke-draw synced to same progress (staggered, still overlaps fade) ——
  const shaftProps = useAnimatedProps(() => {
    const draw = window01(clock.value, 0.22, 0.55);
    return {
      strokeDashoffset: LEN_SHAFT * (1 - draw),
    };
  });

  const chevronProps = useAnimatedProps(() => {
    const draw = window01(clock.value, 0.32, 0.64);
    return {
      strokeDashoffset: LEN_CHEVRON * (1 - draw),
    };
  });

  const trayProps = useAnimatedProps(() => {
    const draw = window01(clock.value, 0.42, 0.76);
    return {
      strokeDashoffset: LEN_TRAY * (1 - draw),
      opacity: 1,
    };
  });

  if (reduceMotion) {
    return (
      <StaticDownloadMark size={size} color={color} structure={structure} />
    );
  }

  return (
    <Animated.View
      style={[{ width: size, height: size }, markStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.Image
        source={LOGO}
        style={[styles.layer, { width: size, height: size }, logoStyle]}
        resizeMode="contain"
      />
      <Animated.View
        style={[styles.layer, { width: size, height: size }, downloadStyle]}
      >
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <AnimatedPath
            d={DL_SHAFT}
            animatedProps={shaftProps}
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeDasharray={`${LEN_SHAFT}`}
          />
          <AnimatedPath
            d={DL_CHEVRON}
            animatedProps={chevronProps}
            stroke={color}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${LEN_CHEVRON}`}
          />
          <AnimatedPath
            d={DL_TRAY}
            animatedProps={trayProps}
            stroke={color}
            strokeWidth={2.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${LEN_TRAY}`}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
