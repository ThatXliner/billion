import { useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";

import { Text, View } from "~/components/Themed";

import "~/styles.css";

export default function ArticleDetailScreen() {
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState<"article" | "original">(
    "article",
  );

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

  const articleContent = `AI Generated short form video describing the law/bill/action, it's consequences, and views from both sides of the political spectrum.

This comprehensive analysis breaks down the key components of the proposed legislation and examines its potential impact across different sectors of society.

Key Points:
• Bipartisan support and opposition
• Economic implications
• Social impact considerations
• Timeline for implementation
• Public opinion analysis

The algorithm which helps with keeping you interested and helps up to read/watch the next one.

In our app, we can let you view the thing in question in 2 long-form modes:
- an engaging and visual/heavy AI-generated article (with quotes to the original)
- the original source, in a better, consistent, and modern reading UI`;

  const originalContent = `[Original Bill Text]

H.R. 1234 - The Healthcare Modernization Act

Section 1. Short Title
This Act may be cited as the "Healthcare Modernization Act".

Section 2. Findings
Congress finds the following:
(1) Healthcare accessibility remains a critical challenge
(2) Technology can improve patient outcomes
(3) Cost reduction measures are necessary

Section 3. Healthcare Technology Integration
(a) IN GENERAL.—The Secretary shall establish a program to integrate modern technology solutions into healthcare delivery systems.

(b) REQUIREMENTS.—The program established under subsection (a) shall include:
(1) Electronic health record standardization
(2) Telemedicine infrastructure development
(3) AI-assisted diagnostic tools

[Continue reading original source...]`;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Article Detail",
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
              {selectedTab === "article" ? articleContent : originalContent}
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
