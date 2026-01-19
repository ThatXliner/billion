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

import { Text, View } from "~/components/Themed";
// import { WireframeWave } from "~/components/WireframeWave";
import {
  badges,
  buttons,
  cards,
  colors,
  createTabContainerStyles,
  getMarkdownStyles,
  layout,
  rd,
  sp,
  typography,
  useTheme,
} from "~/styles";
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
    style={localStyles.tabButton}
    onPress={onPress}
  >
    {title}
  </Button>
);

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { theme } = useTheme();
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
        <View style={[layout.fullCenter, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[localStyles.loadingText, { color: theme.textSecondary }]}>
            Loading content...
          </Text>
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
        <View style={[localStyles.errorContainer, { backgroundColor: theme.background }]}>
          <Text style={[typography.h4, { color: theme.danger }]}>
            {error ? "Failed to load content" : "Content not found"}
          </Text>
          <TouchableOpacity
            style={[localStyles.errorButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[localStyles.errorButtonText, { color: theme.primaryForeground }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const tabContainerStyles = createTabContainerStyles(theme);
  const markdownStyles = getMarkdownStyles(theme);

  return (
    <>
      <SafeAreaView style={layout.container} edges={["top"]}>
        {/* Wireframe wave background */}
        {/*<WireframeWave />*/}

        <View
          style={[
            tabContainerStyles,
            {
              borderBottomColor: theme.border,
            },
          ]}
        >
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
          style={layout.scrollView}
          contentContainerStyle={localStyles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Type badge at top */}
          <View
            style={[badges.base, { backgroundColor: colors.cyan[600] }]}
            lightColor="transparent"
            darkColor="transparent"
          >
            <Text style={badges.text}>GENERAL</Text>
          </View>

          {/* Article title */}
          <Text style={[typography.h1, localStyles.articleTitle, { color: theme.foreground }]}>
            {content.title}
          </Text>

          {/* Short description */}
          <Text
            style={[typography.bodySmall, localStyles.articleDescription, { color: theme.textSecondary }]}
          >
            {content.description}
          </Text>

          <View
            style={[
              cards.content,
              {
                backgroundColor: theme.card,
                borderColor: colors.cyan[700],
                marginTop: sp(5),
                marginBottom: sp(20),
              },
            ]}
          >
            <Markdown style={markdownStyles}>
              {selectedTab === "article"
                ? content.articleContent
                : content.originalContent}
            </Markdown>
          </View>
        </ScrollView>

        {/* Floating action icons on right side */}
        <View style={localStyles.floatingActions} pointerEvents="box-none">
          <TouchableOpacity style={buttons.floating}>
            <Ionicons
              name="heart-outline"
              size={24}
              color={theme.foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity style={buttons.floating}>
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={theme.foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity style={buttons.floating}>
            <Ionicons name="share-outline" size={24} color={theme.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[buttons.floatingLarge, localStyles.floatingCloseButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color={theme.primaryForeground} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const localStyles = StyleSheet.create({
  loadingText: {
    marginTop: sp(4),
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: sp(5),
  },
  errorButton: {
    borderRadius: rd("md"),
    paddingHorizontal: sp(8),
    paddingVertical: sp(3),
    marginTop: sp(4),
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabButton: {
    borderRadius: rd("md"),
  },
  scrollViewContent: {
    padding: sp(5),
    paddingBottom: sp(10),
  },
  articleTitle: {
    marginBottom: sp(3),
    marginTop: sp(4),
  },
  articleDescription: {
    marginBottom: sp(4),
  },
  floatingActions: {
    position: "absolute",
    top: "50%",
    right: sp(5),
    transform: [{ translateY: -80 }],
    gap: sp(4),
  },
  floatingCloseButton: {
    position: "absolute",
    bottom: sp(8),
    right: sp(5),
  },
});
