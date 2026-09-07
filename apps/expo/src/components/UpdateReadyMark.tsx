/**
 * UpdateReadyMark — Billion brand mark dissolves into a download glyph.
 *
 * Choreography (~2.4s), then holds and replays every LOOP_PERIOD_MS (~5s
 * from start to start):
 *  1. Beat     (0.00–0.45s)  Real logo holds; soft breath scale.
 *  2. Collapse (0.45–1.10s)  Logo fades + slight scale-out.
 *  3. Reveal   (1.00–2.00s)  Download paths stroke-draw: shaft → chevron → tray.
 *  4. Settle   (2.00–2.40s)  Subtle overshoot scale on the finished mark, then
 *                            hold until the next loop.
 *
 * Stages overlap slightly. Master clock is linear; each stage eases locally
 * (cubic out / smoothstep) so mid-frames stay legible. useReducedMotion →
 * static final download, no stages / no loop.
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

/** Total choreography length (ms). Master clock is linear 0→1 over this. */
const TOTAL_MS = 2400;
/** Restart the mark animation this often (ms from start→start). */
const LOOP_PERIOD_MS = 5000;

/**
 * Stage windows as fractions of TOTAL_MS.
 * Slight overlaps keep the logo→download handoff fluid.
 */
const T = {
  beatEnd: 0.45 / 2.4,
  collapseEnd: 1.1 / 2.4,
  revealStart: 1.0 / 2.4,
  shaftEnd: 1.45 / 2.4,
  chevronStart: 1.3 / 2.4,
  chevronEnd: 1.75 / 2.4,
  trayStart: 1.55 / 2.4,
  trayEnd: 2.0 / 2.4,
  settleEnd: 1,
} as const;

type EaseKind = "outCubic" | "inOutCubic" | "outQuad";

/** Map clock → eased 0..1 within [start, end]. Easing resolved inside the worklet. */
function stageProgress(
  clock: number,
  start: number,
  end: number,
  easeKind: EaseKind = "outCubic",
): number {
  "worklet";
  const raw = interpolate(clock, [start, end], [0, 1], Extrapolation.CLAMP);
  if (easeKind === "inOutCubic") {
    return Easing.inOut(Easing.cubic)(raw);
  }
  if (easeKind === "outQuad") {
    return Easing.out(Easing.quad)(raw);
  }
  return Easing.out(Easing.cubic)(raw);
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
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={DL_SHAFT}
        stroke={color}
        strokeWidth={1.35}
        strokeLinecap="round"
      />
      <Path
        d={DL_TRAY}
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
          easing: Easing.linear,
        }),
        // Hold the finished download glyph, then snap back for the next beat.
        withDelay(holdMs, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [reduceMotion, clock]);

  // —— Overall breath + settle scale (View wrapper; reliable at ~36px) ——
  const markStyle = useAnimatedStyle(() => {
    const breathT = stageProgress(
      clock.value,
      0,
      T.beatEnd,
      "inOutCubic",
    );
    // 0→0.5→1 maps to 1→1.04→1
    const breath =
      breathT <= 0.5
        ? interpolate(breathT, [0, 0.5], [1, 1.04])
        : interpolate(breathT, [0.5, 1], [1.04, 1]);

    const settleT = stageProgress(
      clock.value,
      T.trayEnd,
      T.settleEnd,
      "outCubic",
    );
    const settle =
      settleT <= 0.4
        ? interpolate(settleT, [0, 0.4], [1, 1.055])
        : interpolate(settleT, [0.4, 1], [1.055, 1]);

    const scale = clock.value >= T.trayEnd ? settle : breath;
    return {
      transform: [{ scale }],
    };
  });

  // —— Real logo: hold during beat, clean exit (opacity + scale) ——
  const logoStyle = useAnimatedStyle(() => {
    const fade = stageProgress(
      clock.value,
      T.beatEnd,
      T.collapseEnd * 0.88,
      "outCubic",
    );
    const scale = interpolate(fade, [0, 1], [1, 0.88]);
    return {
      opacity: 1 - fade,
      transform: [{ scale }],
    };
  });

  // —— Download stroke-draw (clean static paths) ——————————————
  const shaftProps = useAnimatedProps(() => {
    const p = stageProgress(
      clock.value,
      T.revealStart,
      T.shaftEnd,
      "outCubic",
    );
    const appear = stageProgress(
      clock.value,
      T.revealStart - 0.02,
      T.revealStart,
      "outQuad",
    );
    return {
      strokeDashoffset: LEN_SHAFT * (1 - p),
      opacity: appear,
    };
  });

  const chevronProps = useAnimatedProps(() => {
    const p = stageProgress(
      clock.value,
      T.chevronStart,
      T.chevronEnd,
      "outCubic",
    );
    const appear = stageProgress(
      clock.value,
      T.chevronStart - 0.02,
      T.chevronStart,
      "outQuad",
    );
    return {
      strokeDashoffset: LEN_CHEVRON * (1 - p),
      opacity: appear,
    };
  });

  const trayProps = useAnimatedProps(() => {
    const p = stageProgress(
      clock.value,
      T.trayStart,
      T.trayEnd,
      "outCubic",
    );
    const appear = stageProgress(
      clock.value,
      T.trayStart - 0.02,
      T.trayStart,
      "outQuad",
    );
    return {
      strokeDashoffset: LEN_TRAY * (1 - p),
      opacity: 0.85 * appear,
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
        style={[styles.logo, { width: size, height: size }, logoStyle]}
        resizeMode="contain"
      />
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={styles.download}
      >
        <AnimatedPath
          d={DL_SHAFT}
          animatedProps={shaftProps}
          stroke={color}
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeDasharray={`${LEN_SHAFT}`}
        />
        <AnimatedPath
          d={DL_CHEVRON}
          animatedProps={chevronProps}
          stroke={color}
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${LEN_CHEVRON}`}
        />
        <AnimatedPath
          d={DL_TRAY}
          animatedProps={trayProps}
          stroke={structure}
          strokeWidth={1.15}
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeDasharray={`${LEN_TRAY}`}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logo: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  download: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
