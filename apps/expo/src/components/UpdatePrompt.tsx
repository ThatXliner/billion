import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
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
  getShadow,
  hair,
  planes,
  rd,
  useTheme,
} from "~/styles";

const TIMER_MS = 8000;

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

/** DEV: EXPO_PUBLIC_FORCE_UPDATE_BANNER=1 to preview without a real OTA. */
function shouldForceShowBanner(forceShowProp?: boolean): boolean {
  if (forceShowProp) return true;
  if (!__DEV__) return false;
  return process.env.EXPO_PUBLIC_FORCE_UPDATE_BANNER === "1";
}

export interface UpdatePromptProps {
  /** Force banner visible for DEV / preview. */
  forceShow?: boolean;
}

/** Dismissible in-app OTA update popup (top overlay). */
export function UpdatePrompt({ forceShow = false }: UpdatePromptProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { downloadedUpdate, isUpdatePending } = Updates.useUpdates();
  const [dismissedUpdateId, setDismissedUpdateId] = useState<string | null>(
    null,
  );

  const forcePreview = shouldForceShowBanner(forceShow);
  const updateId = forcePreview
    ? "dev-preview"
    : isUpdatePending
      ? (downloadedUpdate?.updateId ?? "pending")
      : null;
  const visible =
    updateId != null &&
    dismissedUpdateId !== updateId &&
    (forcePreview || isUpdatePending);

  const enterY = useSharedValue(-12);
  const enterOpacity = useSharedValue(0);
  const timerProgress = useSharedValue(1);

  const dismiss = () => {
    if (updateId != null) setDismissedUpdateId(updateId);
  };

  useEffect(() => {
    if (!visible || updateId == null) {
      enterY.value = -12;
      enterOpacity.value = 0;
      timerProgress.value = 1;
      return;
    }

    const id = updateId;

    if (reduceMotion) {
      enterY.value = 0;
      enterOpacity.value = 1;
      timerProgress.value = 0;
      return;
    }

    enterY.value = withTiming(0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    enterOpacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.quad),
    });
    timerProgress.value = 1;
    timerProgress.value = withTiming(
      0,
      { duration: TIMER_MS, easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(setDismissedUpdateId)(id);
      },
    );
  }, [visible, updateId, reduceMotion, enterY, enterOpacity, timerProgress]);

  const hostStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterY.value }],
  }));

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: timerProgress.value }],
  }));

  if (!visible) return null;

  const surface = isDark ? planes.surface : theme.card;
  const timerTrack = hair[2];

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingTop: insets.top + 8 }]}
      accessibilityElementsHidden={false}
      importantForAccessibility="yes"
    >
      <Animated.View
        style={[
          styles.popup,
          {
            backgroundColor: surface,
            borderColor: hair[2],
          },
          getShadow("md", isDark),
          hostStyle,
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <View style={styles.row}>
          <View style={styles.markWrap}>
            <UpdateReadyMark size={32} color={colors.bill} />
          </View>

          <View style={styles.copy}>
            <Text style={styles.kicker} numberOfLines={1}>
              UPDATE
            </Text>
            <Text
              style={[styles.title, { color: theme.foreground }]}
              numberOfLines={1}
            >
              An update is ready
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              Restart to install it
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

        <View style={[styles.timerTrack, { backgroundColor: timerTrack }]}>
          <Animated.View
            style={[styles.timerFill, timerStyle]}
          />
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
    paddingHorizontal: 12,
  },
  popup: {
    borderRadius: rd.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  markWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 1,
  },
  kicker: {
    fontFamily: fontBody.semibold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: colors.bill,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontDisplay.bold,
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
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
  timerTrack: {
    height: 3,
    width: "100%",
    overflow: "hidden",
  },
  timerFill: {
    height: "100%",
    width: "100%",
    backgroundColor: colors.bill,
    transformOrigin: "left",
  },
});
