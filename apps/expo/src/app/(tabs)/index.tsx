import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { Text, View } from "~/components/Themed";
import { colors } from "~/constants/Colors";
import { trpc } from "~/utils/api";

interface ContentCard {
  id: string;
  title: string;
  description: string;
  type: "bill" | "order" | "case" | "general";
  isAIGenerated: boolean;
}

const ContentCardComponent = ({ item }: { item: ContentCard }) => {
  const router = useRouter();
  const lightColor = colors.blue300;

  return (
    <Pressable
      onPress={() => {
        router.push(`/article-detail?id=${item.id}`);
      }}
      style={styles.card}
    >
      <View style={styles.cardContent} lightColor={lightColor}>
        <View style={styles.cardTextContainer} lightColor={lightColor}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </View>
        <View style={styles.cardButtonContainer} lightColor={lightColor}>
          <TouchableOpacity
            style={styles.watchButton}
            onPress={() => {
              router.push(`/article-detail?id=${item.id}`);
            }}
          >
            <Text style={styles.buttonText}>Watch Short</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.readButton}
            onPress={() => {
              router.push(`/article-detail?id=${item.id}`);
            }}
          >
            <Text style={styles.buttonText}>Read More</Text>
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
    style={[
      styles.tabButton,
      active ? styles.tabButtonActive : styles.tabButtonInactive,
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.tabButtonText,
        active ? styles.tabButtonTextActive : styles.tabButtonTextInactive,
      ]}
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text className="text-2xl">Browse</Text>
        {/*<Text style={styles.headerText}>Browse</Text>*/}
      </View>

      <View style={styles.tabContainer}>
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.blue500} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error loading content</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.gray800,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabButton: {
    marginRight: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.blue500,
  },
  tabButtonInactive: {
    backgroundColor: colors.gray100,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  tabButtonTextInactive: {
    color: colors.gray600,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  errorText: {
    color: colors.red500,
  },
  card: {
    backgroundColor: colors.blue300,
    marginBottom: 16,
    borderRadius: 12,
    padding: 8,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray800,
  },
  cardDescription: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray600,
  },
  cardButtonContainer: {
    width: "33.333%",
    flexDirection: "column",
  },
  watchButton: {
    marginBottom: 8,
    backgroundColor: colors.green600,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  readButton: {
    backgroundColor: colors.orange500,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: colors.white,
  },
});
