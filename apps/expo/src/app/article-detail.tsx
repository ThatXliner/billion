import { useState } from "react";
import { ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { Text, View } from "~/components/Themed";
import { trpc } from "~/utils/api";

import "~/styles.css";

import { useQuery } from "@tanstack/react-query";

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
      className={`mr-3 rounded-lg px-5 py-3 ${
        active ? "bg-pink-500" : "bg-gray-100"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-base font-medium ${
          active ? "text-white" : "text-gray-600"
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

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
        <View className="flex-1 items-center justify-center bg-gray-100">
          <ActivityIndicator size="large" color="#ec4899" />
          <Text className="mt-4 text-gray-600">Loading content...</Text>
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
        <View className="flex-1 items-center justify-center bg-gray-100 p-5">
          <Text className="mb-4 text-lg font-semibold text-red-600">
            {error ? "Failed to load content" : "Content not found"}
          </Text>
          <TouchableOpacity
            className="rounded-lg bg-pink-500 px-8 py-3"
            onPress={() => router.back()}
          >
            <Text className="text-base font-semibold text-white">Go Back</Text>
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
      <View className="flex-1 bg-gray-100">
        <View className="flex-row border-b border-gray-200 bg-white px-5 py-4">
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
          className="h-full flex-1 p-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-xl border border-pink-500 bg-pink-200 p-5">
            <Text className="text-base leading-6 text-gray-800">
              {selectedTab === "article"
                ? content.articleContent
                : content.originalContent}
            </Text>
          </View>

          <View className="items-center">
            <TouchableOpacity
              className="my-3 w-full rounded-lg bg-pink-500 px-8 py-3"
              onPress={() => router.back()}
            >
              <Text className="text-center text-base font-semibold text-white">
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
