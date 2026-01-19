import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "~/components/Themed";
import {
  colors,
  fontSize,
  fontWeight,
  layout,
  settings,
  sp,
  typography,
  useTheme,
} from "~/styles";

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "toggle" | "navigation" | "action";
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dataUsage, setDataUsage] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          // Handle logout logic here
          console.log("User logged out");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Handle account deletion logic here
            console.log("Account deletion requested");
          },
        },
      ],
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      title: "Preferences",
      items: [
        {
          id: "notifications",
          title: "Push Notifications",
          subtitle: "Receive updates about new content and bills",
          type: "toggle",
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: "autoplay",
          title: "Autoplay Videos",
          subtitle: "Automatically play next video in feed",
          type: "toggle",
          value: autoplay,
          onToggle: setAutoplay,
        },
        {
          id: "darkMode",
          title: "Dark Mode",
          subtitle: "Use dark theme throughout the app",
          type: "toggle",
          value: darkMode,
          onToggle: setDarkMode,
        },
        {
          id: "dataUsage",
          title: "Reduce Data Usage",
          subtitle: "Lower video quality on cellular data",
          type: "toggle",
          value: dataUsage,
          onToggle: setDataUsage,
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          id: "interests",
          title: "Content Interests",
          subtitle: "Customize what types of content you see",
          type: "navigation",
          onPress: () => console.log("Navigate to content interests"),
        },
        {
          id: "blocked",
          title: "Blocked Content",
          subtitle: "Manage blocked users and topics",
          type: "navigation",
          onPress: () => console.log("Navigate to blocked content"),
        },
        {
          id: "saved",
          title: "Saved Articles",
          subtitle: "View your saved articles and videos",
          type: "navigation",
          onPress: () => console.log("Navigate to saved articles"),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          id: "profile",
          title: "Edit Profile",
          subtitle: "Update your profile information",
          type: "navigation",
          onPress: () => console.log("Navigate to profile edit"),
        },
        {
          id: "privacy",
          title: "Privacy Settings",
          subtitle: "Manage your privacy preferences",
          type: "navigation",
          onPress: () => console.log("Navigate to privacy settings"),
        },
        {
          id: "about",
          title: "About",
          subtitle: "App version and information",
          type: "navigation",
          onPress: () => console.log("Navigate to about"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          title: "Help & Support",
          subtitle: "Get help with the app",
          type: "navigation",
          onPress: () => console.log("Navigate to help"),
        },
        {
          id: "feedback",
          title: "Send Feedback",
          subtitle: "Report issues or suggest improvements",
          type: "navigation",
          onPress: () => console.log("Navigate to feedback"),
        },
        {
          id: "terms",
          title: "Terms & Privacy",
          subtitle: "Read our terms of service and privacy policy",
          type: "navigation",
          onPress: () => console.log("Navigate to terms"),
        },
      ],
    },
    {
      title: "Actions",
      items: [
        {
          id: "logout",
          title: "Logout",
          type: "action",
          onPress: handleLogout,
        },
        {
          id: "delete",
          title: "Delete Account",
          type: "action",
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => {
    switch (item.type) {
      case "toggle":
        return (
          <View
            key={item.id}
            style={[settings.item, { borderBottomColor: theme.border }]}
            lightColor="transparent"
            darkColor="transparent"
          >
            <View
              style={settings.itemTextContainer}
              lightColor="transparent"
              darkColor="transparent"
            >
              <Text style={[settings.itemTitle, { color: theme.foreground }]}>{item.title}</Text>
              {item.subtitle && (
                <Text style={[settings.itemSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
              )}
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: theme.muted, true: theme.primary }}
              thumbColor={colors.white}
            />
          </View>
        );

      case "navigation":
        return (
          <TouchableOpacity
            key={item.id}
            style={[settings.item, { borderBottomColor: theme.border }]}
            onPress={item.onPress}
          >
            <View
              style={settings.itemTextContainer}
              lightColor="transparent"
              darkColor="transparent"
            >
              <Text style={[settings.itemTitle, { color: theme.foreground }]}>{item.title}</Text>
              {item.subtitle && (
                <Text style={[settings.itemSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
              )}
            </View>
            <Text style={[settings.chevron, { color: theme.mutedForeground }]}>›</Text>
          </TouchableOpacity>
        );

      case "action":
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              settings.item,
              { borderBottomColor: theme.border },
              item.id === "delete" && localStyles.deleteAction,
            ]}
            onPress={item.onPress}
          >
            <Text
              style={[
                settings.itemTitle,
                { color: theme.foreground },
                item.id === "delete" && { color: theme.danger, textAlign: "center" },
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[layout.container, { backgroundColor: theme.background }]}>
      <View style={[localStyles.header, { paddingTop: insets.top + 20, borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[typography.h2, { color: theme.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        style={layout.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section) => (
          <View
            key={section.title}
            style={settings.section}
            lightColor="transparent"
            darkColor="transparent"
          >
            <Text style={[settings.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
            <View
              style={[settings.sectionContent, { borderColor: theme.border, backgroundColor: theme.card }]}
              lightColor={theme.card}
              darkColor={theme.card}
            >
              {section.items.map(renderSettingsItem)}
            </View>
          </View>
        ))}

        <View
          style={localStyles.versionContainer}
          lightColor="transparent"
          darkColor="transparent"
        >
          <Text style={[typography.caption, { color: theme.mutedForeground }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: sp[5],
    paddingBottom: sp[5],
  },
  deleteAction: {
    justifyContent: "center",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: sp(10),
  },
});
