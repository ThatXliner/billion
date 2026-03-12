import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { Image } from "expo-image";
import type { VideoPost } from "@acme/api";

import { Text, View } from "~/components/Themed";
import {
  buttons,
  colors,
  createHeaderStyles,
  createSearchStyles,
  createTabContainerStyles,
  fontSize,
  fontWeight,
  layout,
  sp,
  type Theme,
  typography,
  useTheme,
} from "~/styles";
import { trpc } from "~/utils/api";

interface ContentCard {
  id: string;
  title: string;
  description: string;
  type: "bill" | "government_content" | "court_case" | "general";
  isAIGenerated: boolean;
  thumbnailUrl?: string;
  imageUri?: string;
}

const ContentCardComponent = ({
  item,
  theme,
}: {
  item: ContentCard;
  theme: Theme;
}) => {
  const router = useRouter();

  const getDisplayTitle = (title: string) => {
    if (title.length <= 60) return title;
    const truncated = title.substring(0, 57);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 40
      ? truncated.substring(0, lastSpace) + "..."
      : truncated + "...";
  };

  const getTitleFontSize = (len: number) => {
    if (len < 40) return fontSize.xl;
    if (len < 60) return fontSize.lg;
    if (len < 80) return fontSize.base;
    return fontSize.sm;
  };

  const typeLabel =
    item.type === "bill"
      ? "BILL"
      : item.type === "government_content"
        ? "ORDER"
        : item.type === "court_case"
          ? "CASE"
          : "NEWS";

  const typeBadgeColor =
    item.type === "bill"
      ? colors.bill
      : item.type === "government_content"
        ? colors.executive
        : item.type === "court_case"
          ? colors.case
          : colors.general;

  const displayTitle = getDisplayTitle(item.title);
  const titleFontSize = getTitleFontSize(displayTitle.length);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={() => router.push(`/article-detail?id=${item.id}`)}
      activeOpacity={0.85}
    >
      {/* Left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: typeBadgeColor }]} />

      <View style={styles.cardBody}>
        {/* Type badge */}
        <View
          style={[styles.typeBadge, { backgroundColor: typeBadgeColor + "22" }]}
        >
          <Text style={[styles.typeBadgeText, { color: typeBadgeColor }]}>
            {typeLabel}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.cardTitle,
            { color: theme.foreground, fontSize: titleFontSize },
          ]}
        >
          {displayTitle}
        </Text>

        {/* Description */}
        {item.description ? (
          <Text
            style={[styles.cardDescription, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}

        <Text style={[styles.readMore, { color: typeBadgeColor }]}>
          Read More →
        </Text>
      </View>

      {/* Thumbnail */}
      {item.imageUri ?? item.thumbnailUrl ? (
        <Image
          style={styles.thumbnail}
          source={{ uri: item.imageUri ?? item.thumbnailUrl }}
          contentFit="cover"
          transition={300}
        />
      ) : null}
    </TouchableOpacity>
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
  theme: Theme;
}) => (
  <TouchableOpacity
    style={[
      buttons.tab,
      { borderRadius: 9999 },
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
        buttons.tabText,
        {
          color: active ? theme.primaryForeground : theme.mutedForeground,
          fontFamily: "AlbertSans-Medium",
        },
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<VideoPost["type"] | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: content,
    isLoading,
    error,
  } = useQuery(
    trpc.content.getByType.queryOptions({
      type: selectedTab,
    }),
  );

  const fuse = useMemo(() => {
    if (!content) return null;
    return new Fuse(content, {
      keys: ["title", "description"],
      threshold: 0.3,
      includeScore: true,
    });
  }, [content]);

  const filteredContent = useMemo(() => {
    if (!content) return [];
    if (!searchQuery.trim()) return content;
    if (!fuse) return content;
    return fuse.search(searchQuery).map((r) => r.item);
  }, [content, searchQuery, fuse]);

  const tabs = [
    { key: "all", title: "All" },
    { key: "bill", title: "Bills" },
    { key: "court_case", title: "Cases" },
    { key: "government_content", title: "Orders" },
  ] as const;

  const headerStyles = createHeaderStyles(theme, insets.top);
  const searchStyles = createSearchStyles(theme);
  const tabContainerStyles = createTabContainerStyles(theme);

  return (
    <View style={layout.container}>
      <View style={headerStyles.container}>
        <Text
          style={[
            headerStyles.title,
            { fontFamily: "IBMPlexSerif-Bold" },
          ]}
        >
          Browse
        </Text>

        <TextInput
          style={searchStyles}
          placeholder="Search bills, cases, orders…"
          placeholderTextColor={theme.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      <View style={tabContainerStyles}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            title={tab.title}
            active={selectedTab === tab.key}
            onPress={() => setSelectedTab(tab.key)}
            theme={theme}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[typography.bodySmall, { color: theme.danger }]}>
              Unable to load content
            </Text>
          </View>
        ) : filteredContent.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[typography.h4, { color: theme.foreground }]}>
              Nothing found
            </Text>
            <Text
              style={[
                typography.bodySmall,
                { color: theme.mutedForeground, marginTop: sp[2] },
              ]}
            >
              Try a different search or filter
            </Text>
          </View>
        ) : (
          <>
            {searchQuery.trim() ? (
              <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
                {filteredContent.length} result
                {filteredContent.length !== 1 ? "s" : ""}
              </Text>
            ) : null}
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
  scrollView: {
    flex: 1,
    paddingHorizontal: sp[5],
    paddingTop: sp[4],
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sp[10],
  },
  resultsText: {
    fontSize: fontSize.sm,
    fontFamily: "AlbertSans-Medium",
    marginBottom: sp[3],
  },
  // Card
  card: {
    flexDirection: "row",
    borderRadius: 14,
    marginBottom: sp[4],
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardAccent: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    padding: sp[4],
    gap: sp[2],
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: sp[2],
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: sp[1],
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: "AlbertSans-Bold",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: "InriaSerif-Bold",
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    fontFamily: "AlbertSans-Regular",
    lineHeight: 18,
  },
  readMore: {
    fontSize: fontSize.sm,
    fontFamily: "AlbertSans-Medium",
    marginTop: sp[1],
  },
  thumbnail: {
    width: 80,
    height: "100%" as unknown as number,
  },
});
