import { ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useState } from "react";
import { Text, View } from "@/components/Themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'action';
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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // Handle logout logic here
          console.log('User logged out');
        }}
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Handle account deletion logic here
          console.log('Account deletion requested');
        }}
      ]
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive updates about new content and bills',
          type: 'toggle',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: 'autoplay',
          title: 'Autoplay Videos',
          subtitle: 'Automatically play next video in feed',
          type: 'toggle',
          value: autoplay,
          onToggle: setAutoplay,
        },
        {
          id: 'darkMode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme throughout the app',
          type: 'toggle',
          value: darkMode,
          onToggle: setDarkMode,
        },
        {
          id: 'dataUsage',
          title: 'Reduce Data Usage',
          subtitle: 'Lower video quality on cellular data',
          type: 'toggle',
          value: dataUsage,
          onToggle: setDataUsage,
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          id: 'interests',
          title: 'Content Interests',
          subtitle: 'Customize what types of content you see',
          type: 'navigation',
          onPress: () => console.log('Navigate to content interests'),
        },
        {
          id: 'blocked',
          title: 'Blocked Content',
          subtitle: 'Manage blocked users and topics',
          type: 'navigation',
          onPress: () => console.log('Navigate to blocked content'),
        },
        {
          id: 'saved',
          title: 'Saved Articles',
          subtitle: 'View your saved articles and videos',
          type: 'navigation',
          onPress: () => console.log('Navigate to saved articles'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          subtitle: 'Update your profile information',
          type: 'navigation',
          onPress: () => console.log('Navigate to profile edit'),
        },
        {
          id: 'privacy',
          title: 'Privacy Settings',
          subtitle: 'Manage your privacy preferences',
          type: 'navigation',
          onPress: () => console.log('Navigate to privacy settings'),
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and information',
          type: 'navigation',
          onPress: () => console.log('Navigate to about'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help with the app',
          type: 'navigation',
          onPress: () => console.log('Navigate to help'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Report issues or suggest improvements',
          type: 'navigation',
          onPress: () => console.log('Navigate to feedback'),
        },
        {
          id: 'terms',
          title: 'Terms & Privacy',
          subtitle: 'Read our terms of service and privacy policy',
          type: 'navigation',
          onPress: () => console.log('Navigate to terms'),
        },
      ],
    },
    {
      title: 'Actions',
      items: [
        {
          id: 'logout',
          title: 'Logout',
          type: 'action',
          onPress: handleLogout,
        },
        {
          id: 'delete',
          title: 'Delete Account',
          type: 'action',
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <View
            key={item.id}
            className="flex-row items-center px-5 py-4 border-b border-gray-100"
          >
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-800 mb-1">
                {item.title}
              </Text>
              {item.subtitle && (
                <Text className="text-sm text-gray-600 leading-5">
                  {item.subtitle}
                </Text>
              )}
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: "#e0e0e0", true: "#007AFF" }}
              thumbColor={item.value ? "#fff" : "#fff"}
            />
          </View>
        );

      case 'navigation':
        return (
          <TouchableOpacity
            key={item.id}
            className="flex-row items-center px-5 py-4 border-b border-gray-100"
            onPress={item.onPress}
          >
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-800 mb-1">
                {item.title}
              </Text>
              {item.subtitle && (
                <Text className="text-sm text-gray-600 leading-5">
                  {item.subtitle}
                </Text>
              )}
            </View>
            <Text className="text-xl text-gray-300 ml-3">›</Text>
          </TouchableOpacity>
        );

      case 'action':
        return (
          <TouchableOpacity
            key={item.id}
            className={`flex-row items-center px-5 py-4 border-b border-gray-100 ${
              item.id === "delete" ? "justify-center" : ""
            }`}
            onPress={item.onPress}
          >
            <Text
              className={`text-base font-medium ${
                item.id === "delete"
                  ? "text-red-500 text-center"
                  : "text-gray-800"
              }`}
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
    <View className="flex-1 bg-gray-100">
      <View className="px-5 pb-5 bg-white border-b border-gray-200" style={{ paddingTop: insets.top + 20 }}>
        <Text className="text-2xl font-bold text-gray-800">Settings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {settingsSections.map((section) => (
          <View key={section.title} className="mt-8">
            <Text className="text-base font-semibold text-gray-600 mx-5 mb-3 uppercase tracking-wide">
              {section.title}
            </Text>
            <View className="bg-white border-t border-b border-gray-200">
              {section.items.map(renderSettingsItem)}
            </View>
          </View>
        ))}

        <View className="py-10 items-center">
          <Text className="text-sm text-gray-400">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}
