import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";

import { UpdateReadyMark } from "~/components/UpdateReadyMark";
import {
  colors,
  fontBody,
  fontDisplay,
  hair,
  planes,
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
 * Gazette / new-edition OTA notice — typography-first civic masthead slip.
 *
 * Placement: absolute overlay at the **top**, under the status-bar safe area.
 * Flush with app chrome (no floating toast card, no left accent bar, no pill CTA).
 * Mark morphs architecture → download via UpdateReadyMark (respects reduce motion).
 * The update still applies on next cold start if the reader dismisses.
 */
export function UpdatePrompt({ forceShow = false }: UpdatePromptProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { downloadedUpdate, isUpdatePending } = Updates.useUpdates();
  const promptedUpdateId = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);

  const forcePreview = shouldForceShowBanner(forceShow);

  const enterY = useSharedValue(-8);
  const enterOpacity = useSharedValue(0);
  const ruleProgress = useSharedValue(0);

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
      enterY.value = -8;
      enterOpacity.value = 0;
      ruleProgress.value = 0;
      return;
    }

    if (reduceMotion) {
      enterY.value = 0;
      enterOpacity.value = 1;
      ruleProgress.value = 1;
      return;
    }

    enterY.value = withTiming(0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    enterOpacity.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.quad),
    });
    ruleProgress.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, reduceMotion, enterY, enterOpacity, ruleProgress]);

  const hostStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterY.value }],
  }));

  const bottomRuleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: ruleProgress.value }],
  }));

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  const surface = isDark ? planes.navy : theme.card;
  const ruleColor = hair[2];

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingTop: insets.top }]}
      accessibilityElementsHidden={false}
      importantForAccessibility="yes"
    >
      <Animated.View
        style={[
          styles.banner,
          { backgroundColor: surface },
          hostStyle,
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <View style={styles.row}>
          <View style={styles.markWrap}>
            <UpdateReadyMark size={28} color={colors.bill} />
          </View>

          <View style={styles.copy}>
            <Text
              style={[styles.title, { color: theme.foreground }]}
              numberOfLines={1}
            >
              A new edition is ready
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              Restart to load it
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => void restartWithUpdate()}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Restart now to install update"
              style={({ pressed }) => [
                styles.restartHit,
                pressed && styles.restartPressed,
              ]}
            >
              <Text style={styles.restartText}>Restart</Text>
            </Pressable>

            <Pressable
              onPress={dismiss}
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Dismiss update notice"
              style={({ pressed }) => [
                styles.laterHit,
                pressed && { opacity: 0.55 },
              ]}
            >
              <Text style={[styles.laterText, { color: theme.textSecondary }]}>
                Later
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Single bottom rule — same quiet divider language as Browse chrome */}
        <Animated.View
          style={[
            styles.rule,
            { backgroundColor: ruleColor },
            bottomRuleStyle,
          ]}
        />
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
  },
  banner: {
    // Same navy canvas as Browse — no card, no shadow, no masthead frame
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    // Match Browse `headerPad` / ContentCard horizontal rhythm
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  markWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 2,
  },
  title: {
    // Sit under Browse's 36 display title — quieter editorial, not competing
    fontFamily: fontDisplay.bold,
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
    // Match Browse subtitle weight (~14.5 Albert)
    fontFamily: fontBody.regular,
    fontSize: 13,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingLeft: 4,
  },
  restartHit: {
    justifyContent: "center",
    minHeight: 36,
    paddingVertical: 4,
  },
  restartPressed: {
    opacity: 0.7,
  },
  restartText: {
    // Same cue as Browse "Change >" / "Browse Federal instead"
    fontFamily: fontBody.semibold,
    fontSize: 13,
    color: colors.bill,
  },
  laterHit: {
    justifyContent: "center",
    minHeight: 36,
    paddingVertical: 4,
  },
  laterText: {
    fontFamily: fontBody.medium,
    fontSize: 13,
  },
});
