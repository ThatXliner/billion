import type { PressableProps } from "react-native";
import React from "react";
import { Platform, Pressable } from "react-native";
import { openURL } from "expo-linking";
import * as WebBrowser from "expo-web-browser";

export function ExternalLink({
  href,
  ...props
}: Omit<PressableProps, "onPress"> & { href: string }) {
  const handlePress = async () => {
    if (Platform.OS === "web") {
      // On web, open in a new tab
      window.open(href, "_blank");
    } else {
      // On native, open in an in-app browser
      await WebBrowser.openBrowserAsync(href);
    }
  };

  return <Pressable {...props} onPress={handlePress} />;
}
