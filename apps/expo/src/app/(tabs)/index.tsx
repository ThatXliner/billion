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
import { Image } from 'expo-image';
import type { VideoPost } from "@acme/api";
import { Button } from "@acme/ui/button-native";

import { Text, View } from "~/components/Themed";
// import { WireframeWave } from "~/components/WireframeWave";
import {
  buttons,
  cards,
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
  imageUri?: string; // Add support for AI-generated data URIs
}

const ContentCardComponent = ({
  item,
  theme,
}: {
  item: ContentCard;
  theme: Theme;
}) => {
  const router = useRouter();

  // Smart title display logic
  const getDisplayTitle = (title: string) => {
    if (title.length <= 60) {
      return title;
    }
    // For long titles, truncate intelligently at sentence or phrase boundaries
    const truncated = title.substring(0, 57);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 40 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  };

  const getTitleFontSize = (titleLength: number) => {
      if (titleLength < 40) return fontSize.xl;      // ~20px for short titles
      if (titleLength < 60) return fontSize.lg;      // ~18px for medium titles
      if (titleLength < 80) return fontSize.base;    // ~16px for longer titles
      return fontSize.sm;                            // ~14px for very long titles
    };

  const displayTitle = getDisplayTitle(item.title);
  const titleFontSize = getTitleFontSize(displayTitle.length);

  return (
    <TouchableOpacity
      style={[
        cards.bordered,
        styles.modernCard,
        {
          backgroundColor: theme.card,
          borderColor: colors.cyan[600],
          borderWidth: 0
        },
      ]}
      onPress={() => {
        router.push(`/article-detail?id=${item.id}`);
      }}
      activeOpacity={0.9}
    >
      <View
        style={styles.modernCardContent}
        lightColor="transparent"
        darkColor="transparent"
      >
        {/* Category label */}
        <Text style={[styles.categoryLabel, { color: theme.mutedForeground }]}>
          {item.type === "bill" ? "Bill" : item.type === "government_content" ? "Gov Content" : item.type === "court_case" ? "Case" : "General"}
        </Text>

        {/* Title with hybrid image support */}
        <View style={{backgroundColor: theme.card, flex:1,flexDirection:'row', gap: sp[3],}}>
          {item.imageUri ? (
            <Image
              style={{ width: 50, height: 50, borderRadius: 8 }}
              source={{ uri: item.imageUri }}
              contentFit="cover"
              transition={300}
            />
          ) : item.thumbnailUrl ? (
            <Image
              style={{ width: 50, height: 50, borderRadius: 8 }}
              source={{ uri: item.thumbnailUrl }}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 8,
              backgroundColor: theme.muted,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ color: theme.mutedForeground, fontSize: fontSize.xl }}>
                {item.type === 'bill' ? '📜' : item.type === 'court_case' ? '⚖️' : '🏛️'}
              </Text>
            </View>
          )}
          <Text
                  style={[
                    typography.h3,
                    {
                      color: theme.foreground,
                      fontSize: titleFontSize,
                      flex: 1
                    },
                  ]}
                >
                  {displayTitle}
              </Text>
        </View>


        {/* Description */}
        <Text
          style={[
            typography.bodySmall,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          {item.description}
        </Text>

        {/* Action buttons */}
        {/*<View style={styles.buttonContainer}>*/}
          {/*<Button
            variant="default"
            size="sm"
            style={styles.modernCardButton}
            onPress={() => {
              router.push(`/article-detail?id=${item.id}`);
            }}
          >
            Watch Short
          </Button>*/}
          <Button
            variant="outline"
            size="sm"
            style={styles.modernCardButton}
            onPress={() => {
              router.push(`/article-detail?id=${item.id}`);
            }}
          >
            Read More
          </Button>
        {/*</View>*/}
      </View>
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
    court_case: {
      title: "Cases",
      active: selectedTab === "court_case",
      onPress: () => setSelectedTab("court_case"),
    },
    government_content: {
      title: "Gov Content",
      active: selectedTab === "government_content",
      onPress: () => setSelectedTab("government_content"),
    },
  };

  // Dynamic styles using helper functions
  const headerStyles = createHeaderStyles(theme, insets.top);
  const searchStyles = createSearchStyles(theme);
  const tabContainerStyles = createTabContainerStyles(theme);

  return (
    <View style={layout.container}>
      {/* Wireframe wave background decoration */}
      {/*<WireframeWave />*/}

      <View style={headerStyles.container}>
        <Text style={headerStyles.title}>Browse</Text>

        {/* Search Input */}
        <TextInput
          style={searchStyles}
          placeholder="Search bills, cases..."
          placeholderTextColor={theme.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      <View style={tabContainerStyles}>
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
            <Text style={[typography.h4, { color: theme.foreground }]}>
              No results found
            </Text>
            <Text style={[typography.bodySmall, styles.emptySubtext, { color: theme.mutedForeground }]}>
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
  scrollView: {
    flex: 1,
    padding: sp[5],
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sp[10],
  },
  errorText: {
    fontSize: fontSize.base,
  },
  emptySubtext: {
    marginTop: sp[2],
  },
  resultsText: {
    fontSize: fontSize.sm,
    marginBottom: sp[3],
    fontWeight: fontWeight.medium,
  },
  // Modern card styles
  modernCard: {
    marginBottom: sp[4],
  },
  modernCardContent: {
    gap: sp[3],
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: sp[1],
  },
  buttonContainer: {
    flexDirection: "row",
    gap: sp[3],
    marginTop: sp[2],
  },
  modernCardButton: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
