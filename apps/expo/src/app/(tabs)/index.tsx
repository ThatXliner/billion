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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
  rd,
  type Theme,
  typography,
  useTheme,
} from "~/styles";
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
  theme: Theme;
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[
        cards.bordered,
        styles.modernCard,
        {
          backgroundColor: theme.card,
          borderColor: colors.cyan[600],
        },
      ]}
      onPress={() => {
        router.push(`/article-detail?id=${item.id}`);
      }}
      activeOpacity={0.9}
    >
      <BlurView
        style={styles.modernCardContent}
        lightColor="transparent"
        darkColor="transparent"
      >
        {/* Category label */}
        <Text style={[styles.categoryLabel, { color: theme.mutedForeground }]}>
          Presidential Message
        </Text>

        {/* Title */}
        <Text
          style={[
            typography.h3,
            {
              color: theme.foreground,
            },
          ]}
        >
          {item.title}
        </Text>

        {/* Description */}
        <Text
          style={[
            typography.bodySmall,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          Summary: {item.description}
        </Text>

        {/* Single gradient button */}
        <Button
          variant="default"
          size="sm"
          style={styles.modernCardButton}
          onPress={() => {
            router.push(`/article-detail?id=${item.id}`);
          }}
        >
          Watch Short
        </Button>
      </BlurView>
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

  // Dynamic styles using helper functions
  const headerStyles = createHeaderStyles(theme, insets.top);
  const searchStyles = createSearchStyles(theme);
  const tabContainerStyles = createTabContainerStyles(theme);

  return (
    <BlurView style={layout.container} intensity={50} tint="light">
      <LinearGradient
          // colors={['#120c4f', '#3b2fa3']}
          colors={['#0f0c29', // near-black indigo
            '#302b63', // deep violet
            '#3f3a8a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/*<LinearGradient
          colors={['rgba(255,255,255,0.08)', 'transparent']}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={StyleSheet.absoluteFill}
        />*/}
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
    </BlurView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: sp[5],
  },
  centerContainer: {
    borderRadius: rd.xl,
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
  modernCardButton: {
    alignSelf: "flex-start",
    marginTop: sp[2],
  },
});
