import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button-native";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@acme/ui/theme-tokens";

import { Text, View } from "~/components/Themed";
import { trpc } from "~/utils/api";

const TabButton = ({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Button
    variant={active ? "default" : "ghost"}
    size="sm"
    style={styles.tabButton}
    onPress={onPress}
  >
    {title}
  </Button>
);
export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [selectedTab, setSelectedTab] = useState<"article" | "original">(
    "article",
  );

  // Fetch content from tRPC
  const {
    data: content,
    isLoading,
    error,
  } = useQuery({
    ...trpc.content.getById.queryOptions({ id }),
    enabled: !!id,
  });

  // Handle loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Loading...",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.blue[500]} />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </>
    );
  }

  // Handle error state
  if (error || !content) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Error",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            {error ? "Failed to load content" : "Content not found"}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: content.title,
          headerBackTitle: "Back",
        }}
      />
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TabButton
            title="Article"
            active={selectedTab === "article"}
            onPress={() => setSelectedTab("article")}
          />
          <TabButton
            title="Original"
            active={selectedTab === "original"}
            onPress={() => setSelectedTab("original")}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              {selectedTab === "article"
                ? content.articleContent
                : content.originalContent}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray[100],
  },
  loadingText: {
    marginTop: spacing[4] * 16,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray[100],
    padding: spacing[5] * 16,
  },
  errorTitle: {
    marginBottom: spacing[4] * 16,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.red[600],
  },
  errorButton: {
    borderRadius: radius.md * 16,
    backgroundColor: colors.blue[500],
    paddingHorizontal: spacing[8] * 16,
    paddingVertical: spacing[3] * 16,
  },
  errorButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5] * 16,
    paddingVertical: spacing[4] * 16,
    gap: spacing[3] * 16,
  },
  tabButton: {
    borderRadius: radius.md * 16,
  },
  scrollView: {
    flex: 1,
    padding: spacing[5] * 16,
  },
  contentCard: {
    borderRadius: radius.lg * 16,
    borderWidth: 1,
    borderColor: colors.blue[500],
    backgroundColor: colors.blue[100],
    padding: spacing[5] * 16,
  },
  contentText: {
    fontSize: fontSize.base,
    lineHeight: spacing[6] * 16,
    color: colors.gray[800],
  },
  buttonContainer: {
    alignItems: "center",
  },
  backButton: {
    marginVertical: spacing[3] * 16,
    width: "100%",
    borderRadius: radius.md * 16,
    backgroundColor: colors.blue[500],
    paddingHorizontal: spacing[8] * 16,
    paddingVertical: spacing[3] * 16,
  },
  backButtonText: {
    textAlign: "center",
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
