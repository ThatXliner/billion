import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";

import { Icon } from "~/components/ui";
import { UpdateReadyMark } from "~/components/UpdateReadyMark";
import {
  colors,
  fontBody,
  fontSize,
  getShadow,
  hair,
  planes,
  rd,
  sp,
  useTheme,
} from "~/styles";

async function restartWithUpdate() {
  try {
    await Updates.reloadAsync();
  } catch (error) {
    console.warn("Unable to restart with the downloaded update:", error);
    Alert.alert(
      "Unable to restart",
      "Close and reopen Billion to finish installing the update.",
    );
  }
}

/** DEV-only: set EXPO_PUBLIC_FORCE_UPDATE_BANNER=1 to preview without a real OTA. */
function shouldForceShowBanner(forceShowProp?: boolean): boolean {
  if (forceShowProp) return true;
  if (!__DEV__) return false;
  return process.env.EXPO_PUBLIC_FORCE_UPDATE_BANNER === "1";
}

export type UpdatePromptProps = {
  /**
   * Force the banner visible (DEV / Storybook-style preview).
   * Prefer `EXPO_PUBLIC_FORCE_UPDATE_BANNER=1` for simulator QA.
   * No-ops in production builds unless explicitly passed in tests.
   */
  forceShow?: boolean;
};

/**
 * Compact, non-blocking OTA update banner.
 *
 * Placement: absolute overlay at the **top**, under the status-bar safe area.
 * Top keeps the floating tab bar free and treats the update as optional chrome
 * rather than a competing bottom CTA. The update still applies on next cold
 * start if the reader dismisses or ignores the banner.
 */
export function UpdatePrompt({ forceShow = false }: UpdatePromptProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { downloadedUpdate, isUpdatePending } = Updates.useUpdates();
  const promptedUpdateId = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);

  const forcePreview = shouldForceShowBanner(forceShow);

  const enterY = useSharedValue(-14);
  const enterOpacity = useSharedValue(0);
  const markPulse = useSharedValue(1);

  useEffect(() => {
    if (!forcePreview && !isUpdatePending) {
      setVisible(false);
      return;
    }

    const updateId = forcePreview
      ? "dev-preview"
      : (downloadedUpdate?.updateId ?? "pending");

    if (promptedUpdateId.current === updateId) return;
    promptedUpdateId.current = updateId;
    setVisible(true);
  }, [downloadedUpdate?.updateId, forcePreview, isUpdatePending]);

  useEffect(() => {
    if (!visible) {
      enterY.value = -14;
      enterOpacity.value = 0;
      markPulse.value = 1;
      return;
    }

    if (reduceMotion) {
      enterY.value = 0;
      enterOpacity.value = 1;
      markPulse.value = 1;
      return;
    }

    enterY.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.85 });
    enterOpacity.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    markPulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [visible, reduceMotion, enterY, enterOpacity, markPulse]);

  const hostStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterY.value }],
  }));

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: markPulse.value }],
  }));

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingTop: insets.top + sp[1] }]}
      accessibilityElementsHidden={false}
      importantForAccessibility="yes"
    >
      <Animated.View
        style={[
          styles.banner,
          {
            backgroundColor: theme.card,
            borderColor: hair[2],
          },
          getShadow("sm", isDark),
          hostStyle,
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <View style={[styles.accent, { backgroundColor: colors.bill }]} />

        <View style={styles.row}>
          <Animated.View style={[styles.markWrap, markStyle]}>
            <UpdateReadyMark size={20} color={colors.bill} />
          </Animated.View>

          <View style={styles.copy}>
            <Text
              style={[styles.title, { color: theme.foreground }]}
              numberOfLines={1}
            >
              Update ready
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              Restart for latest
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => void restartWithUpdate()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Restart now to install update"
            style={styles.primaryCta}
          >
            <Text style={styles.primaryCtaText}>Restart</Text>
          </TouchableOpacity>

          <Pressable
            onPress={dismiss}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Dismiss update banner"
            style={styles.dismissHit}
          >
            <Icon name="close" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: sp[3],
  },
  banner: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: rd.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  accent: {
    width: 2.5,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: sp[2],
    paddingVertical: sp[2],
    paddingLeft: sp[2],
    paddingRight: sp[1],
    minHeight: 44,
  },
  markWrap: {
    width: 28,
    height: 28,
    borderRadius: rd.md,
    backgroundColor: planes.surface,
    borderWidth: 1,
    borderColor: hair[1],
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 1,
  },
  title: {
    fontFamily: fontBody.semibold,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.25,
  },
  subtitle: {
    fontFamily: fontBody.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.25,
  },
  primaryCta: {
    backgroundColor: colors.white,
    paddingVertical: sp[1] + 2,
    paddingHorizontal: sp[3],
    borderRadius: rd.full,
  },
  primaryCtaText: {
    fontFamily: fontBody.semibold,
    fontSize: fontSize.xs,
    color: planes.ink,
  },
  dismissHit: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
