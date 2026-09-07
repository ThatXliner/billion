import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";

import { Icon } from "~/components/ui";
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
 * Non-blocking OTA update banner.
 *
 * Placement: absolute overlay at the **top**, under the status-bar safe area.
 * Top keeps the floating tab bar free and treats the update as optional chrome
 * rather than a competing bottom CTA. The update still applies on next cold
 * start if the reader dismisses or ignores the banner.
 */
export function UpdatePrompt({ forceShow = false }: UpdatePromptProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { downloadedUpdate, isUpdatePending } = Updates.useUpdates();
  const promptedUpdateId = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);

  const forcePreview = shouldForceShowBanner(forceShow);

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

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingTop: insets.top + sp[2] }]}
      accessibilityElementsHidden={false}
      importantForAccessibility="yes"
    >
      <View
        style={[
          styles.banner,
          {
            backgroundColor: theme.card,
            borderColor: hair[2],
          },
          getShadow("md", isDark),
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <View style={[styles.accent, { backgroundColor: colors.bill }]} />

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={styles.iconTile}>
              <Icon name="download" size={18} color={colors.bill} />
            </View>

            <View style={styles.copy}>
              <Text style={[styles.title, { color: theme.foreground }]}>
                Update ready
              </Text>
              <Text
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                Restart for the latest improvements — or keep reading; it
                applies next launch.
              </Text>
            </View>

            <Pressable
              onPress={dismiss}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Dismiss update banner"
              style={styles.dismissHit}
            >
              <Icon name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => void restartWithUpdate()}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Restart now to install update"
              style={styles.primaryCta}
            >
              <Text style={styles.primaryCtaText}>Restart now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={dismiss}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Later"
              style={styles.laterHit}
            >
              <Text
                style={[styles.laterText, { color: theme.textSecondary }]}
              >
                Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingHorizontal: sp[4],
  },
  banner: {
    flexDirection: "row",
    borderRadius: rd.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  accent: {
    width: 3,
  },
  body: {
    flex: 1,
    paddingVertical: sp[4],
    paddingHorizontal: sp[4],
    gap: sp[4],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: sp[3],
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: rd.lg,
    backgroundColor: planes.surface,
    borderWidth: 1,
    borderColor: hair[1],
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: sp[1],
    paddingTop: 1,
  },
  title: {
    fontFamily: fontBody.semibold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.3,
  },
  subtitle: {
    fontFamily: fontBody.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
  dismissHit: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
    marginRight: -4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp[3],
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: sp[3],
    paddingHorizontal: sp[5],
    borderRadius: rd.full,
  },
  primaryCtaText: {
    fontFamily: fontBody.semibold,
    fontSize: fontSize.sm,
    color: planes.ink,
  },
  laterHit: {
    paddingVertical: sp[2],
    paddingHorizontal: sp[2],
  },
  laterText: {
    fontFamily: fontBody.medium,
    fontSize: fontSize.sm,
  },
});
