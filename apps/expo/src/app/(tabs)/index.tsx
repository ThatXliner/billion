import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";

import type { VideoPost } from "@acme/api";
import { Button } from "@acme/ui/button-native";
import { Card, CardContent } from "@acme/ui/card-native";
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

interface ContentCard {
  id: string;
  title: string;
  description: string;
  type: "bill" | "order" | "case" | "general";
  isAIGenerated: boolean;
}

const ContentCardComponent = ({
  item,
  theme,
}: {
  item: ContentCard;
  theme: typeof darkTheme;
}) => {
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
          <Text
            style={{
              marginBottom: spacing[2] * 16,
              fontSize: fontSize.lg,
              fontWeight: fontWeight.bold,
              color: theme.foreground,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              lineHeight: spacing[5] * 16,
              color: theme.textSecondary,
            }}
          >
            {item.description}
          </Text>
        </View>
        <View
          style={styles.cardButtonContainer}
          lightColor="transparent"
          darkColor="transparent"
        >
          <Button
            variant="default"
            size="sm"
            onPress={() => {
              router.push(`/article-detail?id=${item.id}`);
            }}
          >
            Watch Short
          </Button>
          <Button
            variant="outline"
            size="sm"
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
  theme,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
  theme: typeof darkTheme;
}) => (
  <TouchableOpacity
    style={[
      styles.tabButton,
      active
        ? { backgroundColor: theme.primary }
        : {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: theme.border,
          },
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.tabButtonText,
        {
          color: active ? theme.primaryForeground : theme.mutedForeground,
        },
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;
  const [selectedTab, setSelectedTab] = useState<VideoPost["type"] | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

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

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!content) return null;
    return new Fuse(content, {
      keys: ["title", "description"],
      threshold: 0.3, // Lower = more strict matching
      includeScore: true,
    });
  }, [content]);

  // Filter content based on search query
  const filteredContent = useMemo(() => {
    if (!content) return [];
    if (!searchQuery.trim()) return content;
    if (!fuse) return content;

    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [content, searchQuery, fuse]);

  const tabs = {
    all: {
      title: "All",
      active: selectedTab === "all",
      onPress: () => setSelectedTab("all"),
    },
    bill: {
      title: "Bills",
      active: selectedTab === "bill",
      onPress: () => setSelectedTab("bill"),
    },
    case: {
      title: "Cases",
      active: selectedTab === "case",
      onPress: () => setSelectedTab("case"),
    },
    order: {
      title: "Orders",
      active: selectedTab === "order",
      onPress: () => setSelectedTab("order"),
    },
  };

  const dynamicStyles = {
    header: {
      backgroundColor: theme.background,
      paddingHorizontal: spacing[5] * 16,
      paddingBottom: spacing[5] * 16,
      paddingTop: insets.top + 20,
    },
    headerText: {
      fontSize: fontSize["2xl"],
      fontWeight: fontWeight.bold,
      color: theme.foreground,
      marginBottom: spacing[4] * 16,
    },
    searchInput: {
      backgroundColor: theme.input,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.lg * 16,
      paddingHorizontal: spacing[4] * 16,
      paddingVertical: spacing[3] * 16,
      fontSize: fontSize.base,
      color: theme.foreground,
    },
    tabContainer: {
      flexDirection: "row" as const,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.background,
      paddingHorizontal: spacing[5] * 16,
      paddingVertical: spacing[3] * 16,
      gap: spacing[2] * 16,
    },
    tabButtonActive: {
      backgroundColor: theme.primary,
    },
    tabButtonInactive: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: theme.border,
    },
    tabButtonTextActive: {
      color: theme.primaryForeground,
    },
    tabButtonTextInactive: {
      color: theme.mutedForeground,
    },
    cardTitle: {
      marginBottom: spacing[2] * 16,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: theme.foreground,
    },
    cardDescription: {
      fontSize: fontSize.sm,
      lineHeight: spacing[5] * 16,
      color: theme.textSecondary,
    },
  };

  return (
    <View style={styles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerText}>Browse</Text>

        {/* Search Input */}
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Search bills, cases, and orders..."
          placeholderTextColor={theme.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      <View style={dynamicStyles.tabContainer}>
        {Object.values(tabs).map((tab) => (
          <TabButton
            key={tab.title}
            title={tab.title}
            active={tab.active}
            onPress={tab.onPress}
            theme={theme}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: theme.danger }]}>
              Error loading content
            </Text>
          </View>
        ) : filteredContent.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: theme.foreground }]}>
              No results found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.mutedForeground }]}>
              Try adjusting your search terms
            </Text>
          </View>
        ) : (
          <>
            {searchQuery.trim() && (
              <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
                Found {filteredContent.length} result
                {filteredContent.length !== 1 ? "s" : ""}
              </Text>
            )}
            {filteredContent.map((item) => (
              <ContentCardComponent key={item.id} item={item} theme={theme} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: fontWeight.medium,
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
    fontSize: fontSize.base,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptySubtext: {
    marginTop: spacing[2] * 16,
    fontSize: fontSize.sm,
  },
  resultsText: {
    fontSize: fontSize.sm,
    marginBottom: spacing[3] * 16,
    fontWeight: fontWeight.medium,
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
  cardButtonContainer: {
    width: "33.333%",
    flexDirection: "column",
    gap: spacing[3] * 16,
  },
});
