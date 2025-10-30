import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
      {/*<Stack.Screen
        options={{
          title: content.title,
          headerBackTitle: "Back",
        }}
      />*/}
      <SafeAreaView style={styles.container} edges={["top"]}>
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
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentCard}>
            <Markdown
              style={{
                body: {
                  fontSize: fontSize.base,
                  lineHeight: spacing[6] * 16,
                  color: colors.gray[800],
                },
                heading1: {
                  fontSize: fontSize["2xl"],
                  fontWeight: fontWeight.bold,
                  marginBottom: spacing[4] * 16,
                  color: colors.gray[900],
                },
                heading2: {
                  fontSize: fontSize.xl,
                  fontWeight: fontWeight.bold,
                  marginBottom: spacing[3] * 16,
                  color: colors.gray[900],
                },
                heading3: {
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  marginBottom: spacing[2] * 16,
                  color: colors.gray[900],
                },
                paragraph: {
                  marginBottom: spacing[4] * 16,
                },
                listItem: {
                  marginBottom: spacing[2] * 16,
                },
                strong: {
                  fontWeight: fontWeight.bold,
                },
                em: {
                  fontStyle: "italic",
                },
                link: {
                  color: colors.blue[600],
                  textDecorationLine: "underline",
                },
                blockquote: {
                  backgroundColor: colors.gray[100],
                  borderLeftWidth: 4,
                  borderLeftColor: colors.blue[500],
                  paddingLeft: spacing[4] * 16,
                  paddingVertical: spacing[2] * 16,
                  marginVertical: spacing[3] * 16,
                },
                code_inline: {
                  backgroundColor: colors.gray[200],
                  paddingHorizontal: spacing[2] * 16,
                  paddingVertical: spacing[1] * 16,
                  borderRadius: radius.sm * 16,
                  fontFamily: "monospace",
                },
                code_block: {
                  backgroundColor: colors.gray[900],
                  color: colors.white,
                  padding: spacing[4] * 16,
                  borderRadius: radius.md * 16,
                  marginVertical: spacing[3] * 16,
                  fontFamily: "monospace",
                },
              }}
            >
              {selectedTab === "article"
                ? content.articleContent
                : content.originalContent}
            </Markdown>
          </View>
        </ScrollView>

        {/* Floating close button */}
        <TouchableOpacity
          style={styles.floatingCloseButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  scrollViewContent: {
    padding: spacing[5] * 16,
    paddingBottom: spacing[10] * 16, // Extra padding at bottom to prevent cutoff
  },
  contentCard: {
    borderRadius: radius.lg * 16,
    borderWidth: 1,
    borderColor: colors.blue[500],
    backgroundColor: colors.blue[100],
    padding: spacing[5] * 16,
    marginBottom: spacing[20] * 16, // Extra space at bottom for comfortable reading
  },
  floatingCloseButton: {
    position: "absolute",
    bottom: spacing[8] * 16,
    right: spacing[5] * 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.blue[500],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
