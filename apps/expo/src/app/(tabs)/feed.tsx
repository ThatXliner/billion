import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { VideoPost } from "@acme/api";
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

const { height: screenHeight } = Dimensions.get("window");
export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
        return colors.blue[500];
      case "order":
        return colors.blue[700];
      case "case":
        return colors.blue[600];
      default:
        return colors.gray[600];
    }
  };

  const renderVideoItem = ({ item }: { item: VideoPost; index: number }) => (
    // I have no idea why TypeScript is crashing out here
    <View
      style={[styles.videoContainer, { height: screenHeight }]}
      lightColor={colors.white}
      darkColor={colors.navy[900]}
    >
      {/* Content Card */}
      <View
        style={styles.contentCard}
        lightColor={colors.white}
        darkColor={colors.navy[700]}
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
        <Text style={styles.cardTitle}>{item.title}</Text>

        {/* Description */}
        <Text style={styles.cardDescription}>{item.description}</Text>

        {/* Article Preview */}
        <Text style={styles.articlePreview}>{item.articlePreview}</Text>

        {/* Author */}
        <Text style={styles.author}>{item.author}</Text>

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

      {/* Action Buttons */}
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
                likedVideos.has(item.id) && styles.actionIconLiked,
              ]}
            >
              {likedVideos.has(item.id) ? "❤️" : "🤍"}
            </Text>
            <Text style={styles.actionText}>
              {item.likes + (likedVideos.has(item.id) ? 1 : 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>{item.shares}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Show loading state while fetching initial videos
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={colors.white} />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  // Show error state if fetching failed
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <Text style={styles.errorText}>Error loading videos</Text>
        <Text style={styles.errorSubtext}>Please try again later</Text>
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
    backgroundColor: colors.gray[100],
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray[100],
  },
  loadingText: {
    marginTop: spacing[4] * 16,
    color: colors.gray[600],
    fontSize: fontSize.base,
  },
  errorText: {
    color: colors.red[500],
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  errorSubtext: {
    marginTop: spacing[2] * 16,
    color: colors.gray[600],
    fontSize: fontSize.base,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    backgroundColor: colors.gray[100],
    padding: spacing[5] * 16,
    justifyContent: "center",
  },
  contentCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl * 16,
    padding: spacing[6] * 16,
    shadowColor: colors.blue[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
    color: colors.blue[900],
    marginBottom: spacing[3] * 16,
    lineHeight: fontSize["3xl"] * 1.2,
  },
  cardDescription: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    marginBottom: spacing[4] * 16,
    lineHeight: fontSize.base * 1.5,
  },
  articlePreview: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing[4] * 16,
    lineHeight: fontSize.sm * 1.6,
    fontStyle: "italic",
  },
  author: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.blue[600],
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
    backgroundColor: colors.white,
    borderRadius: radius.full * 16,
    padding: spacing[2] * 16,
    minWidth: 50,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: colors.gray[700],
  },
});
