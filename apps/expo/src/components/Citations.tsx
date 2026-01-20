import { StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Text, View } from "./Themed";
import { colors, rd, sp, typography, useTheme } from "~/styles";

interface Citation {
  number: number;
  text: string;
  url: string;
  title?: string;
}

interface CitationsProps {
  citations: Citation[];
}

export function Citations({ citations }: CitationsProps) {
  const { theme } = useTheme();

  if (!citations || citations.length === 0) {
    return null;
  }

  const handleCitationPress = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  };

  return (
    <View
      style={[
        localStyles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <View
        style={[
          localStyles.header,
          { backgroundColor: "transparent" },
        ]}
      >
        <Ionicons
          name="library-outline"
          size={16}
          color={theme.textSecondary}
          style={localStyles.icon}
        />
        <Text
          style={[
            localStyles.headerText,
            { color: theme.textSecondary },
          ]}
        >
          Sources
        </Text>
      </View>

      <View style={{ backgroundColor: "transparent" }}>
        {citations.map((citation, index) => (
          <TouchableOpacity
            key={citation.number}
            style={[
              localStyles.citation,
              {
                borderTopColor: theme.border,
                borderTopWidth: index === 0 ? 0 : 1,
              },
            ]}
            onPress={() => handleCitationPress(citation.url)}
            activeOpacity={0.7}
          >
            <View
              style={[
                localStyles.citationNumber,
                {
                  backgroundColor: colors.cyan[600],
                },
              ]}
              lightColor="transparent"
              darkColor="transparent"
            >
              <Text
                style={[
                  localStyles.citationNumberText,
                  { color: colors.white },
                ]}
              >
                {citation.number}
              </Text>
            </View>

            <View
              style={[localStyles.citationContent, { backgroundColor: "transparent" }]}
            >
              <Text
                style={[
                  localStyles.citationText,
                  { color: theme.foreground },
                ]}
                numberOfLines={2}
              >
                {citation.text}
              </Text>
              <Text
                style={[
                  localStyles.citationUrl,
                  { color: colors.cyan[500] },
                ]}
                numberOfLines={1}
              >
                {citation.url.replace(/^https?:\/\//i, "")}
              </Text>
            </View>

            <Ionicons
              name="open-outline"
              size={18}
              color={theme.textSecondary}
              style={localStyles.openIcon}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View
        style={[
          localStyles.footer,
          {
            backgroundColor: "transparent",
            borderTopColor: theme.border,
          },
        ]}
      >
        <Text
          style={[
            localStyles.footerText,
            { color: theme.textSecondary },
          ]}
        >
          Tap any source to verify information
        </Text>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    borderRadius: rd["lg"],
    borderWidth: 1,
    marginTop: sp[5],
    marginBottom: sp[5],
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
  },
  icon: {
    marginRight: sp[2],
  },
  headerText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  citation: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    gap: sp[3],
  },
  citationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  citationNumberText: {
    fontSize: 12,
    fontWeight: "700",
  },
  citationContent: {
    flex: 1,
    gap: sp[1],
  },
  citationText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  citationUrl: {
    fontSize: 12,
    fontWeight: "400",
  },
  openIcon: {
    flexShrink: 0,
  },
  footer: {
    paddingHorizontal: sp[4],
    paddingVertical: sp[2],
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "400",
    textAlign: "center",
  },
});
