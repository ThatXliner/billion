import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { VideoPost } from "@acme/api";
import { Button } from "@acme/ui/button-native";
import {
  colors,
  darkTheme,
  fontSize,
  fontWeight,
  lightTheme,
  radius,
  spacing,
} from "@acme/ui/theme-tokens";

import { Text, View } from "~/components/Themed";
import { trpc } from "~/utils/api";

const { height: screenHeight } = Dimensions.get("window");
export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

  // Use infinite query for video feed
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    ...trpc.video.getInfinite.infiniteQueryOptions({
      limit: 10,
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Flatten all pages into a single array of videos
  const videos = useMemo(
    () => data?.pages.flatMap((page) => page.videos) ?? [],
    [data],
  );

  const handleLike = (videoId: string) => {
    const newLikedVideos = new Set(likedVideos);
    if (newLikedVideos.has(videoId)) {
      newLikedVideos.delete(videoId);
    } else {
      newLikedVideos.add(videoId);
    }
    setLikedVideos(newLikedVideos);
  };

  const loadMoreVideos = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const getTypeBadgeColor = (type: VideoPost["type"]) => {
    switch (type) {
      case "bill":
        return colors.purple[600]; // Purple for bills
      case "order":
        return colors.indigo[600]; // Indigo for orders
      case "case":
        return colors.cyan[600]; // Cyan for cases
      default:
        return theme.muted; // Muted for general
    }
  };

  const renderVideoItem = ({ item }: { item: VideoPost; index: number }) => (
    // I have no idea why TypeScript is crashing out here
    <View
      style={[
        styles.videoContainer,
        { height: screenHeight, backgroundColor: theme.background },
      ]}
      lightColor={theme.background}
      darkColor={theme.background}
    >
      {/* Content Card */}
      <View
        style={[
          styles.contentCard,
          {
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
          },
        ]}
        lightColor={theme.card}
        darkColor={theme.card}
      >
        {/* Type Badge */}
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: getTypeBadgeColor(item.type) },
          ]}
          lightColor="transparent"
          darkColor="transparent"
        >
          <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.cardTitle, { color: theme.foreground }]}>
          {item.title}
        </Text>

        {/* Description */}
        <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
          {item.description}
        </Text>

        {/* Article Preview */}
        <Text style={[styles.articlePreview, { color: theme.mutedForeground }]}>
          {item.articlePreview}
        </Text>

        {/* Author */}
        <Text style={[styles.author, { color: theme.accent }]}>
          {item.author}
        </Text>

        {/* Read Full Article Button */}
        <Button
          variant="default"
          size="lg"
          style={styles.readButton}
          onPress={() => {
            // Extract original content ID from feed ID (format: "1-0", "2-1", etc.)
            const contentId = item.id.split("-")[0];
            router.push(`/article-detail?id=${contentId}`);
          }}
        >
          Read Full Article
        </Button>
      </View>

      {/* Action Buttons - Floating with no background */}
      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 80 }]}
        lightColor="transparent"
        darkColor="transparent"
      >
        <View
          style={styles.actionsContainer}
          lightColor="transparent"
          darkColor="transparent"
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Text
              style={[
                styles.actionIcon,
                { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" },
                likedVideos.has(item.id) && styles.actionIconLiked,
              ]}
            >
              {likedVideos.has(item.id) ? "❤️" : "🤍"}
            </Text>
            <Text style={[styles.actionText, { color: theme.foreground }]}>
              {item.likes + (likedVideos.has(item.id) ? 1 : 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={[styles.actionText, { color: theme.foreground }]}>
              {item.comments}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={[styles.actionText, { color: theme.foreground }]}>
              {item.shares}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Show loading state while fetching initial videos
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading videos...
        </Text>
      </View>
    );
  }

  // Show error state if fetching failed
  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar hidden />
        <Text style={[styles.errorText, { color: theme.danger }]}>
          Error loading videos
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>
          Please try again later
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate={0}
        bounces={false}
        onEndReached={loadMoreVideos}
        onEndReachedThreshold={0.5}
        getItemLayout={(_data, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing[4] * 16,
    fontSize: fontSize.base,
  },
  errorText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  errorSubtext: {
    marginTop: spacing[2] * 16,
    fontSize: fontSize.base,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    padding: spacing[5] * 16,
    justifyContent: "center",
  },
  contentCard: {
    borderRadius: radius.xl * 16,
    padding: spacing[6] * 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing[3] * 16,
    paddingVertical: spacing[1] * 16,
    borderRadius: radius.md * 16,
    marginBottom: spacing[4] * 16,
  },
  typeBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    marginBottom: spacing[3] * 16,
    lineHeight: fontSize["3xl"] * 1.2,
  },
  cardDescription: {
    fontSize: fontSize.base,
    marginBottom: spacing[4] * 16,
    lineHeight: fontSize.base * 1.5,
  },
  articlePreview: {
    fontSize: fontSize.sm,
    marginBottom: spacing[4] * 16,
    lineHeight: fontSize.sm * 1.6,
    fontStyle: "italic",
  },
  author: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[5] * 16,
  },
  readButton: {
    width: "100%",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    right: spacing[5] * 16,
    alignItems: "flex-end",
  },
  actionsContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  actionButton: {
    marginBottom: spacing[4] * 16,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  actionIcon: {
    marginBottom: spacing[1] * 16,
    fontSize: fontSize["2xl"],
  },
  actionIconLiked: {
    transform: [{ scale: 1.25 }],
  },
  actionText: {
    textAlign: "center",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
