import type { Href } from "expo-router";
import type React from "react";
import { Platform } from "react-native";
import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";

type HrefString<T = Href> = T extends string ? T : never;
export function ExternalLink(
  props: Omit<React.ComponentProps<typeof Link>, "href"> & { href: HrefString },
) {
  return (
    <Link
      target="_blank"
      {...props}
      href={props.href}
      onPress={(e) => {
        if (Platform.OS !== "web") {
          // Prevent the default behavior of linking to the default browser on native.
          e.preventDefault();
          // Open the link in an in-app browser.
          void WebBrowser.openBrowserAsync(props.href);
        }
      }}
    />
  );
}
