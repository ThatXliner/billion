import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "~/components/Themed";
import { trpc } from "~/utils/api";

import "~/styles.css";

import { useInfiniteQuery } from "@tanstack/react-query";

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

// All mock data generation has been moved to the tRPC video router

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

  const renderVideoItem = ({
    item,
  }: {
    item: VideoPost;
    index: number;
  }) => (
    <View
      className="relative w-full"
      style={{ height: screenHeight, backgroundColor: item.backgroundColor }}
    >
      <View className="flex-1 items-center justify-center">
        <Text style={{ fontSize: 96, lineHeight: 120 }}>{item.emoji}</Text>
        <Text className="px-5 text-center text-xl font-bold text-white">
          {item.title}
        </Text>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row p-5"
        style={{ paddingBottom: insets.bottom + 80 }}
      >
        <View className="mr-5 flex-1">
          <Text className="mb-3 text-base leading-6 text-white">
            {item.description}
          </Text>
          <Text className="text-sm font-semibold text-white opacity-80">
            {item.author}
          </Text>
        </View>

        <View className="items-center justify-end">
          <TouchableOpacity
            className="mb-5 items-center"
            onPress={() => handleLike(item.id)}
          >
            <Text
              className={`mb-1 text-3xl ${likedVideos.has(item.id) ? "scale-125" : ""}`}
            >
              {likedVideos.has(item.id) ? "❤️" : "🤍"}
            </Text>
            <Text className="text-center text-xs text-white">
              {item.likes + (likedVideos.has(item.id) ? 1 : 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-5 items-center">
            <Text className="mb-1 text-3xl">💬</Text>
            <Text className="text-center text-xs text-white">
              {item.comments}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-5 items-center">
            <Text className="mb-1 text-3xl">📤</Text>
            <Text className="text-center text-xs text-white">
              {item.shares}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-5 items-center">
            <Text className="mb-1 text-3xl">🔗</Text>
            <Text className="text-center text-xs text-white">Watch Short</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Show loading state while fetching initial videos
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="mt-4 text-white">Loading videos...</Text>
      </View>
    );
  }

  // Show error state if fetching failed
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <StatusBar hidden />
        <Text className="text-red-500">Error loading videos</Text>
        <Text className="mt-2 text-white">Please try again later</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
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
