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
import { useInfiniteQuery } from "@tanstack/react-query";

import { Text, View } from "~/components/Themed";
import { colors } from "~/constants/Colors";
import { trpc } from "~/utils/api";

const { height: screenHeight } = Dimensions.get("window");

interface VideoPost {
  id: string;
  title: string;
  description: string;
  author: string;
  likes: number;
  comments: number;
  shares: number;
  type: "bill" | "order" | "case" | "general";
  emoji: string;
  backgroundColor: string;
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
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

  const renderVideoItem = ({ item }: { item: VideoPost; index: number }) => (
    <View
      style={[
        styles.videoContainer,
        { height: screenHeight, backgroundColor: item.backgroundColor },
      ]}
    >
      <View style={styles.videoCenter}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.videoTitle}>{item.title}</Text>
      </View>

      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 80 }]}
      >
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.author}>{item.author}</Text>
        </View>

        <View style={styles.actionsContainer}>
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

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔗</Text>
            <Text style={styles.actionText}>Watch Short</Text>
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
    backgroundColor: colors.black,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
  },
  loadingText: {
    marginTop: 16,
    color: colors.white,
  },
  errorText: {
    color: colors.red500,
  },
  errorSubtext: {
    marginTop: 8,
    color: colors.white,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  videoCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 96,
    lineHeight: 120,
  },
  videoTitle: {
    paddingHorizontal: 20,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
  },
  descriptionContainer: {
    marginRight: 20,
    flex: 1,
  },
  description: {
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
  author: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
    opacity: 0.8,
  },
  actionsContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  actionButton: {
    marginBottom: 20,
    alignItems: "center",
    minWidth: 50,
  },
  actionIcon: {
    marginBottom: 4,
    fontSize: 30,
    lineHeight: 36,
  },
  actionIconLiked: {
    transform: [{ scale: 1.25 }],
  },
  actionText: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
  },
});
