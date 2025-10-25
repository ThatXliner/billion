import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button-native";
import { Card, CardContent } from "@acme/ui/card-native";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@acme/ui/theme-tokens";

import { Text, View } from "~/components/Themed";
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

  return (
    <Card
      variant="elevated"
      style={styles.card}
      pressable
      onPress={() => {
        router.push(`/article-detail?id=${item.id}`);
      }}
    >
      <CardContent style={styles.cardContent}>
        <View
          style={styles.cardTextContainer}
          lightColor="transparent"
          darkColor="transparent"
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </View>
        <View
          style={styles.cardButtonContainer}
          lightColor="transparent"
          darkColor="transparent"
        >
          <Button
            variant="default"
            size="sm"
            style={styles.watchButton}
            onPress={() => {
              router.push(`/article-detail?id=${item.id}`);
            }}
          >
            Watch Short
          </Button>
          <Button
            variant="secondary"
            size="sm"
            style={styles.readButton}
            onPress={() => {
              router.push(`/article-detail?id=${item.id}`);
            }}
          >
            Read More
          </Button>
        </View>
      </CardContent>
    </Card>
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
  <Button
    variant={active ? "default" : "ghost"}
    size="sm"
    style={styles.tabButton}
    onPress={onPress}
  >
    {title}
  </Button>
);

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<
    "all" | "bill" | "order" | "case"
  >("all");
  // verifyInstallation();
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
        {/*<Text className="text-2xl text-red-500">Browse</Text>*/}
        <Text style={styles.headerText}>Browse</Text>
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
            <ActivityIndicator size="large" color={colors.blue[500]} />
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
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5] * 16,
    paddingBottom: spacing[5] * 16,
  },
  headerText: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.blue[900],
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5] * 16,
    paddingVertical: spacing[4] * 16,
    gap: spacing[3] * 16,
  },
  tabButton: {
    borderRadius: radius.lg * 16,
  },
  scrollView: {
    flex: 1,
    padding: spacing[5] * 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[10] * 16,
  },
  errorText: {
    color: colors.red[500],
    fontSize: fontSize.base,
  },
  card: {
    marginBottom: spacing[4] * 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3] * 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: spacing[2] * 16,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.blue[900],
  },
  cardDescription: {
    fontSize: fontSize.sm,
    lineHeight: spacing[5] * 16,
    color: colors.gray[600],
  },
  cardButtonContainer: {
    width: "33.333%",
    flexDirection: "column",
    gap: spacing[3] * 16,
  },
  watchButton: {
    backgroundColor: colors.green[600],
  },
  readButton: {},
});
