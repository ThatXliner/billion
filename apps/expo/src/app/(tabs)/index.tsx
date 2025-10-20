import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Text, View } from "~/components/Themed";
import { trpc } from "~/utils/api";

import "~/styles.css";

import { useQuery } from "@tanstack/react-query";

const { width } = Dimensions.get("window");

interface ContentCard {
  id: string;
  title: string;
  description: string;
  type: "bill" | "order" | "case" | "general";
  isAIGenerated: boolean;
}
const ContentCardComponent = ({ item }: { item: ContentCard }) => {
  const router = useRouter();
  const lightColor = "bg-blue-300";
  // const lightColor = "bg-gray-200";
  return (
    <Pressable
      onPress={() => {
        router.push(`/article-detail?id=${item.id}`);
      }}
      className={`${lightColor} mb-4 rounded-xl p-2`}
      // style={styles.neumorphic}
    >
      <View className="flex-row items-center p-2" lightColor={lightColor}>
        <View className="flex-1 pr-3" lightColor={lightColor}>
          <Text className="mb-2 text-base font-bold text-gray-800">
            {item.title}
          </Text>
          <Text className="mb-4 text-sm leading-5 text-gray-600">
            {item.description}
          </Text>
        </View>
        <View className="w-1/3 flex-col" lightColor={lightColor}>
          <TouchableOpacity
            className="mb-2 bg-green-600 px-4 py-2"
            // For some reason the `rounded-` class is broken
            style={{ borderRadius: 10 }}
            onPress={() => {
              router.push(`/article-detail?id=${item.id}`);
            }}
          >
            <Text className="text-center text-sm font-medium text-white">
              Watch Short
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-orange-500 px-4 py-2"
            style={{ borderRadius: 10 }}
            onPress={() => {
              router.push(`/article-detail?id=${item.id}`);
            }}
          >
            <Text className="text-center text-sm font-medium text-white">
              Read More
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
};
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
    className={`mr-3 rounded-2xl px-4 py-2 ${
      active ? "bg-blue-500" : "bg-gray-100"
    }`}
    onPress={onPress}
  >
    <Text
      className={`text-sm font-medium ${
        active ? "text-white" : "text-gray-600"
      }`}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<
    "all" | "bill" | "order" | "case"
  >("all");

  // Fetch content from tRPC
  const {
    data: content,
    isLoading,
    error,
  } = useQuery(
    trpc.content.getByType.queryOptions({
      type: selectedTab,
    }),
  );

  const filteredContent = content ?? [];

  return (
    <View className="flex-1 bg-gray-100">
      <View
        className="bg-white px-5 pb-5"
        style={{ paddingTop: insets.top + 20 }}
      >
        <Text className="text-2xl font-bold text-gray-800">Browse</Text>
      </View>

      <View className="flex-row border-b border-gray-200 bg-white px-5 py-4">
        <TabButton
          title="All"
          active={selectedTab === "all"}
          onPress={() => setSelectedTab("all")}
        />
        <TabButton
          title="Bills"
          active={selectedTab === "bill"}
          onPress={() => setSelectedTab("bill")}
        />
        <TabButton
          title="Orders"
          active={selectedTab === "order"}
          onPress={() => setSelectedTab("order")}
        />
        <TabButton
          title="Cases"
          active={selectedTab === "case"}
          onPress={() => setSelectedTab("case")}
        />
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-red-500">Error loading content</Text>
          </View>
        ) : (
          filteredContent.map((item) => (
            <ContentCardComponent key={item.id} item={item} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  neumorphic: {
    boxShadow: "inset 4px 4px 10px #bcbcbc, inset -4px -4px 10px #ffffff",
  },
});
