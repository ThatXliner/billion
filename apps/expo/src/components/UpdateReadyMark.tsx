/**
 * UpdateReadyMark — civic architecture that dissolves into a download glyph.
 *
 * Choreography (~2.4s, no path-coordinate lerp), then holds and replays
 * every LOOP_PERIOD_MS (~5s from start to start):
 *  1. Beat     (0.00–0.45s)  Hold clear columns + pediment + B; soft breath scale.
 *  2. Collapse (0.45–1.10s)  Twin columns translate inward as readable architecture;
 *                            pediment settles; B exits (opacity + scale).
 *  3. Reveal   (1.00–2.00s)  Static download paths stroke-draw: shaft → chevron → tray.
 *  4. Settle   (2.00–2.40s)  Subtle overshoot scale on the finished mark, then hold
 *                            until the next loop.
 *
 * Stages overlap slightly. Master clock is linear; each stage eases locally
 * (cubic out / smoothstep) so mid-frames stay legible. useReducedMotion →
 * static final download, no stages / no loop.
 */
import { useEffect } from "react";
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
import Svg, { G, Path } from "react-native-svg";

import { colors } from "~/styles";

export type UpdateReadyMarkProps = {
  size?: number;
  /** Accent stroke — defaults to civic blue (bill). Use sparingly as stroke only. */
  color?: string;
  /** Secondary stroke for softer structural lines (theme-aware). */
  mutedColor?: string;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// —— Static geometry (civic) ————————————————————————————————————————————————
const PEDIMENT = "M5.75 5.35L12 2.9L18.25 5.35";
const ENTABLATURE = "M4.5 5.85L19.5 5.85";
const COL_L = "M7.15 6.5L7.15 18.35";
const COL_R = "M16.85 6.5L16.85 18.35";
const BASE_L = "M5.5 18.95L8.8 18.95";
const BASE_R = "M15.2 18.95L18.5 18.95";
const PLINTH = "M4.5 20.55L19.5 20.55";
const B_OUTER =
  "M9.9 7.5V16.7H12.35C14.35 16.7 15.55 15.65 15.55 14.2C15.55 13.15 14.95 12.35 13.95 12C14.8 11.6 15.3 10.85 15.3 9.8C15.3 8.3 14.1 7.5 12.2 7.5H9.9Z";
const B_TOP =
  "M11.25 9.55H12.55C13.3 9.55 13.75 9.95 13.75 10.55C13.75 11.15 13.3 11.55 12.55 11.55H11.25";
const B_BOT =
  "M11.25 12.95H12.8C13.65 12.95 14.15 13.4 14.15 14.1C14.15 14.8 13.65 15.25 12.8 15.25H11.25";

// —— Static geometry (download) ——————————————————————————————————————————————
const DL_SHAFT = "M12 4.5L12 14";
const DL_CHEVRON = "M8.2 11L12 15.75L15.8 11";
const DL_TRAY = "M6.5 17.25L6.5 20.6L17.5 20.6L17.5 17.25";

/** Approximate path lengths for stroke-draw (viewBox units). */
const LEN_SHAFT = 9.5;
const LEN_CHEVRON = 12.2;
const LEN_TRAY = 17.7;

/** Column → center travel (partial — dissolve before they fully meet). */
const COL_INSET = 3.6;

/** Total choreography length (ms). Master clock is linear 0→1 over this. */
const TOTAL_MS = 2400;
/** Restart the mark animation this often (ms from start→start). */
const LOOP_PERIOD_MS = 5000;

/**
 * Stage windows as fractions of TOTAL_MS.
 * Slight overlaps keep the civic→download handoff fluid.
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

  // —— Collapse: columns translate inward (groups, not path lerp) ————
  const colLProps = useAnimatedProps(() => {
    const p = stageProgress(clock.value, T.beatEnd, T.collapseEnd);
    const fade = stageProgress(
      clock.value,
      T.beatEnd + (T.collapseEnd - T.beatEnd) * 0.55,
      T.collapseEnd,
      "outQuad",
    );
    return {
      opacity: 1 - fade,
      transform: [{ translateX: p * COL_INSET }],
    };
  });

  const colRProps = useAnimatedProps(() => {
    const p = stageProgress(clock.value, T.beatEnd, T.collapseEnd);
    const fade = stageProgress(
      clock.value,
      T.beatEnd + (T.collapseEnd - T.beatEnd) * 0.55,
      T.collapseEnd,
      "outQuad",
    );
    return {
      opacity: 1 - fade,
      transform: [{ translateX: -p * COL_INSET }],
    };
  });

  // —— Pediment settles down, then dissolves ————————————————
  const roofProps = useAnimatedProps(() => {
    const p = stageProgress(clock.value, T.beatEnd, T.collapseEnd);
    const fade = stageProgress(
      clock.value,
      T.beatEnd + (T.collapseEnd - T.beatEnd) * 0.35,
      T.collapseEnd,
      "outQuad",
    );
    return {
      opacity: 1 - fade,
      transform: [{ translateY: p * 1.4 }],
    };
  });

  const entablatureProps = useAnimatedProps(() => {
    const fade = stageProgress(
      clock.value,
      T.beatEnd,
      T.collapseEnd * 0.9,
      "outQuad",
    );
    return { opacity: 0.5 * (1 - fade) };
  });

  // —— Bases + plinth: slight inward crush, then fade ————————
  const baseLProps = useAnimatedProps(() => {
    const p = stageProgress(clock.value, T.beatEnd, T.collapseEnd);
    const fade = stageProgress(
      clock.value,
      T.beatEnd + (T.collapseEnd - T.beatEnd) * 0.45,
      T.collapseEnd,
      "outQuad",
    );
    return {
      opacity: 1 - fade,
      transform: [{ translateX: p * 2.2 }],
    };
  });

  const baseRProps = useAnimatedProps(() => {
    const p = stageProgress(clock.value, T.beatEnd, T.collapseEnd);
    const fade = stageProgress(
      clock.value,
      T.beatEnd + (T.collapseEnd - T.beatEnd) * 0.45,
      T.collapseEnd,
      "outQuad",
    );
    return {
      opacity: 1 - fade,
      transform: [{ translateX: -p * 2.2 }],
    };
  });

  const plinthProps = useAnimatedProps(() => {
    const fade = stageProgress(
      clock.value,
      T.beatEnd + (T.collapseEnd - T.beatEnd) * 0.4,
      T.collapseEnd,
      "outQuad",
    );
    return { opacity: 1 - fade };
  });

  // —— B monogram: clean exit (opacity + scale about center) ——
  const bGroupProps = useAnimatedProps(() => {
    const fade = stageProgress(
      clock.value,
      T.beatEnd,
      T.collapseEnd * 0.88,
      "outCubic",
    );
    const scale = interpolate(fade, [0, 1], [1, 0.88]);
    return {
      opacity: 1 - fade,
      transform: [
        { translateX: 12 },
        { translateY: 12 },
        { scale },
        { translateX: -12 },
        { translateY: -12 },
      ],
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
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Civic layer — collapses via translate/opacity, never path-lerps */}
        <AnimatedG animatedProps={roofProps}>
          <Path
            d={PEDIMENT}
            stroke={color}
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </AnimatedG>

        <AnimatedPath
          d={ENTABLATURE}
          animatedProps={entablatureProps}
          stroke={structure}
          strokeWidth={1.1}
          strokeLinecap="square"
        />

        <AnimatedG animatedProps={colLProps}>
          <Path
            d={COL_L}
            stroke={color}
            strokeWidth={1.25}
            strokeLinecap="round"
          />
        </AnimatedG>
        <AnimatedG animatedProps={colRProps}>
          <Path
            d={COL_R}
            stroke={color}
            strokeWidth={1.25}
            strokeLinecap="round"
          />
        </AnimatedG>

        <AnimatedG animatedProps={baseLProps}>
          <Path
            d={BASE_L}
            stroke={structure}
            strokeWidth={1.15}
            strokeLinecap="square"
          />
        </AnimatedG>
        <AnimatedG animatedProps={baseRProps}>
          <Path
            d={BASE_R}
            stroke={structure}
            strokeWidth={1.15}
            strokeLinecap="square"
          />
        </AnimatedG>
        <AnimatedPath
          d={PLINTH}
          animatedProps={plinthProps}
          stroke={structure}
          strokeWidth={1.15}
          strokeLinecap="square"
        />

        <AnimatedG animatedProps={bGroupProps}>
          <Path
            d={B_OUTER}
            stroke={color}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
          <Path
            d={B_TOP}
            stroke={color}
            strokeWidth={1.05}
            strokeLinecap="round"
            opacity={0.85}
          />
          <Path
            d={B_BOT}
            stroke={color}
            strokeWidth={1.05}
            strokeLinecap="round"
            opacity={0.85}
          />
        </AnimatedG>

        {/* Download layer — stroke-draw reveal */}
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
