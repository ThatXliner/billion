import {
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { useState, useCallback, useMemo } from "react";
import { Text, View } from "@/components/Themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

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

const videoEmojis = [
  "📺",
  "🎬",
  "🎭",
  "🎪",
  "🎨",
  "🎯",
  "🎲",
  "🎸",
  "🎹",
  "🎤",
  "🎧",
  "🎮",
  "🕹️",
  "🎰",
  "🎳",
  "🏆",
  "🏅",
  "🥇",
  "🥈",
  "🥉",
  "⚡",
  "🔥",
  "💎",
  "⭐",
  "🌟",
  "✨",
  "💫",
  "🌙",
  "☀️",
  "🌈",
  "🦄",
  "🚀",
  "💰",
  "💸",
  "🎊",
  "🎉",
  "🎈",
  "🎁",
  "🏰",
  "🗽",
];

const backgroundColors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#82E0AA",
  "#F1948A",
  "#85C1E9",
  "#D7BDE2",
  "#A9DFBF",
  "#F9E79F",
  "#D5A6BD",
  "#AED6F1",
  "#A3E4D7",
  "#F4D03F",
  "#D2B4DE",
  "#7FB3D3",
  "#76D7C4",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#82E0AA",
  "#F1948A",
  "#D7BDE2",
];

const videoTitles = [
  "Breaking: Healthcare Reform Bill Explained",
  "Supreme Court Decision Impact",
  "Environmental Case Breakdown",
  "Tax Reform Analysis",
  "Immigration Policy Update",
  "Education Bill Discussion",
  "Infrastructure Investment Plan",
  "Climate Change Legislation",
  "Social Security Reform",
  "Criminal Justice Update",
  "Trade Agreement Analysis",
  "Housing Policy Changes",
  "Energy Independence Bill",
  "National Security Update",
  "Economic Recovery Plan",
];

const videoDescriptions = [
  "TikTok style short form video describing the law/bill/action, its consequences, and views from both sides of the political spectrum",
  'Double tap the video to "like" it (causing the algorithm which helps with keeping you interested) and swipe up to read/watch the next one',
  "In our app, we can let you view the thing in question in 2 long-form modes: an engaging and visual/heavy AI-generated article or the original source",
  "Comprehensive breakdown of proposed legislation and its potential impacts on different demographics",
  "Expert analysis with public reaction and legal commentary from multiple perspectives",
  "Deep dive into policy implications with real-world examples and case studies",
];

const authors = [
  "@PoliticsExplained",
  "@LegalUpdates",
  "@EcoLegal",
  "@PolicyWatch",
  "@LawBreakdown",
  "@GovAnalysis",
  "@CitizenInfo",
  "@PolicyHub",
  "@LegalInsider",
  "@BillTracker",
  "@LawMakers",
  "@PolicyDeep",
];

// Generate random video data
const generateRandomVideo = (index: number): VideoPost => {
  const randomEmoji =
    videoEmojis[Math.floor(Math.random() * videoEmojis.length)];
  const randomColor =
    backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
  const randomTitle =
    videoTitles[Math.floor(Math.random() * videoTitles.length)];
  const randomDescription =
    videoDescriptions[Math.floor(Math.random() * videoDescriptions.length)];
  const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
  const types: Array<"bill" | "order" | "case" | "general"> = [
    "bill",
    "order",
    "case",
    "general",
  ];
  const randomType = types[Math.floor(Math.random() * types.length)];

  return {
    id: `video-${index}`,
    title: randomTitle,
    description: randomDescription,
    author: randomAuthor,
    likes: Math.floor(Math.random() * 50000) + 1000,
    comments: Math.floor(Math.random() * 2000) + 50,
    shares: Math.floor(Math.random() * 1000) + 10,
    type: randomType,
    emoji: randomEmoji,
    backgroundColor: randomColor,
  };
};

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with some videos
  useMemo(() => {
    const initialVideos = Array.from({ length: 10 }, (_, index) =>
      generateRandomVideo(index),
    );
    setVideos(initialVideos);
  }, []);

  const handleLike = (videoId: string) => {
    const newLikedVideos = new Set(likedVideos);
    if (newLikedVideos.has(videoId)) {
      newLikedVideos.delete(videoId);
    } else {
      newLikedVideos.add(videoId);
    }
    setLikedVideos(newLikedVideos);
  };

  const loadMoreVideos = useCallback(() => {
    if (isLoading) return;

    setIsLoading(true);
    // Simulate loading delay (you can remove this in real implementation)
    setTimeout(() => {
      const newVideos = Array.from({ length: 5 }, (_, index) =>
        generateRandomVideo(videos.length + index),
      );
      setVideos((prevVideos) => [...prevVideos, ...newVideos]);
      setIsLoading(false);
    }, 100);
  }, [videos.length, isLoading]);

  const renderVideoItem = ({
    item,
    index,
  }: {
    item: VideoPost;
    index: number;
  }) => (
    <View
      className="relative w-full"
      style={{ height: screenHeight, backgroundColor: item.backgroundColor }}
    >
      <View className="flex-1 justify-center items-center">
        <Text style={{ fontSize: 96, lineHeight: 120 }}>{item.emoji}</Text>
        <Text className="text-xl font-bold text-white text-center px-5">
          {item.title}
        </Text>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row p-5"
        style={{ paddingBottom: insets.bottom + 80 }}
      >
        <View className="flex-1 mr-5">
          <Text className="text-white text-base mb-3 leading-6">
            {item.description}
          </Text>
          <Text className="text-white text-sm font-semibold opacity-80">
            {item.author}
          </Text>
        </View>

        <View className="items-center justify-end">
          <TouchableOpacity
            className="items-center mb-5"
            onPress={() => handleLike(item.id)}
          >
            <Text
              className={`text-3xl mb-1 ${likedVideos.has(item.id) ? "scale-125" : ""}`}
            >
              {likedVideos.has(item.id) ? "❤️" : "🤍"}
            </Text>
            <Text className="text-white text-xs text-center">
              {item.likes + (likedVideos.has(item.id) ? 1 : 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center mb-5">
            <Text className="text-3xl mb-1">💬</Text>
            <Text className="text-white text-xs text-center">
              {item.comments}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center mb-5">
            <Text className="text-3xl mb-1">📤</Text>
            <Text className="text-white text-xs text-center">
              {item.shares}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center mb-5">
            <Text className="text-3xl mb-1">🔗</Text>
            <Text className="text-white text-xs text-center">Watch Short</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.y / screenHeight,
          );
          setCurrentVideoIndex(index);
        }}
        getItemLayout={(data, index) => ({
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
