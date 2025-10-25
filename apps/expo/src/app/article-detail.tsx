import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { Text, View } from "~/components/Themed";
import { colors } from "~/constants/Colors";
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
  <TouchableOpacity
    style={[
      styles.tabButton,
      active ? styles.tabButtonActive : styles.tabButtonInactive,
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.tabButtonText,
        active ? styles.tabButtonTextActive : styles.tabButtonTextInactive,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
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
          <ActivityIndicator size="large" color={colors.pink500} />
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
    backgroundColor: colors.gray100,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray100,
  },
  loadingText: {
    marginTop: 16,
    color: colors.gray600,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray100,
    padding: 20,
  },
  errorTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colors.red600,
  },
  errorButton: {
    borderRadius: 8,
    backgroundColor: colors.pink500,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabButton: {
    marginRight: 12,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabButtonActive: {
    backgroundColor: colors.pink500,
  },
  tabButtonInactive: {
    backgroundColor: colors.gray100,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  tabButtonTextInactive: {
    color: colors.gray600,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  contentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.pink500,
    backgroundColor: colors.pink200,
    padding: 20,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray800,
  },
  buttonContainer: {
    alignItems: "center",
  },
  backButton: {
    marginVertical: 12,
    width: "100%",
    borderRadius: 8,
    backgroundColor: colors.pink500,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  backButtonText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});
