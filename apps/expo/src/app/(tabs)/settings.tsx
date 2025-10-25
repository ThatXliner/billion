import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fontSize, fontWeight, spacing } from "@acme/ui/theme-tokens";

import { Text, View } from "~/components/Themed";

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
          <View key={item.id} style={styles.settingsItem}>
            <View style={styles.settingsItemTextContainer}>
              <Text style={styles.settingsItemTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingsItemSubtitle}>{item.subtitle}</Text>
              )}
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: "#e0e0e0", true: colors.blue[500] }}
              thumbColor={colors.white}
            />
          </View>
        );

      case "navigation":
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.settingsItem}
            onPress={item.onPress}
          >
            <View style={styles.settingsItemTextContainer}>
              <Text style={styles.settingsItemTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingsItemSubtitle}>{item.subtitle}</Text>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );

      case "action":
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.settingsItem,
              item.id === "delete" && styles.deleteAction,
            ]}
            onPress={item.onPress}
          >
            <Text
              style={[
                styles.settingsItemTitle,
                item.id === "delete" && styles.deleteText,
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerText}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingsItem)}
            </View>
          </View>
        ))}

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5] * 16,
    paddingBottom: spacing[5] * 16,
  },
  headerText: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[800],
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: spacing[8] * 16,
  },
  sectionTitle: {
    marginHorizontal: spacing[5] * 16,
    marginBottom: spacing[3] * 16,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.gray[600],
  },
  sectionContent: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    paddingHorizontal: spacing[5] * 16,
    paddingVertical: spacing[4] * 16,
  },
  settingsItemTextContainer: {
    flex: 1,
  },
  settingsItemTitle: {
    marginBottom: spacing[1] * 16,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[800],
  },
  settingsItemSubtitle: {
    fontSize: fontSize.sm,
    lineHeight: spacing[5] * 16,
    color: colors.gray[600],
  },
  chevron: {
    marginLeft: spacing[3] * 16,
    fontSize: fontSize.xl,
    color: colors.gray[300],
  },
  deleteAction: {
    justifyContent: "center",
  },
  deleteText: {
    textAlign: "center",
    color: colors.red[500],
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: spacing[10] * 16,
  },
  versionText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
});
